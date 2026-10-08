// 3주차 출발 코드: 자유낙하 시뮬레이터
// 목표: 중력 가속도로 속도를 바꾸고, 공을 바닥에 정확히 멈추게 하기
// Canvas에서 +y는 아래쪽이므로, 아래로 끌어당기는 중력은 양수입니다.

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GROUND_Y = 420; // 바닥 선의 y (px)
const gravity = 800; // 중력 가속도 (px/s²): 1초마다 속도가 800 px/s씩 커진다
const START_Y = 80; // 처음 위치
const START_VY = 0; // 처음 세로 속도 (px/s). 도전 미션에서 음수로 바꿔 보세요.

const ball = { x: 300, y: START_Y, vy: START_VY, radius: 14 };
let time = 0; // 출발한 뒤 흐른 시간 (s)
let landed = false; // 바닥에 닿았는가

let lastTime = null;

function frame(now) {
  const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (!landed) {
    // TODO 1 (기초 미션): 중력이 속도를 바꾸게 하세요. (아래 줄보다 먼저 와야 합니다)

    ball.y += ball.vy * dt;
    time += dt;

    // TODO 2 (기초 미션): 공이 바닥에 닿았는지 검사하고, 닿았다면
    //   - 공이 바닥에 묻히지 않도록 위치를 맞추고
    //   - 더 이상 움직이지 않게 하세요. (landed 변수를 활용)

    // TODO 3 (응용 미션): 바닥에 닿은 순간의 시간을 저장해서 화면에 표시하세요.
  }

  draw();
  requestAnimationFrame(frame);
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#2b3b5f';
  ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
  ctx.strokeStyle = '#9fb4e0';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(WIDTH, GROUND_Y);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#4fb3ff';
  ctx.fill();

  ctx.fillStyle = '#e8eefc';
  ctx.font = '16px sans-serif';
  ctx.fillText(`시간 = ${time.toFixed(2)} s`, 12, 24);
  ctx.fillText(`y = ${ball.y.toFixed(0)} px`, 12, 46);
  ctx.fillText(`vy = ${ball.vy.toFixed(0)} px/s`, 12, 68);
}

// 클릭하면 처음 상태로 되돌린다.
canvas.addEventListener('click', () => {
  ball.y = START_Y;
  ball.vy = START_VY;
  time = 0;
  landed = false;
});

requestAnimationFrame(frame);
