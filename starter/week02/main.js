// 2주차 출발 코드: 자유 이동하는 공
// 목표: 가로·세로 두 방향 속도(vx, vy)로 공을 움직이고, 키보드로 조종하기
// Canvas 좌표계: 오른쪽이 +x, 아래쪽이 +y

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const ball = {
  x: 400,
  y: 225,
  vx: 160, // 가로 속도 (px/s) — 양수: 오른쪽
  vy: -120, // 세로 속도 (px/s) — 음수: 위쪽
  radius: 16,
};

const useKeyboard = false; // 응용 미션을 시작할 때 true로 바꾸세요.
const keySpeed = 200; // 키보드로 움직일 때의 속력 (px/s)

// 눌린 화살표 키를 기억한다. 이 부분은 완성되어 있습니다.
const keys = { left: false, right: false, up: false, down: false };
const keyMap = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
canvas.addEventListener('keydown', (e) => {
  if (keyMap[e.key]) {
    keys[keyMap[e.key]] = true;
    e.preventDefault();
  }
});
canvas.addEventListener('keyup', (e) => {
  if (keyMap[e.key]) keys[keyMap[e.key]] = false;
});
canvas.addEventListener('click', () => canvas.focus());

let lastTime = null;

function frame(now) {
  // 1주차에 만든 dt 계산
  const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (useKeyboard) {
    // TODO 3 (응용 미션): keys를 보고 ball.vx, ball.vy를 정하세요.
    //   - 아무 키도 누르지 않으면 멈춘다.
    //   - ↑는 위쪽입니다. Canvas에서 위쪽은 y가 어떻게 되는 방향인가요?

    // TODO 4 (도전 미션): 대각선으로 움직일 때도 속력이 keySpeed가 되도록 보정하세요.
  }

  ball.x += ball.vx * dt;
  // TODO 1 (기초 미션): 세로 방향 위치도 바꾸세요.

  // 오른쪽·왼쪽 끝을 완전히 벗어나면 반대편에서 나타난다.
  if (ball.x - ball.radius > WIDTH) ball.x = -ball.radius;
  if (ball.x + ball.radius < 0) ball.x = WIDTH + ball.radius;
  // TODO 2 (기초 미션): 아래·위 끝도 같은 방법으로 처리하세요.

  draw();
  requestAnimationFrame(frame);
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#4fb3ff';
  ctx.fill();

  // TODO 4 (도전 미션): 공의 중심에서 속도 방향으로 화살표(선)를 그리세요.

  ctx.fillStyle = '#e8eefc';
  ctx.font = '16px sans-serif';
  ctx.fillText(`x = ${ball.x.toFixed(0)}, y = ${ball.y.toFixed(0)}`, 12, 24);
  ctx.fillText(`vx = ${ball.vx.toFixed(0)}, vy = ${ball.vy.toFixed(0)} px/s`, 12, 46);
  // TODO 4 (도전 미션): 속력(속도 화살표의 길이)도 표시하세요.
}

requestAnimationFrame(frame);
