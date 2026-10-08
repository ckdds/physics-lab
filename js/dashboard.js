// index.html 대시보드: 24주 카드, 진행률, 현재 위치, 기록 내보내기·가져오기·초기화.

import { PARTS, WEEKS, TOTAL_WEEKS, lessonPath } from './lesson-data.js';
import {
  loadProgress,
  hasLessonRecord,
  exportProgress,
  importProgressText,
  resetProgress,
} from './progress.js';
import { hideModuleNotice, showStorageWarning } from './common.js';

hideModuleNotice();

const partsRoot = document.querySelector('[data-parts]');
const message = document.querySelector('[data-message]');

function weekStatus(progress, week) {
  if (!week.available) return { state: 'soon', label: '준비 중' };
  if (progress.completedWeeks.includes(week.week)) return { state: 'done', label: '완료' };
  if (hasLessonRecord(progress, week.week)) return { state: 'progress', label: '기록 있음' };
  if (progress.visitedWeeks.includes(week.week)) return { state: 'visited', label: '방문함' };
  return { state: 'new', label: '시작 전' };
}

// 현재 학습 위치: 공개된 주차 중 아직 완료하지 않은 첫 주차
function currentWeek(progress) {
  return WEEKS.find((w) => w.available && !progress.completedWeeks.includes(w.week)) ?? null;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderCard(week, progress, current) {
  const status = weekStatus(progress, week);
  const li = el('li');
  const card = el('article', 'week-card');
  if (!week.available) card.classList.add('is-soon');
  if (current?.week === week.week) card.classList.add('is-current');

  const top = el('div', 'week-card-top');
  top.append(el('span', 'week-number', `${week.week}주차`));
  const badge = el('span', 'badge', status.label);
  badge.dataset.state = status.state;
  top.append(badge);

  const dl = el('dl');
  dl.append(el('dt', '', '핵심 개념'), el('dd', '', week.concept), el('dt', '', '결과물'), el('dd', '', week.output));

  card.append(top, el('h3', '', week.title), dl);

  if (week.available) {
    const link = el('a', 'btn', current?.week === week.week ? '이어서 학습' : '교안 열기');
    link.href = lessonPath(week.week);
    link.setAttribute('aria-label', `${week.week}주차 ${week.title} 교안 열기`);
    card.append(link);
  } else {
    const soon = el('span', 'btn btn-ghost is-disabled', '준비 중');
    soon.setAttribute('aria-disabled', 'true');
    card.append(soon);
  }
  li.append(card);
  return li;
}

function render() {
  const progress = loadProgress();
  const current = currentWeek(progress);

  const sections = PARTS.map((part) => {
    const section = el('section', 'part');
    section.setAttribute('aria-labelledby', `part-${part.id}`);
    const header = el('div', 'part-header');
    const h2 = el('h2', '', `Part ${part.id}. ${part.title}`);
    h2.id = `part-${part.id}`;
    header.append(h2, el('span', 'muted', `${part.weeks[0]}~${part.weeks[1]}주 · 결과물: ${part.output}`));
    const list = el('ul', 'week-grid');
    for (const week of WEEKS.filter((w) => w.part === part.id)) list.append(renderCard(week, progress, current));
    section.append(header, list);
    return section;
  });
  partsRoot.replaceChildren(...sections);

  const done = progress.completedWeeks.length;
  document.querySelector('[data-progress-text]').textContent = `완료한 주차 ${done} / ${TOTAL_WEEKS}`;
  document.querySelector('[data-progress-badge]').textContent = `${done} / ${TOTAL_WEEKS} 완료`;
  const bar = document.querySelector('[data-progress-bar]');
  bar.setAttribute('aria-valuenow', String(done));
  bar.querySelector('span').style.width = `${(done / TOTAL_WEEKS) * 100}%`;

  const currentLink = document.querySelector('[data-current-link]');
  const currentText = document.querySelector('[data-current-text]');
  if (current) {
    currentLink.hidden = false;
    currentLink.href = lessonPath(current.week);
    const started = progress.visitedWeeks.includes(current.week);
    currentLink.textContent = `${current.week}주차 ${started ? '이어서 학습' : '시작하기'}`;
    currentText.textContent = `현재 위치: ${current.week}주차 “${current.title}”`;
  } else {
    currentLink.hidden = true;
    currentText.textContent = '공개된 교안을 모두 완료했습니다. 다음 교안이 준비되면 이곳에 표시됩니다.';
  }
}

function showMessage(kind, text) {
  message.hidden = false;
  message.dataset.kind = kind;
  message.textContent = text;
}

document.querySelector('[data-action="export"]').addEventListener('click', () => {
  exportProgress();
  showMessage('ok', '기록 파일을 내려받았습니다. 다른 기기에서는 “기록 가져오기”로 불러올 수 있습니다.');
});

document.querySelector('[data-action="import"]').addEventListener('click', () => {
  document.querySelector('#import-file').click();
});

document.querySelector('#import-file').addEventListener('change', async (event) => {
  const input = event.target;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (file.size > 1_000_000) {
    showMessage('error', '파일이 너무 큽니다. Physics Lab에서 내보낸 기록 파일인지 확인하세요.');
    return;
  }
  if (!window.confirm('가져온 기록으로 현재 브라우저의 기록을 모두 바꿉니다. 계속할까요?')) return;
  const result = importProgressText(await file.text());
  if (result.ok) {
    showMessage('ok', `기록을 가져왔습니다. 완료한 주차 ${result.data.completedWeeks.length}개.`);
  } else {
    showMessage('error', `가져오지 못했습니다: ${result.error}`);
  }
});

document.querySelector('[data-action="reset"]').addEventListener('click', () => {
  if (!window.confirm('완료 표시와 모든 실험 기록을 지웁니다. 되돌릴 수 없습니다. 먼저 내보내기를 했나요?\n\n정말 초기화할까요?')) return;
  resetProgress();
  showMessage('ok', '모든 기록을 초기화했습니다.');
});

window.addEventListener('progress-changed', render);
// 다른 탭(교안 페이지)에서 기록이 바뀌면 대시보드도 갱신한다.
window.addEventListener('storage', render);
window.addEventListener('pageshow', render);

render();
showStorageWarning();
