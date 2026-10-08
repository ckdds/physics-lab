// 1~8주 시뮬레이터 공통 도구: 캔버스 준비, 게임 루프, 실행 버튼 상태 관리.
// 물리 계산은 각 주차의 simulations/weekNN.js가 담당하고, 이 파일은 시간과 화면만 다룬다.

// 모든 실험은 같은 '월드' 크기(화면 단위 px)에서 계산한다.
// 화면에 보이는 캔버스 크기가 달라도 계산 결과는 같고, 그리는 배율만 바뀐다.
export const WORLD = { width: 800, height: 450 };

// 한 프레임 간격의 상한(초). 탭 전환이나 일시적인 멈춤 뒤 큰 dt로 공이 순간 이동하는 것을 막는다.
export const MAX_DT = 0.05;

export function setupCanvas(canvas, world = WORLD) {
  const ctx = canvas.getContext('2d');
  const view = { canvas, ctx, world, scale: 1 };

  function resize() {
    const cssWidth = canvas.clientWidth || world.width;
    const dpr = window.devicePixelRatio || 1;
    view.scale = cssWidth / world.width;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round((cssWidth * world.height / world.width) * dpr);
    // 이후 그리기 명령은 월드 좌표(px)로 작성한다.
    ctx.setTransform(canvas.width / world.width, 0, 0, canvas.height / world.height, 0, 0);
    view.onResize?.();
  }

  // 마우스 위치(브라우저 좌표)를 월드 좌표로 바꾼다.
  view.toWorld = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * world.width,
      y: ((clientY - rect.top) / rect.height) * world.height,
    };
  };

  new ResizeObserver(resize).observe(canvas);
  resize();
  return view;
}

// #region game-loop
// 게임 루프: 브라우저가 화면을 다시 그릴 때마다 frame()을 호출한다.
// now는 밀리초(ms) 단위 시각이므로 1000으로 나누어 초(s) 단위 dt를 만든다.
function frame(now) {
  if (loop.state !== 'running') return;

  let dt = (now - loop.lastTime) / 1000; // 지난 프레임 이후 흐른 시간(초)
  loop.lastTime = now;
  if (!Number.isFinite(dt) || dt < 0) dt = 0;
  dt = Math.min(dt, MAX_DT); // 너무 긴 간격은 잘라 낸다

  const finished = loop.sim.update(dt) === 'finished';
  loop.sim.render();
  if (finished) {
    loop.setState('finished');
    return;
  }
  loop.rafId = requestAnimationFrame(frame);
}
// #endregion

// 현재 실행 중인 루프. 한 페이지에는 실험실이 하나뿐이므로 루프도 하나만 둔다.
const loop = {
  state: 'ready',
  sim: null,
  lastTime: 0,
  rafId: null,
  listeners: new Set(),
  setState(next) {
    this.state = next;
    for (const fn of this.listeners) fn(next);
  },
};

function scheduleFrame() {
  if (loop.rafId !== null) cancelAnimationFrame(loop.rafId);
  loop.lastTime = performance.now();
  loop.rafId = requestAnimationFrame(frame);
}

function stopFrame() {
  if (loop.rafId !== null) cancelAnimationFrame(loop.rafId);
  loop.rafId = null;
}

// 탭이 다시 보이면 시계를 다시 맞춰, 숨겨져 있던 시간을 dt에 더하지 않는다.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && loop.state === 'running') {
    loop.lastTime = performance.now();
  }
});

/**
 * 시뮬레이션 제어기를 만든다.
 * sim = { reset(), update(dt) -> 'finished' | undefined, render() }
 * 상태: ready(시작 전) → running ⇄ paused, 그리고 finished(실험 종료)
 */
export function createController(sim) {
  stopFrame();
  loop.sim = sim;
  loop.listeners.clear();
  loop.state = 'ready';

  const controller = {
    get state() {
      return loop.state;
    },
    onStateChange(fn) {
      loop.listeners.add(fn);
      fn(loop.state);
    },
    start() {
      if (loop.state !== 'ready') return;
      loop.setState('running');
      scheduleFrame();
    },
    pause() {
      if (loop.state !== 'running') return;
      stopFrame();
      loop.setState('paused');
    },
    resume() {
      if (loop.state !== 'paused') return;
      loop.setState('running');
      scheduleFrame();
    },
    // 지금 설정값으로 처음 상태를 다시 만들고 곧바로 실행한다.
    restart() {
      stopFrame();
      sim.reset();
      sim.render();
      loop.setState('running');
      scheduleFrame();
    },
    // 시작 전 상태로 되돌린다. 슬라이더 기본값 복원은 호출하는 쪽이 먼저 처리한다.
    reset() {
      stopFrame();
      sim.reset();
      sim.render();
      loop.setState('ready');
    },
    // 실행 중이 아닐 때 화면만 갱신한다(시작 조건을 바꾼 직후 등).
    redraw() {
      sim.render();
    },
  };

  sim.reset();
  sim.render();
  return controller;
}

// 실험실의 버튼 다섯 개를 제어기와 연결한다.
// root 안의 [data-action="start|pause|resume|restart|reset"] 버튼을 찾는다.
export function bindControls(root, controller, { onReset } = {}) {
  const buttons = {};
  for (const action of ['start', 'pause', 'resume', 'restart', 'reset']) {
    buttons[action] = root.querySelector(`[data-action="${action}"]`);
  }
  const status = root.querySelector('[data-sim-status]');
  const labels = { ready: '시작 전', running: '실행 중', paused: '일시정지', finished: '실험 끝' };

  buttons.start?.addEventListener('click', () => controller.start());
  buttons.pause?.addEventListener('click', () => controller.pause());
  buttons.resume?.addEventListener('click', () => controller.resume());
  buttons.restart?.addEventListener('click', () => controller.restart());
  buttons.reset?.addEventListener('click', () => {
    onReset?.();
    controller.reset();
  });

  controller.onStateChange((state) => {
    if (buttons.start) buttons.start.disabled = state !== 'ready';
    if (buttons.pause) buttons.pause.disabled = state !== 'running';
    if (buttons.resume) buttons.resume.disabled = state !== 'paused';
    if (status) {
      status.textContent = labels[state] ?? state;
      status.dataset.state = state;
    }
    root.dataset.simState = state;
  });
}

/**
 * 슬라이더(range input)와 값 표시(output)를 연결한다.
 * 반환값: { get value(), set(value), reset() }
 */
export function bindRange(input, { format = (v) => String(v), onInput } = {}) {
  const output = input.closest('.control')?.querySelector('output') ?? null;
  const defaultValue = Number(input.defaultValue);
  const read = () => {
    const v = Number(input.value);
    return Number.isFinite(v) ? v : defaultValue;
  };
  const show = () => {
    if (output) output.textContent = format(read());
  };
  input.addEventListener('input', () => {
    show();
    onInput?.(read());
  });
  show();
  return {
    get value() {
      return read();
    },
    set(value) {
      input.value = String(value);
      show();
    },
    reset() {
      input.value = String(defaultValue);
      show();
    },
  };
}

// ---- 그리기 도우미 ----

export function clearWorld(ctx, world, color = '#0f1b33') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, world.width, world.height);
}

export function drawGrid(ctx, world, { step = 50, labels = true } = {}) {
  ctx.save();
  ctx.lineWidth = 1;
  for (let x = 0; x <= world.width; x += step) {
    ctx.strokeStyle = x % 100 === 0 ? 'rgba(160, 190, 255, 0.22)' : 'rgba(160, 190, 255, 0.09)';
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, world.height);
    ctx.stroke();
  }
  for (let y = 0; y <= world.height; y += step) {
    ctx.strokeStyle = y % 100 === 0 ? 'rgba(160, 190, 255, 0.22)' : 'rgba(160, 190, 255, 0.09)';
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(world.width, y + 0.5);
    ctx.stroke();
  }
  if (labels) {
    ctx.fillStyle = 'rgba(200, 215, 255, 0.6)';
    ctx.font = '13px system-ui, sans-serif';
    ctx.textBaseline = 'top';
    for (let x = 100; x < world.width; x += 100) ctx.fillText(String(x), x + 3, 3);
    for (let y = 100; y < world.height; y += 100) ctx.fillText(String(y), 3, y + 3);
    ctx.fillText('(0, 0)', 3, 3);
  }
  ctx.restore();
}

export function drawBall(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.stroke();
}

export function drawArrow(ctx, x1, y1, x2, y2, color, { width = 3, head = 10 } = {}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;
  const h = Math.min(head, len * 0.6);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * h * 0.8, y2 - uy * h * 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * h - uy * h * 0.55, y2 - uy * h + ux * h * 0.55);
  ctx.lineTo(x2 - ux * h + uy * h * 0.55, y2 - uy * h - ux * h * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawLabel(ctx, text, x, y, { color = '#e8eefc', align = 'left', size = 15 } = {}) {
  ctx.save();
  ctx.font = `${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// 화면 표시용 숫자 서식
export function fmt(value, digits = 0) {
  if (!Number.isFinite(value)) return '—';
  const v = Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value; // -0 표시 방지
  return v.toFixed(digits);
}
