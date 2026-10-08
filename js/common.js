// 교안 페이지 공통 기능: 주차 이동, 목차, 실제 코드 불러오기, 복사, 학습 기록, 완료 표시.

import { getWeek, getPart, weekKey } from './lesson-data.js';
import {
  markVisited,
  setCompleted,
  isCompleted,
  getLessonRecord,
  saveLessonRecord,
  exportProgress,
  isStorageAvailable,
  RECORD_FIELDS,
} from './progress.js';

// ES Module이 실행되면 '로컬 서버로 열어 주세요' 안내를 숨긴다.
export function hideModuleNotice() {
  document.documentElement.classList.add('js-ready');
}

export function showStorageWarning() {
  if (isStorageAvailable()) return;
  const box = document.querySelector('[data-storage-warning]');
  if (box) box.hidden = false;
}

/**
 * 교안 페이지를 초기화한다.
 * lab: 시뮬레이션 모듈이 반환한 객체 { getParams(), paramLabels }
 */
export function initLesson({ week, lab }) {
  hideModuleNotice();
  markVisited(week);
  renderWeekNav(week);
  buildToc();
  loadCodeRegions();
  bindCopyButtons(document);
  bindRecord(week, lab);
  bindCompletion(week);
  showStorageWarning();
}

function renderWeekNav(week) {
  const info = getWeek(week);
  const part = getPart(info.part);
  for (const el of document.querySelectorAll('[data-part-label]')) {
    el.textContent = `Part ${part.id}. ${part.title}`;
  }
  for (const nav of document.querySelectorAll('[data-week-nav]')) {
    nav.replaceChildren(
      navLink(week - 1, '← 이전 주차'),
      dashboardLink(),
      navLink(week + 1, '다음 주차 →'),
    );
  }
}

function dashboardLink() {
  const a = document.createElement('a');
  a.href = '../index.html';
  a.className = 'btn btn-ghost';
  a.textContent = '대시보드';
  return a;
}

function navLink(target, label) {
  const info = getWeek(target);
  if (info?.available) {
    const a = document.createElement('a');
    a.href = `${weekKey(target)}.html`;
    a.className = 'btn btn-ghost';
    a.textContent = `${label} (${target}주)`;
    return a;
  }
  const span = document.createElement('span');
  span.className = 'btn btn-ghost is-disabled';
  span.setAttribute('aria-disabled', 'true');
  span.textContent = info ? `${label} (${target}주 준비 중)` : label;
  if (!info) span.hidden = true;
  return span;
}

function buildToc() {
  const toc = document.querySelector('[data-toc]');
  if (!toc) return;
  const sections = [...document.querySelectorAll('main section[id] > h2')];
  const list = document.createElement('ol');
  const links = new Map();
  for (const h2 of sections) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${h2.parentElement.id}`;
    a.textContent = h2.dataset.short ?? h2.textContent;
    li.append(a);
    list.append(li);
    links.set(h2.parentElement, a);
  }
  toc.replaceChildren(list);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const a of links.values()) a.removeAttribute('aria-current');
        links.get(entry.target)?.setAttribute('aria-current', 'true');
      }
    },
    { rootMargin: '-20% 0px -70% 0px' },
  );
  for (const section of links.keys()) observer.observe(section);
}

// <pre data-src="파일" data-region="이름"> 에 실제 실행 코드의 해당 구간을 채운다.
// 소스 파일에서 '// #region 이름' 과 '// #endregion' 사이를 잘라 오므로, 화면의 코드와 실행 코드가 항상 같다.
const sourceCache = new Map();

async function fetchSource(src) {
  if (!sourceCache.has(src)) {
    sourceCache.set(
      src,
      fetch(src).then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.text();
      }),
    );
  }
  return sourceCache.get(src);
}

export function extractRegion(source, name) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `// #region ${name}`);
  if (start === -1) return null;
  const end = lines.findIndex((l, i) => i > start && l.trim() === '// #endregion');
  if (end === -1) return null;
  const body = lines.slice(start + 1, end);
  const indent = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return body.map((l) => l.slice(Number.isFinite(indent) ? indent : 0)).join('\n');
}

async function loadCodeRegions() {
  for (const pre of document.querySelectorAll('pre[data-src][data-region]')) {
    const code = pre.querySelector('code') ?? pre.appendChild(document.createElement('code'));
    try {
      const text = extractRegion(await fetchSource(pre.dataset.src), pre.dataset.region);
      code.textContent = text ?? `// 코드 구간 '${pre.dataset.region}'을 찾지 못했습니다.`;
    } catch {
      code.textContent = '// 코드를 불러오지 못했습니다. README의 안내대로 로컬 서버에서 열었는지 확인하세요.';
    }
    const fileLabel = pre.closest('.code-block')?.querySelector('[data-file-label]');
    if (fileLabel) fileLabel.textContent = pre.dataset.src.replace(/^\.\.\//, '');
  }
}

export function bindCopyButtons(root) {
  for (const btn of root.querySelectorAll('[data-copy-target]')) {
    btn.addEventListener('click', async () => {
      const target = document.getElementById(btn.dataset.copyTarget);
      const text = target?.textContent ?? '';
      const original = btn.textContent;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = '복사됨';
      } catch {
        btn.textContent = '직접 선택해 복사하세요';
      }
      setTimeout(() => {
        btn.textContent = original;
      }, 1500);
    });
  }
}

// ---- 학습 기록 ----

function bindRecord(week, lab) {
  const fields = [...document.querySelectorAll('[data-record-field]')];
  const status = document.querySelector('[data-record-status]');
  const valuesBox = document.querySelector('[data-changed-values]');
  const saved = getLessonRecord(week);
  let changedValues = saved?.changedValues ?? {};

  for (const el of fields) {
    const key = el.dataset.recordField;
    if (!RECORD_FIELDS.includes(key)) continue;
    el.value = saved?.[key] ?? '';
  }
  renderChangedValues(valuesBox, changedValues, lab?.paramLabels ?? {});
  if (saved?.savedAt) setStatus(status, `저장됨 · ${formatTime(saved.savedAt)}`);

  const collect = () => {
    const record = { changedValues };
    for (const field of RECORD_FIELDS) {
      // 같은 항목의 입력 칸은 input 이벤트에서 서로 동기화되므로 첫 번째 칸만 읽으면 된다.
      const el = fields.find((f) => f.dataset.recordField === field);
      record[field] = el ? el.value : saved?.[field] ?? '';
    }
    return record;
  };

  const save = () => {
    const result = saveLessonRecord(week, collect());
    setStatus(status, isStorageAvailable() ? `저장됨 · ${formatTime(result.savedAt)}` : '임시 저장됨(이 브라우저에서는 새로고침하면 사라집니다)');
  };

  let timer = null;
  for (const el of fields) {
    el.addEventListener('input', () => {
      for (const other of fields) {
        if (other !== el && other.dataset.recordField === el.dataset.recordField) other.value = el.value;
      }
      setStatus(status, '입력 중…');
      clearTimeout(timer);
      timer = setTimeout(save, 600);
    });
  }

  document.querySelector('[data-action="save-record"]')?.addEventListener('click', () => {
    clearTimeout(timer);
    save();
  });
  document.querySelector('[data-action="capture-values"]')?.addEventListener('click', () => {
    if (!lab?.getParams) return;
    changedValues = lab.getParams();
    renderChangedValues(valuesBox, changedValues, lab.paramLabels ?? {});
    save();
  });
  document.querySelector('[data-action="export-record"]')?.addEventListener('click', () => {
    clearTimeout(timer);
    save();
    exportProgress();
  });
}

function renderChangedValues(box, values, labels) {
  if (!box) return;
  const entries = Object.entries(values);
  if (entries.length === 0) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = '아직 기록한 실험 값이 없습니다. 실험실에서 값을 바꾼 뒤 버튼을 누르세요.';
    box.replaceChildren(p);
    return;
  }
  const dl = document.createElement('dl');
  dl.className = 'value-list';
  for (const [key, value] of entries) {
    const dt = document.createElement('dt');
    dt.textContent = labels[key] ?? key;
    const dd = document.createElement('dd');
    dd.textContent = typeof value === 'boolean' ? (value ? '켬' : '끔') : String(value);
    dl.append(dt, dd);
  }
  box.replaceChildren(dl);
}

function setStatus(el, text) {
  if (el) el.textContent = text;
}

function formatTime(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function bindCompletion(week) {
  const btn = document.querySelector('[data-action="toggle-complete"]');
  const label = document.querySelector('[data-complete-label]');
  if (!btn) return;
  const render = () => {
    const done = isCompleted(week);
    btn.setAttribute('aria-pressed', String(done));
    btn.textContent = done ? '✓ 완료함 (취소하려면 다시 누르기)' : '이번 주 학습 완료로 표시';
    btn.classList.toggle('is-complete', done);
    if (label) label.textContent = done ? '완료' : '진행 중';
    if (label) label.dataset.state = done ? 'done' : 'progress';
  };
  btn.addEventListener('click', () => {
    setCompleted(week, !isCompleted(week));
    render();
  });
  render();
}
