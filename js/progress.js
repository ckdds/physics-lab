// 진행률과 학습 기록을 브라우저 localStorage에 저장한다.
// 다른 기기·다른 브라우저와는 동기화되지 않으므로, 필요하면 JSON으로 내보내 옮긴다.

import { TOTAL_WEEKS, weekKey } from './lesson-data.js';

const STORAGE_KEY = 'physicsLab.progress';
export const SCHEMA_VERSION = 1;
export const RECORD_FIELDS = ['prediction', 'observation', 'debugNotes', 'reflection', 'aiCheck'];
const MAX_TEXT_LENGTH = 4000;
const MAX_CHANGED_VALUES = 30;

let memoryFallback = null;
let storageAvailable = true;

export function emptyProgress() {
  return { schemaVersion: SCHEMA_VERSION, completedWeeks: [], visitedWeeks: [], lessons: {} };
}

export function isStorageAvailable() {
  return storageAvailable;
}

export function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const result = validateProgress(JSON.parse(raw));
    return result.ok ? result.data : emptyProgress();
  } catch {
    storageAvailable = false;
    return memoryFallback ? structuredClone(memoryFallback) : emptyProgress();
  }
}

function writeProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    storageAvailable = true;
  } catch {
    // 시크릿 모드·저장 공간 부족 등. 페이지를 닫기 전까지만 메모리에 보관한다.
    storageAvailable = false;
    memoryFallback = structuredClone(progress);
  }
  window.dispatchEvent(new CustomEvent('progress-changed'));
}

function update(mutator) {
  const progress = loadProgress();
  mutator(progress);
  writeProgress(progress);
  return progress;
}

export function markVisited(week) {
  update((p) => {
    if (!p.visitedWeeks.includes(week)) p.visitedWeeks.push(week);
    p.visitedWeeks.sort((a, b) => a - b);
  });
}

export function setCompleted(week, completed) {
  update((p) => {
    p.completedWeeks = p.completedWeeks.filter((w) => w !== week);
    if (completed) p.completedWeeks.push(week);
    p.completedWeeks.sort((a, b) => a - b);
  });
}

export function isCompleted(week) {
  return loadProgress().completedWeeks.includes(week);
}

export function getLessonRecord(week) {
  return loadProgress().lessons[weekKey(week)] ?? null;
}

export function saveLessonRecord(week, record) {
  const clean = sanitizeRecord(record);
  clean.savedAt = new Date().toISOString();
  update((p) => {
    p.lessons[weekKey(week)] = clean;
  });
  return clean;
}

export function hasLessonRecord(progress, week) {
  const rec = progress.lessons[weekKey(week)];
  if (!rec) return false;
  return RECORD_FIELDS.some((f) => rec[f] && rec[f].trim() !== '') || Object.keys(rec.changedValues ?? {}).length > 0;
}

export function resetProgress() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 저장소를 쓸 수 없는 환경 */
  }
  memoryFallback = null;
  window.dispatchEvent(new CustomEvent('progress-changed'));
}

export function exportProgress() {
  const progress = loadProgress();
  const data = { ...progress, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `physics-lab-record-${date}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 가져온 JSON 텍스트를 검증하고 적용한다. 반환값: { ok, error? }
export function importProgressText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'JSON 형식이 아닙니다. 내보내기로 만든 .json 파일인지 확인하세요.' };
  }
  const result = validateProgress(parsed);
  if (!result.ok) return result;
  writeProgress(result.data);
  return { ok: true, data: result.data };
}

function isWeekNumber(n) {
  return Number.isInteger(n) && n >= 1 && n <= TOTAL_WEEKS;
}

function sanitizeText(value) {
  return typeof value === 'string' ? value.slice(0, MAX_TEXT_LENGTH) : '';
}

function sanitizeRecord(record) {
  const clean = {};
  for (const field of RECORD_FIELDS) clean[field] = sanitizeText(record?.[field]);
  clean.changedValues = {};
  const values = record?.changedValues;
  if (values && typeof values === 'object' && !Array.isArray(values)) {
    for (const [key, value] of Object.entries(values).slice(0, MAX_CHANGED_VALUES)) {
      if (!/^[A-Za-z][A-Za-z0-9]{0,40}$/.test(key)) continue;
      if (typeof value === 'number' && Number.isFinite(value)) clean.changedValues[key] = value;
      else if (typeof value === 'string') clean.changedValues[key] = value.slice(0, 100);
      else if (typeof value === 'boolean') clean.changedValues[key] = value;
    }
  }
  if (typeof record?.savedAt === 'string' && !Number.isNaN(Date.parse(record.savedAt))) clean.savedAt = record.savedAt;
  return clean;
}

export function validateProgress(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: '기록 파일의 구조가 올바르지 않습니다.' };
  }
  if (data.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, error: `지원하지 않는 기록 버전입니다 (schemaVersion: ${String(data.schemaVersion)}).` };
  }
  if (!Array.isArray(data.completedWeeks) || !data.completedWeeks.every(isWeekNumber)) {
    return { ok: false, error: 'completedWeeks에는 1~24 사이의 주차 번호만 들어갈 수 있습니다.' };
  }
  const visited = data.visitedWeeks ?? [];
  if (!Array.isArray(visited) || !visited.every(isWeekNumber)) {
    return { ok: false, error: 'visitedWeeks에는 1~24 사이의 주차 번호만 들어갈 수 있습니다.' };
  }
  const lessons = data.lessons ?? {};
  if (typeof lessons !== 'object' || Array.isArray(lessons)) {
    return { ok: false, error: 'lessons 항목의 구조가 올바르지 않습니다.' };
  }
  const cleanLessons = {};
  for (const [key, record] of Object.entries(lessons)) {
    const match = /^week(\d{2})$/.exec(key);
    if (!match || !isWeekNumber(Number(match[1]))) {
      return { ok: false, error: `알 수 없는 주차 키입니다: ${key}` };
    }
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      return { ok: false, error: `${key} 기록의 구조가 올바르지 않습니다.` };
    }
    cleanLessons[key] = sanitizeRecord(record);
  }
  return {
    ok: true,
    data: {
      schemaVersion: SCHEMA_VERSION,
      completedWeeks: [...new Set(data.completedWeeks)].sort((a, b) => a - b),
      visitedWeeks: [...new Set(visited)].sort((a, b) => a - b),
      lessons: cleanLessons,
    },
  };
}
