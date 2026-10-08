// 4주차 출발 코드: 튀어 오르는 공
// 목표: 바닥·벽·천장에 닿으면 반발 계수만큼 튀어 오르게 하기
// 지금은 공이 바닥을 뚫고 사라집니다.

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const FLOOR_Y = 420; // 바닥 선의 y (px)
const gravity = 800; // 중력 가속도 (px/s²)
const e = 0.8; // 반발 계수 (0 ~ 1)

const START = { x: 120, y: 100, vx: 150, vy: 0 };
const ball = { ...START, radius: 20 };

let lastTime = null;

function frame(now) {
  const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  ball.vy += gravity * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // TODO 1 (기초 미션): 바닥에 닿으면 튀어 오르게 하세요.
  //   ① 닿았는지 검사 ② 공을 바닥 위로 꺼내기 ③ 세로 속도의 방향과 크기 바꾸기

  // TODO 2 (응용 미션): 왼쪽 벽, 오른쪽 벽, 천장에서도 튀게 하세요.

  // TODO 3 (도전 미션): 튈 때마다 최고 높이를 기록하고, 아주 작게 튀면 바닥에 멈추게 하세요.

  draw();
  requestAnimationFrame(frame);
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#2b3b5f';
  ctx.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
  ctx.strokeStyle = '#9fb4e0';
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(WIDTH, FLOOR_Y);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#4fb3ff';
  ctx.fill();

  ctx.fillStyle = '#e8eefc';
  ctx.font = '16px sans-serif';
  ctx.fillText(`높이 = ${(FLOOR_Y - ball.y - ball.radius).toFixed(0)} px`, 12, 24);
  ctx.fillText(`vx = ${ball.vx.toFixed(0)}, vy = ${ball.vy.toFixed(0)} px/s`, 12, 46);
  ctx.fillText(`반발 계수 e = ${e}`, 12, 68);
}

canvas.addEventListener('click', () => {
  Object.assign(ball, START);
});

requestAnimationFrame(frame);
