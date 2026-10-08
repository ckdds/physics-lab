// 1주차 실험: Canvas 좌표계, 게임 루프, deltaTime
// 파란 공은 '초당 속도 × dt'로, 주황 공은 '프레임마다 같은 거리'로 움직인다.
// 가상 프레임률을 바꾸면 두 방식의 차이가 드러난다.

import {
  WORLD,
  setupCanvas,
  createController,
  bindControls,
  bindRange,
  clearWorld,
  drawGrid,
  drawBall,
  drawLabel,
  fmt,
} from '../js/sim-kit.js';

const RADIUS = 18;
const START_X = 50;
const LANE_DT = 170; // 파란 공(deltaTime 방식)의 y 위치
const LANE_FRAME = 300; // 주황 공(프레임 방식)의 y 위치
const COLOR_DT = '#4fb3ff';
const COLOR_FRAME = '#ffad4d';

export function createLab(root) {
  const view = setupCanvas(root.querySelector('canvas'));
  const out = (name) => root.querySelector(`[data-out="${name}"]`);

  const params = {
    speed: bindRange(root.querySelector('#speed'), { format: (v) => `${v} px/s` }),
  };
  const fpsInputs = [...root.querySelectorAll('input[name="fps"]')];
  const showFrameBall = root.querySelector('#show-frame-ball');
  const showGrid = root.querySelector('#show-grid');

  const readFps = () => Number(fpsInputs.find((i) => i.checked)?.value ?? 0); // 0 = 제한 없음

  const state = {
    dtBall: { x: START_X, distance: 0 },
    frameBall: { x: START_X, distance: 0 },
    time: 0,
    frameAccumulator: 0,
    lastDt: 0,
    frames: 0,
    fpsWindowStart: 0,
    measuredFps: 0,
    mouse: null,
  };

  // #region update
  // 한 프레임 동안의 움직임을 계산한다. dt는 지난 프레임 이후 흐른 시간(초)이다.
  function step(dt) {
    const speed = params.speed.value; // 초당 이동 거리 (px/s)

    // 방법 1: deltaTime 사용 — 흐른 시간만큼 이동한다.
    state.dtBall.x += speed * dt;
    state.dtBall.distance += speed * dt;

    // 방법 2: 프레임마다 같은 거리 — 1초에 60번 그린다고 '가정'하고 매번 speed / 60 만큼 이동한다.
    state.frameBall.x += speed / 60;
    state.frameBall.distance += speed / 60;

    // 오른쪽 끝을 완전히 벗어나면 왼쪽에서 다시 나타난다.
    if (state.dtBall.x - RADIUS > WORLD.width) state.dtBall.x = -RADIUS;
    if (state.frameBall.x - RADIUS > WORLD.width) state.frameBall.x = -RADIUS;
  }
  // #endregion

  const sim = {
    reset() {
      state.dtBall = { x: START_X, distance: 0 };
      state.frameBall = { x: START_X, distance: 0 };
      state.time = 0;
      state.frameAccumulator = 0;
      state.lastDt = 0;
      state.frames = 0;
      state.fpsWindowStart = 0;
      state.measuredFps = 0;
    },
    update(realDt) {
      // 느린 컴퓨터 흉내: 가상 프레임률보다 자주 계산하지 않고, 쌓인 시간을 한 번에 dt로 쓴다.
      const fps = readFps();
      state.frameAccumulator += realDt;
      if (fps > 0 && state.frameAccumulator < 1 / fps - 0.002) return;
      const dt = state.frameAccumulator;
      state.frameAccumulator = 0;

      step(dt);
      state.time += dt;
      state.lastDt = dt;
      state.frames += 1;
      if (state.time - state.fpsWindowStart >= 1) {
        state.measuredFps = state.frames / (state.time - state.fpsWindowStart);
        state.frames = 0;
        state.fpsWindowStart = state.time;
      }
    },
    render,
  };

  function render() {
    const { ctx } = view;
    clearWorld(ctx, WORLD);
    if (showGrid.checked) drawGrid(ctx, WORLD);

    // 출발선
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(START_X, 120);
    ctx.lineTo(START_X, 350);
    ctx.stroke();
    ctx.setLineDash([]);
    drawLabel(ctx, `출발선 x = ${START_X}`, START_X + 6, 362, { color: 'rgba(255,255,255,0.6)', size: 14 });

    drawLane(ctx, state.dtBall, LANE_DT, COLOR_DT, 'deltaTime 방식');
    if (showFrameBall.checked) drawLane(ctx, state.frameBall, LANE_FRAME, COLOR_FRAME, '프레임 방식');

    drawLabel(ctx, `경과 시간 ${fmt(state.time, 2)} s`, WORLD.width - 12, 24, { align: 'right', size: 17 });

    if (state.mouse) {
      const { x, y } = state.mouse;
      ctx.strokeStyle = 'rgba(255, 230, 120, 0.7)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD.height);
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD.width, y);
      ctx.stroke();
      drawLabel(ctx, `(${Math.round(x)}, ${Math.round(y)})`, x + 8, y - 12, { color: '#ffe678' });
    }

    out('time').textContent = `${fmt(state.time, 2)} s`;
    out('dt').textContent = `${fmt(state.lastDt * 1000, 1)} ms`;
    out('fps').textContent = state.measuredFps ? `${fmt(state.measuredFps, 0)} 회/s` : '—';
    out('dist-dt').textContent = `${fmt(state.dtBall.distance, 0)} px`;
    out('dist-frame').textContent = showFrameBall.checked ? `${fmt(state.frameBall.distance, 0)} px` : '—';
  }

  function drawLane(ctx, ball, y, color, label) {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD.width, y);
    ctx.stroke();
    drawBall(ctx, ball.x, y, RADIUS, color);
    drawLabel(ctx, label, 12, y - 34, { color, size: 15 });
    drawLabel(ctx, `x = ${fmt(ball.x, 0)}`, ball.x, y + 34, { color: '#e8eefc', align: 'center', size: 14 });
  }

  const controller = createController(sim);
  bindControls(root, controller, {
    onReset() {
      params.speed.reset();
      fpsInputs.forEach((i) => (i.checked = i.defaultChecked));
      showFrameBall.checked = showFrameBall.defaultChecked;
      showGrid.checked = showGrid.defaultChecked;
    },
  });

  // 표시 옵션은 실행 중이 아니어도 바로 화면에 반영한다.
  for (const input of [showFrameBall, showGrid]) input.addEventListener('change', () => controller.redraw());
  view.onResize = () => controller.redraw();

  view.canvas.addEventListener('pointermove', (e) => {
    state.mouse = view.toWorld(e.clientX, e.clientY);
    if (controller.state !== 'running') controller.redraw();
  });
  view.canvas.addEventListener('pointerleave', () => {
    state.mouse = null;
    if (controller.state !== 'running') controller.redraw();
  });

  return {
    paramLabels: {
      speedPxPerSec: '속도 (px/s)',
      simulatedFps: '가상 프레임률 (회/s, 0 = 제한 없음)',
      showFrameBall: '프레임 방식 공 표시',
      elapsedSec: '관찰한 경과 시간 (s)',
      dtBallDistancePx: '파란 공 이동 거리 (px)',
      frameBallDistancePx: '주황 공 이동 거리 (px)',
    },
    getParams() {
      return {
        speedPxPerSec: params.speed.value,
        simulatedFps: readFps(),
        showFrameBall: showFrameBall.checked,
        elapsedSec: Number(state.time.toFixed(2)),
        dtBallDistancePx: Math.round(state.dtBall.distance),
        frameBallDistancePx: Math.round(state.frameBall.distance),
      };
    },
  };
}
