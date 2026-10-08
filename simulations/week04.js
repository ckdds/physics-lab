// 4주차 실험: 벽 충돌, 반발 계수, 튀는 높이 관찰
// 공이 벽·바닥·천장에 닿으면 그 방향의 속도를 뒤집고, 반발 계수만큼 줄인다.

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

const FLOOR_Y = 420; // 바닥 선의 y (px)
const LEFT_X = 0;
const RIGHT_X = WORLD.width;
const CEILING_Y = 0;
const REST_SPEED = 20; // 튄 뒤 세로 속력이 이보다 작으면 바닥에 멈춘 것으로 본다 (px/s)
const MAX_PEAKS = 8;

export function createLab(root) {
  const view = setupCanvas(root.querySelector('canvas'));
  const out = (name) => root.querySelector(`[data-out="${name}"]`);

  const params = {
    gravity: bindRange(root.querySelector('#gravity'), { format: (v) => `${v} px/s²` }),
    restitution: bindRange(root.querySelector('#restitution'), { format: (v) => v.toFixed(2) }),
    startVx: bindRange(root.querySelector('#start-vx'), { format: (v) => `${v} px/s`, onInput: () => redrawIfIdle() }),
    startHeight: bindRange(root.querySelector('#start-height'), { format: (v) => `${v} px`, onInput: () => redrawIfIdle() }),
    radius: bindRange(root.querySelector('#radius'), { format: (v) => `${v} px`, onInput: () => redrawIfIdle() }),
  };
  const showPeaks = root.querySelector('#show-peaks');
  const peakTable = root.querySelector('[data-peak-table]');

  const ball = { x: 0, y: 0, vx: 0, vy: 0, r: 20 };
  let time = 0;
  let bounces = 0;
  let resting = false;
  let peaks = []; // 각 최고점의 높이(px). peaks[0]은 시작 높이
  let goingUp = false;

  const heightOf = (y) => FLOOR_Y - (y + ball.r); // 바닥에서 공 아래쪽 끝까지의 높이

  // #region collision
  // 벽·바닥·천장 충돌. 공의 가장자리(중심 ± 반지름)가 경계를 넘으면
  // ① 위치를 경계 안쪽으로 되돌리고 ② 속도를 뒤집으면서 반발 계수 e를 곱한다.
  function collide(e) {
    let hitFloor = false;

    if (ball.y + ball.r > FLOOR_Y) {
      ball.y = FLOOR_Y - ball.r;
      ball.vy = -ball.vy * e;
      hitFloor = true;
      // 아주 작게 튀는 것은 멈춘 것으로 본다. 그렇지 않으면 바닥에서 계속 떨린다.
      if (Math.abs(ball.vy) < REST_SPEED) ball.vy = 0;
    }
    if (ball.y - ball.r < CEILING_Y) {
      ball.y = CEILING_Y + ball.r;
      ball.vy = -ball.vy * e;
    }
    if (ball.x - ball.r < LEFT_X) {
      ball.x = LEFT_X + ball.r;
      ball.vx = -ball.vx * e;
    }
    if (ball.x + ball.r > RIGHT_X) {
      ball.x = RIGHT_X - ball.r;
      ball.vx = -ball.vx * e;
    }
    return hitFloor;
  }
  // #endregion

  // #region update
  function step(dt) {
    const gravity = params.gravity.value;
    const e = params.restitution.value; // 반발 계수 (0 ~ 1)

    ball.vy += gravity * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    return collide(e);
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
      ball.r = params.radius.value;
      ball.x = 120;
      ball.y = FLOOR_Y - ball.r - params.startHeight.value;
      ball.vx = params.startVx.value;
      ball.vy = 0;
      time = 0;
      bounces = 0;
      resting = false;
      goingUp = false;
      peaks = [params.startHeight.value];
      renderPeakTable();
    },
    update(dt) {
      const prevVy = ball.vy;
      const hitFloor = step(dt);
      time += dt;

      if (hitFloor && !resting) {
        if (ball.vy === 0) {
          resting = true;
        } else {
          bounces += 1;
          goingUp = true;
        }
      }
      // 올라가던 공(vy < 0)이 내려가기 시작하는 순간이 최고점이다.
      if (goingUp && prevVy < 0 && ball.vy >= 0) {
        goingUp = false;
        if (peaks.length <= MAX_PEAKS) {
          peaks.push(heightOf(ball.y));
          renderPeakTable();
        }
      }
      // 계산이 터지는 경우(NaN)를 막는다.
      if (!Number.isFinite(ball.x) || !Number.isFinite(ball.y)) {
        sim.reset();
        return 'finished';
      }
    },
    render,
  };

  function render() {
    const { ctx } = view;
    clearWorld(ctx, WORLD);

    // 바닥
    ctx.fillStyle = '#2b3b5f';
    ctx.fillRect(0, FLOOR_Y, WORLD.width, WORLD.height - FLOOR_Y);
    ctx.strokeStyle = '#9fb4e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(WORLD.width, FLOOR_Y);
    ctx.stroke();

    // 높이 눈금
    for (let h = 100; h <= 400; h += 100) {
      const y = FLOOR_Y - h;
      ctx.strokeStyle = 'rgba(160,190,255,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD.width, y);
      ctx.stroke();
      drawLabel(ctx, `h ${h}`, 4, y - 9, { color: 'rgba(200,215,255,0.6)', size: 13 });
    }

    // 지금까지의 최고점 높이 선
    if (showPeaks.checked) {
      peaks.forEach((h, i) => {
        const y = FLOOR_Y - h;
        ctx.strokeStyle = i === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255, 230, 120, 0.8)';
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(WORLD.width - 160, y);
        ctx.lineTo(WORLD.width, y);
        ctx.stroke();
        ctx.setLineDash([]);
        drawLabel(ctx, i === 0 ? `시작 ${fmt(h)}` : `${i}번째 ${fmt(h)}`, WORLD.width - 164, y, {
          color: i === 0 ? '#e8eefc' : '#ffe678',
          align: 'right',
          size: 13,
        });
      });
    }

    drawBall(ctx, ball.x, ball.y, ball.r, '#4fb3ff');
    if (Math.hypot(ball.vx, ball.vy) >= 1) {
      drawArrow(ctx, ball.x, ball.y, ball.x + ball.vx * 0.15, ball.y + ball.vy * 0.15, '#7dffb0', { width: 3 });
    }
    drawLabel(ctx, `반발 계수 e = ${params.restitution.value.toFixed(2)}`, WORLD.width / 2, 22, { align: 'center', size: 16 });
    if (resting) drawLabel(ctx, '세로로는 멈춤 (가로로는 미끄러짐)', WORLD.width / 2, 46, { color: '#ffe678', align: 'center', size: 15 });

    out('time').textContent = `${fmt(time, 2)} s`;
    out('height').textContent = `${fmt(heightOf(ball.y))} px`;
    out('vx').textContent = `${fmt(ball.vx)} px/s`;
    out('vy').textContent = `${fmt(ball.vy)} px/s`;
    out('bounces').textContent = `${bounces} 번`;
  }

  function renderPeakTable() {
    const rows = peaks.map((h, i) => {
      const tr = document.createElement('tr');
      const ratio = i === 0 ? '—' : peaks[i - 1] > 0 ? `${fmt((h / peaks[i - 1]) * 100, 0)} %` : '—';
      for (const text of [i === 0 ? '시작' : `${i}`, `${fmt(h)} px`, ratio]) {
        const td = document.createElement('td');
        td.textContent = text;
        tr.append(td);
      }
      return tr;
    });
    peakTable.replaceChildren(...rows);
  }

  const controller = createController(sim);
  bindControls(root, controller, {
    onReset() {
      for (const p of Object.values(params)) p.reset();
      showPeaks.checked = showPeaks.defaultChecked;
    },
  });
  showPeaks.addEventListener('change', () => controller.redraw());
  for (const id of ['#gravity', '#restitution']) {
    root.querySelector(id).addEventListener('input', () => {
      if (controller.state !== 'running') controller.redraw();
    });
  }
  view.onResize = () => controller.redraw();

  return {
    paramLabels: {
      gravityPxPerSec2: '중력 가속도 (px/s²)',
      restitution: '반발 계수 e',
      startVxPxPerSec: '처음 가로 속도 (px/s)',
      startHeightPx: '시작 높이 (px)',
      radiusPx: '공 반지름 (px)',
      bounceCount: '튄 횟수',
      peakHeightsPx: '최고점 높이들 (px)',
    },
    getParams() {
      return {
        gravityPxPerSec2: params.gravity.value,
        restitution: params.restitution.value,
        startVxPxPerSec: params.startVx.value,
        startHeightPx: params.startHeight.value,
        radiusPx: params.radius.value,
        bounceCount: bounces,
        peakHeightsPx: peaks.map((h) => Math.round(h)).join(', '),
      };
    },
  };
}
