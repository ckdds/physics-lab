// 3주차 실험: 중력, 가속도, 시간에 따른 속도 변화
// 중력은 매 순간 아래 방향 속도(vy)를 조금씩 키운다. 속도가 커지면 같은 시간에 더 멀리 이동한다.

import {
  WORLD,
  setupCanvas,
  createController,
  bindControls,
  bindRange,
  clearWorld,
  drawBall,
  drawArrow,
  drawLabel,
  fmt,
} from '../js/sim-kit.js';

const RADIUS = 14;
const GROUND_Y = 420; // 바닥 선의 y (px)
const DROP_X = 200; // 공이 떨어지는 x 위치
const MARK_INTERVAL = 0.1; // 발자국 간격(초)

// 오른쪽 그래프 영역 (속도-시간 그래프)
const GRAPH = { left: 470, top: 40, width: 300, height: 340, tMax: 3, vMin: -800, vMax: 1600 };

export function createLab(root) {
  const view = setupCanvas(root.querySelector('canvas'));
  const out = (name) => root.querySelector(`[data-out="${name}"]`);

  const params = {
    gravity: bindRange(root.querySelector('#gravity'), { format: (v) => `${v} px/s²` }),
    startHeight: bindRange(root.querySelector('#start-height'), {
      format: (v) => `${v} px`,
      onInput: () => redrawIfIdle(),
    }),
    startVy: bindRange(root.querySelector('#start-vy'), {
      format: (v) => `${v} px/s`,
      onInput: () => redrawIfIdle(),
    }),
  };
  const showMarks = root.querySelector('#show-marks');

  const ball = { y: 0, vy: 0 };
  let time = 0;
  let markTimer = 0;
  let landed = null; // { time, speed }
  const marks = [];
  const samples = []; // 그래프용 { t, vy }

  // 바닥 위 높이 h(px)를 Canvas의 y 좌표로 바꾼다. 높이는 위로 갈수록 커지지만 y는 아래로 갈수록 커진다.
  const heightToY = (h) => GROUND_Y - RADIUS - h;
  const yToHeight = (y) => GROUND_Y - RADIUS - y;

  // #region update
  // 중력 가속도 gravity(px/s²)는 '1초마다 속도가 얼마나 커지는가'이다.
  function step(dt) {
    const gravity = params.gravity.value;

    ball.vy += gravity * dt; // ① 속도가 먼저 바뀐다 (Canvas에서 +y는 아래)
    ball.y += ball.vy * dt; // ② 바뀐 속도로 위치를 바꾼다

    // 바닥에 닿으면 멈춘다. 공의 아래쪽 끝(y + 반지름)이 바닥을 넘지 않게 위치를 맞춘다.
    if (ball.y + RADIUS >= GROUND_Y) {
      ball.y = GROUND_Y - RADIUS;
      return 'landed';
    }
  }
  // #endregion

  function redrawIfIdle() {
    if (controller.state === 'ready') {
      sim.reset();
      controller.redraw();
    }
  }

  const sim = {
    reset() {
      ball.y = heightToY(params.startHeight.value);
      ball.vy = params.startVy.value;
      time = 0;
      markTimer = 0;
      landed = null;
      marks.length = 0;
      samples.length = 0;
      marks.push({ y: ball.y, t: 0 });
      samples.push({ t: 0, vy: ball.vy });
    },
    update(dt) {
      const result = step(dt);
      time += dt;
      markTimer += dt;
      if (markTimer >= MARK_INTERVAL) {
        markTimer -= MARK_INTERVAL;
        marks.push({ y: ball.y, t: time });
      }
      if (result === 'landed') {
        landed = { time, speed: ball.vy };
        ball.vy = 0;
      }
      if (samples.length < 4000) samples.push({ t: time, vy: landed ? landed.speed : ball.vy });
      if (landed) return 'finished';
      // 위로 던졌을 때 화면 위로 너무 멀리 나가면 실험을 멈춘다.
      if (ball.y < -2000 || time > 30) return 'finished';
    },
    render,
  };

  function render() {
    const { ctx } = view;
    clearWorld(ctx, WORLD);

    // 바닥과 높이 눈금
    ctx.fillStyle = '#2b3b5f';
    ctx.fillRect(0, GROUND_Y, 440, WORLD.height - GROUND_Y);
    ctx.strokeStyle = '#9fb4e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(440, GROUND_Y);
    ctx.stroke();
    for (let h = 0; h <= 400; h += 100) {
      const y = heightToY(h) + RADIUS;
      if (y < 0) continue;
      ctx.strokeStyle = 'rgba(160,190,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(440, y);
      ctx.stroke();
      drawLabel(ctx, `h ${h}`, 4, y - 9, { color: 'rgba(200,215,255,0.6)', size: 13 });
    }

    // 0.1초마다 남긴 발자국: 간격이 점점 벌어지는지 관찰한다.
    if (showMarks.checked) {
      for (const m of marks) {
        ctx.strokeStyle = 'rgba(255, 230, 120, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(DROP_X + 30, m.y);
        ctx.lineTo(DROP_X + 60, m.y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 230, 120, 0.25)';
        ctx.beginPath();
        ctx.arc(DROP_X, m.y, RADIUS - 2, 0, Math.PI * 2);
        ctx.fill();
      }
      drawLabel(ctx, '0.1초마다 위치', DROP_X + 66, marks[0].y, { color: '#ffe678', size: 15 });
    }

    drawBall(ctx, DROP_X, ball.y, RADIUS, '#4fb3ff');
    if (Math.abs(ball.vy) >= 1) {
      drawArrow(ctx, DROP_X - 40, ball.y, DROP_X - 40, ball.y + ball.vy * 0.12, '#7dffb0', { width: 3 });
      drawLabel(ctx, 'v', DROP_X - 54, ball.y, { color: '#7dffb0', size: 14 });
    }
    drawArrow(ctx, 60, 40, 60, 90, '#ff7b9c', { width: 3 });
    drawLabel(ctx, `중력 ${params.gravity.value} px/s²`, 72, 64, { color: '#ff7b9c', size: 14 });

    if (landed) {
      drawLabel(ctx, `착지! ${fmt(landed.time, 2)} s`, DROP_X + 30, GROUND_Y - 30, { color: '#7dffb0', size: 16 });
    }

    drawGraph(ctx);

    const height = yToHeight(ball.y);
    out('time').textContent = `${fmt(time, 2)} s`;
    out('height').textContent = `${fmt(height)} px`;
    out('vy').textContent = `${fmt(landed ? landed.speed : ball.vy)} px/s`;
    out('landing-time').textContent = landed ? `${fmt(landed.time, 2)} s` : '—';
    out('landing-speed').textContent = landed ? `${fmt(landed.speed)} px/s` : '—';
  }

  function drawGraph(ctx) {
    const g = GRAPH;
    const tx = (t) => g.left + (t / g.tMax) * g.width;
    const vyToY = (v) => g.top + ((g.vMax - v) / (g.vMax - g.vMin)) * g.height;

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(g.left, g.top, g.width, g.height);
    ctx.strokeStyle = 'rgba(160,190,255,0.12)';
    ctx.lineWidth = 1;
    for (let t = 0.5; t <= g.tMax; t += 0.5) {
      ctx.beginPath();
      ctx.moveTo(tx(t), g.top);
      ctx.lineTo(tx(t), g.top + g.height);
      ctx.stroke();
    }
    for (let v = g.vMin; v <= g.vMax; v += 400) {
      ctx.beginPath();
      ctx.moveTo(g.left, vyToY(v));
      ctx.lineTo(g.left + g.width, vyToY(v));
      ctx.stroke();
      drawLabel(ctx, String(v), g.left - 6, vyToY(v), { color: 'rgba(200,215,255,0.7)', align: 'right', size: 13 });
    }
    ctx.strokeStyle = 'rgba(200,215,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(g.left, vyToY(0));
    ctx.lineTo(g.left + g.width, vyToY(0));
    ctx.stroke();
    for (let t = 1; t <= g.tMax; t += 1) drawLabel(ctx, `${t}s`, tx(t), g.top + g.height + 12, { color: 'rgba(200,215,255,0.7)', align: 'center', size: 13 });
    drawLabel(ctx, '속도 vy (px/s) — 시간 그래프', g.left, g.top - 18, { color: '#e8eefc', size: 15 });

    ctx.save();
    ctx.beginPath();
    ctx.rect(g.left, g.top, g.width, g.height);
    ctx.clip();
    ctx.strokeStyle = '#7dffb0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = tx(s.t);
      const y = vyToY(s.vy);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }

  const controller = createController(sim);
  bindControls(root, controller, {
    onReset() {
      params.gravity.reset();
      params.startHeight.reset();
      params.startVy.reset();
      showMarks.checked = showMarks.defaultChecked;
    },
  });
  showMarks.addEventListener('change', () => controller.redraw());
  root.querySelector('#gravity').addEventListener('input', () => {
    if (controller.state !== 'running') controller.redraw();
  });
  view.onResize = () => controller.redraw();

  return {
    paramLabels: {
      gravityPxPerSec2: '중력 가속도 (px/s²)',
      startHeightPx: '시작 높이 (px)',
      startVyPxPerSec: '처음 세로 속도 (px/s)',
      landingTimeSec: '착지 시간 (s)',
      landingSpeedPxPerSec: '착지 속도 (px/s)',
    },
    getParams() {
      const values = {
        gravityPxPerSec2: params.gravity.value,
        startHeightPx: params.startHeight.value,
        startVyPxPerSec: params.startVy.value,
      };
      if (landed) {
        values.landingTimeSec = Number(landed.time.toFixed(2));
        values.landingSpeedPxPerSec = Math.round(landed.speed);
      }
      return values;
    },
  };
}
