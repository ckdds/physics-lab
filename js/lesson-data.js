// 24주 교안 목록. 주제·산출물은 정본 커리큘럼(web_physics_simulation_game_curriculum_24weeks.md)과 일치시킨다.
// available: 교안 파일이 실제로 제작되었으면 true. false인 주차는 대시보드에서 '준비 중'으로 표시한다.

export const PARTS = [
  { id: 1, title: '물리 시뮬레이션 기초', weeks: [1, 4], output: '중력·반발력 조절 공 시뮬레이터' },
  { id: 2, title: '힘과 운동 구현', weeks: [5, 8], output: '물리 실험실 웹 페이지' },
  { id: 3, title: '물리 엔진 활용', weeks: [9, 12], output: '물리 샌드박스' },
  { id: 4, title: '복합 물리 시뮬레이션', weeks: [13, 16], output: '연쇄 반응 장치' },
  { id: 5, title: '게임 설계 및 개발', weeks: [17, 20], output: '물리 퍼즐 게임 베타 버전' },
  { id: 6, title: 'AI 협업·완성·배포', weeks: [21, 24], output: '배포된 웹 게임·프로젝트 설명서' },
];

export const WEEKS = [
  { week: 1, part: 1, title: '움직이는 공', concept: 'Canvas, 좌표계, 게임 루프, deltaTime', output: '움직이는 공', available: true },
  { week: 2, part: 1, title: '자유 이동하는 공', concept: '위치, 속도, 방향, 벡터', output: '자유 이동하는 공', available: true },
  { week: 3, part: 1, title: '자유낙하 시뮬레이터', concept: '중력, 가속도, 시간 변화', output: '자유낙하 시뮬레이터', available: true },
  { week: 4, part: 1, title: '튀어 오르는 공', concept: '벽 충돌, 반발 계수, 튀는 높이 관찰', output: '튀는 공·파트 발표', available: true },
  { week: 5, part: 2, title: '힘으로 공 밀기', concept: '힘, 질량, 가속도', output: '힘으로 공 밀기', available: false },
  { week: 6, part: 2, title: '포물선 발사', concept: '발사 각도, 초기 속도', output: '포물선 발사 시뮬레이터', available: false },
  { week: 7, part: 2, title: '경사면의 상자', concept: '경사면 운동, 마찰, 정지 조건', output: '경사면에서 미끄러지는 상자', available: false },
  { week: 8, part: 2, title: '물리 실험실', concept: '제공 함수로 기준값 비교, dt 실험, 기존 실험 정리', output: '비교 기록이 포함된 실험실·파트 발표', available: false },
  { week: 9, part: 3, title: '물리 엔진 첫걸음', concept: '공 두 개 겹침 판정, 엔진 도입, 튀는 공 비교', output: '충돌 감지 실험·Matter.js 재현', available: false },
  { week: 10, part: 3, title: '블록 쌓기', concept: '도형, 질량, 밀도, 마찰/반발', output: '블록 쌓기', available: false },
  { week: 11, part: 3, title: '도미노', concept: '충돌 이벤트, 센서', output: '도미노 시뮬레이터', available: false },
  { week: 12, part: 3, title: '물리 샌드박스', concept: '드래그, 생성·삭제', output: '물리 샌드박스·파트 발표', available: false },
  { week: 13, part: 4, title: '시소', concept: '회전, 회전축, 토크', output: '시소 시뮬레이터', available: false },
  { week: 14, part: 4, title: '진자', concept: '제약 조건, 진자', output: '진자 운동 실험', available: false },
  { week: 15, part: 4, title: '탄성 연결', concept: '탄성 연결, stiffness와 용수철 상수 구별', output: '탄성 제약 장치', available: false },
  { week: 16, part: 4, title: '연쇄 반응 장치', concept: '복합 장치, 게임 규칙으로 확장할 아이디어', output: '연쇄 반응 장치·파트 발표', available: false },
  { week: 17, part: 5, title: '게임 기획', concept: '발사체·연쇄 반응 중 선택, 규칙·최소 범위 설계', output: '게임 기획서', available: false },
  { week: 18, part: 5, title: '첫 번째 레벨', concept: '제공 템플릿에 핵심 장치·성공 조건 구현', output: '1개 레벨의 플레이 가능한 게임', available: false },
  { week: 19, part: 5, title: '레벨 설계', concept: '퍼즐, 장애물, 레벨 설계', output: '3개 이상의 스테이지', available: false },
  { week: 20, part: 5, title: '베타 버전', concept: '보충·완성, 난이도 조절, 1차 상호 테스트', output: '베타 게임·1차 피드백표', available: false },
  { week: 21, part: 6, title: '게임 UI', concept: '1차 피드백 반영, UI 개선, 자산 이용 조건', output: '개선된 게임 UI·출처 기록', available: false },
  { week: 22, part: 6, title: '안정화', concept: '피드백 수정, 기능 단위 코드 리뷰, 리팩터링', output: '수정 검증을 마친 안정화 버전', available: false },
  { week: 23, part: 6, title: '플레이 테스트', concept: '2차 플레이 테스트, 재검증, 보충·최종 수정', output: '최종 수정 버전·2차 피드백표', available: false },
  { week: 24, part: 6, title: '배포와 발표', concept: '교사 관리 배포, 발표, 회고', output: '공유 가능한 웹 게임·설명서', available: false },
];

export const TOTAL_WEEKS = WEEKS.length;

export function getWeek(week) {
  return WEEKS.find((w) => w.week === week) ?? null;
}

export function getPart(partId) {
  return PARTS.find((p) => p.id === partId) ?? null;
}

export function weekKey(week) {
  return `week${String(week).padStart(2, '0')}`;
}

export function lessonPath(week) {
  return `lessons/${weekKey(week)}.html`;
}
