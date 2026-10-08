// 1주차 출발 코드: 움직이는 공
// 목표: deltaTime(dt)을 초 단위로 구해서 공을 일정한 빠르기로 움직이기
// 단위: 위치 px, 속도 px/s, 시간 s

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

const ball = {
  x: 50, // 공 중심의 가로 위치 (px)
  y: 225, // 공 중심의 세로 위치 (px)
  radius: 20,
};
const speed = 120; // 1초 동안 움직이는 거리 (px/s)

let dt = 0; // 지난 프레임 이후 흐른 시간 (초). 화면 표시에도 씁니다.
let elapsed = 0; // 시작한 뒤 흐른 시간 (초)

// TODO 1-a: 이전 프레임의 시각(밀리초)을 기억할 변수를 여기에 만드세요.

function frame(now) {
  // now: requestAnimationFrame이 알려 주는 현재 시각 (밀리초)

  // TODO 1-b: now와 이전 시각을 이용해 dt를 '초' 단위로 구하세요.
  //           그리고 다음 프레임을 위해 이전 시각을 지금 시각으로 바꿔 두세요.
  //           (생각해 보기) 맨 첫 프레임에는 이전 시각이 없습니다. dt를 몇으로 두면 안전할까요?

  elapsed += dt;

  // TODO 2: 속도와 dt를 이용해 공의 x 위치를 바꾸세요.

  // TODO 3 (응용 미션): 공이 오른쪽 끝을 '완전히' 벗어나면 왼쪽에서 다시 나타나게 하세요.

  draw();
  requestAnimationFrame(frame);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#4fb3ff';
  ctx.fill();

  ctx.fillStyle = '#e8eefc';
  ctx.font = '16px sans-serif';
  ctx.fillText(`dt = ${dt.toFixed(4)} s`, 12, 24);
  ctx.fillText(`경과 시간 = ${elapsed.toFixed(2)} s`, 12, 46);
  ctx.fillText(`x = ${ball.x.toFixed(0)} px`, 12, 68);
}

requestAnimationFrame(frame);
