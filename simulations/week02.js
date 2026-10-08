// 2주차 실험: 위치, 속도, 방향, 벡터
// 공은 가로 속도 vx와 세로 속도 vy를 함께 가진다. 두 값을 합친 화살표가 속도 벡터다.

import {
  WORLD,
  setupCanvas,
  createController,
  bindControls,
  bindRange,
  clearWorld,
  drawGrid,
  drawBall,
  drawArrow,
  drawLabel,
  fmt,
} from '../js/sim-kit.js';

const RADIUS = 16;
const ARROW_SCALE = 0.5; // 속도 1 px/s를 화살표 0.5 px로 그린다
const TRAIL_INTERVAL = 0.25; // 발자국 간격(초)
const MAX_TRAIL = 40;

export function createLab(root) {
  const view = setupCanvas(root.querySelector('canvas'));
  const canvas = view.canvas;
  const out = (name) => root.querySelector(`[data-out="${name}"]`);

  const params = {
    vx: bindRange(root.querySelector('#vx'), { format: (v) => `${v} px/s`, onInput: () => syncVelocityFromSliders() }),
    vy: bindRange(root.querySelector('#vy'), { format: (v) => `${v} px/s`, onInput: () => syncVelocityFromSliders() }),
    keySpeed: bindRange(root.querySelector('#key-speed'), { format: (v) => `${v} px/s` }),
  };
  const keyboardMode = root.querySelector('#keyboard-mode');
  const diagonalFix = root.querySelector('#diagonal-fix');
  const showComponents = root.querySelector('#show-components');

  const ball = { x: WORLD.width / 2, y: WORLD.height / 2, vx: 0, vy: 0 };
  const trail = [];
  const keys = { left: false, right: false, up: false, down: false };
  let time = 0;
  let trailTimer = 0;

  function syncVelocityFromSliders() {
    if (keyboardMode.checked) return;
    ball.vx = params.vx.value;
    ball.vy = params.vy.value;
    if (controller.state !== 'running') controller.redraw();
  }

  // #region keyboard
  // 눌린 화살표 키로 속도의 방향을 정한다. 오른쪽 = +x, 아래쪽 = +y (Canvas 좌표계)
  function velocityFromKeys() {
    let dirX = 0;
    let dirY = 0;
    if (keys.right) dirX += 1;
    if (keys.left) dirX -= 1;
    if (keys.down) dirY += 1;
    if (keys.up) dirY -= 1;

    // 대각선 보정: 방향 화살표의 길이를 1로 맞춘다. 보정하지 않으면 대각선이 더 빠르다.
    const length = Math.hypot(dirX, dirY);
    if (diagonalFix.checked && length > 0) {
      dirX /= length;
      dirY /= length;
    }

    const speed = params.keySpeed.value; // 키보드 속력 (px/s)
    ball.vx = dirX * speed;
    ball.vy = dirY * speed;
  }
  // #endregion

  // #region update
  // 위치는 x와 y 두 방향으로 따로 바뀐다. 두 줄 모두 '속도 × 흐른 시간'이다.
  function step(dt) {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // 화면 밖으로 완전히 나가면 반대편에서 다시 나타난다.
    if (ball.x - RADIUS > WORLD.width) ball.x = -RADIUS;
    if (ball.x + RADIUS < 0) ball.x = WORLD.width + RADIUS;
    if (ball.y - RADIUS > WORLD.height) ball.y = -RADIUS;
    if (ball.y + RADIUS < 0) ball.y = WORLD.height + RADIUS;
  }
  // #endregion

  const sim = {
    reset() {
      ball.x = WORLD.width / 2;
      ball.y = WORLD.height / 2;
      ball.vx = keyboardMode.checked ? 0 : params.vx.value;
      ball.vy = keyboardMode.checked ? 0 : params.vy.value;
      trail.length = 0;
      time = 0;
      trailTimer = 0;
    },
    update(dt) {
      if (keyboardMode.checked) velocityFromKeys();
      step(dt);
      time += dt;
      trailTimer += dt;
      if (trailTimer >= TRAIL_INTERVAL) {
        trailTimer -= TRAIL_INTERVAL;
        trail.push({ x: ball.x, y: ball.y });
        if (trail.length > MAX_TRAIL) trail.shift();
      }
    },
    render,
  };

  function render() {
    const { ctx } = view;
    clearWorld(ctx, WORLD);
    drawGrid(ctx, WORLD);

    for (const [i, p] of trail.entries()) {
      ctx.fillStyle = `rgba(150, 200, 255, ${0.15 + (0.5 * i) / trail.length})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    drawBall(ctx, ball.x, ball.y, RADIUS, '#4fb3ff');

    const tipX = ball.x + ball.vx * ARROW_SCALE;
    const tipY = ball.y + ball.vy * ARROW_SCALE;
    if (showComponents.checked) {
      drawArrow(ctx, ball.x, ball.y, tipX, ball.y, '#ffad4d', { width: 3 });
      drawArrow(ctx, tipX, ball.y, tipX, tipY, '#ff7b9c', { width: 3 });
      if (Math.abs(ball.vx) >= 1) drawLabel(ctx, `vx ${fmt(ball.vx)}`, (ball.x + tipX) / 2, ball.y - 14, { color: '#ffad4d', align: 'center', size: 14 });
      if (Math.abs(ball.vy) >= 1) drawLabel(ctx, `vy ${fmt(ball.vy)}`, tipX + 8, (ball.y + tipY) / 2, { color: '#ff7b9c', size: 14 });
    }
    drawArrow(ctx, ball.x, ball.y, tipX, tipY, '#7dffb0', { width: 4, head: 14 });

    if (keyboardMode.checked) {
      const focused = document.activeElement === canvas;
      drawLabel(ctx, focused ? '화살표 키로 조종 중' : '캔버스를 클릭한 뒤 화살표 키를 누르세요', 12, WORLD.height - 18, {
        color: focused ? '#7dffb0' : '#ffe678',
        size: 15,
      });
    }

    const speed = Math.hypot(ball.vx, ball.vy);
    out('x').textContent = `${fmt(ball.x)} px`;
    out('y').textContent = `${fmt(ball.y)} px`;
    out('vx').textContent = `${fmt(ball.vx)} px/s`;
    out('vy').textContent = `${fmt(ball.vy)} px/s`;
    out('speed').textContent = `${fmt(speed)} px/s`;
    out('direction').textContent = describeDirection(ball.vx, ball.vy);
    out('time').textContent = `${fmt(time, 2)} s`;
  }

  const controller = createController(sim);
  bindControls(root, controller, {
    onReset() {
      params.vx.reset();
      params.vy.reset();
      params.keySpeed.reset();
      keyboardMode.checked = keyboardMode.defaultChecked;
      diagonalFix.checked = diagonalFix.defaultChecked;
      showComponents.checked = showComponents.defaultChecked;
      applyModeUi();
    },
  });

  function applyModeUi() {
    const kb = keyboardMode.checked;
    root.querySelector('#vx').disabled = kb;
    root.querySelector('#vy').disabled = kb;
    root.querySelector('#key-speed').disabled = !kb;
    diagonalFix.disabled = !kb;
  }

  keyboardMode.addEventListener('change', () => {
    applyModeUi();
    for (const k of Object.keys(keys)) keys[k] = false;
    if (keyboardMode.checked) {
      ball.vx = 0;
      ball.vy = 0;
      canvas.focus();
    } else {
      syncVelocityFromSliders();
    }
    controller.redraw();
  });
  showComponents.addEventListener('change', () => controller.redraw());
  applyModeUi();

  // 캔버스에 포커스가 있을 때만 화살표 키를 받는다(페이지 스크롤과 겹치지 않게).
  const keyMap = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  canvas.addEventListener('keydown', (e) => {
    const k = keyMap[e.key];
    if (!k || !keyboardMode.checked) return;
    e.preventDefault();
    keys[k] = true;
    if (controller.state === 'ready') controller.start();
  });
  canvas.addEventListener('keyup', (e) => {
    const k = keyMap[e.key];
    if (k) keys[k] = false;
  });
  canvas.addEventListener('blur', () => {
    for (const k of Object.keys(keys)) keys[k] = false;
    controller.redraw();
  });
  canvas.addEventListener('focus', () => controller.redraw());
  canvas.addEventListener('pointerdown', () => canvas.focus());
  view.onResize = () => controller.redraw();

  return {
    paramLabels: {
      vxPxPerSec: '가로 속도 vx (px/s)',
      vyPxPerSec: '세로 속도 vy (px/s)',
      keyboardMode: '키보드 조종',
      keySpeedPxPerSec: '키보드 속력 (px/s)',
      diagonalFix: '대각선 속력 보정',
      measuredSpeedPxPerSec: '측정한 속력 (px/s)',
    },
    getParams() {
      return {
        vxPxPerSec: Math.round(ball.vx),
        vyPxPerSec: Math.round(ball.vy),
        keyboardMode: keyboardMode.checked,
        keySpeedPxPerSec: params.keySpeed.value,
        diagonalFix: diagonalFix.checked,
        measuredSpeedPxPerSec: Math.round(Math.hypot(ball.vx, ball.vy)),
      };
    },
  };
}

function describeDirection(vx, vy) {
  const horizontal = Math.abs(vx) < 1 ? '' : vx > 0 ? '오른쪽' : '왼쪽';
  const vertical = Math.abs(vy) < 1 ? '' : vy > 0 ? '아래' : '위';
  if (!horizontal && !vertical) return '정지';
  return [horizontal, vertical].filter(Boolean).join(' ');
}
