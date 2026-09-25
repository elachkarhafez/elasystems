// TRAFFIC → SYSTEM. Long-exposure night traffic on Canvas2D (additive light), which can straighten into the
// three bars of the ES mark. Road logic, not wallpaper: lanes converge on a vanishing point; headlights come
// toward you on one side of the road, tail-lights leave on the other; perspective sets speed, width and length.
//   const t = createTraffic(canvas, { lanes, dpr }); t.layout({ vp, fan, bars }); t.set({ morph, dim }); t.start()

const GOLD = [236, 176, 70], GOLD_HI = [255, 232, 176], WHITE = [246, 242, 234], HEAD = [255, 226, 180], TAIL = [214, 72, 46];
const GLOW = [[7, 0.07], [3, 0.2], [1, 1]];
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function createTraffic(canvas, { count = 36, dpr = Math.min(devicePixelRatio || 1, 1.5), seed = 313 } = {}) {
  const ctx = canvas.getContext('2d', { alpha: true });
  const R = rng(seed);
  // each streak = one car's long exposure. `dir` +1 = coming toward camera (headlights), -1 = leaving (tails)
  const cars = Array.from({ length: count }, (_, i) => {
    const toward = i % 2 === 0;
    return {
      lane: 0, dir: toward ? 1 : -1,
      u: R(), speed: lerp(0.05, 0.11, R()), len: lerp(0.16, 0.34, R()),
      white: i % 6 === 0, // one in six is headlight white
      bar: i % 3, row: Math.floor(i / 3), jitter: R() * 2 - 1, phase: R() * 6.28,
    };
  });
  let W = 0, H = 0, geo = null, morph = 0, dim = 1, exit = 0, running = false, raf = 0, last = 0, lanes = [];

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }

  // vp: vanishing point; fan: [{x,y}] lane mouths at the near edge; bars: {x, y, h, gap, len, slant}
  function layout(g) {
    resize();
    geo = g;
    lanes = g.fan;
    cars.forEach((c, i) => {
      // toward-camera cars use the lanes on one side of the road, leaving cars the other
      const half = Math.floor(lanes.length / 2);
      c.lane = c.dir > 0 ? i % half : half + (i % (lanes.length - half));
    });
    if (!running) draw();
  }

  // perspective: position along the lane is nonlinear (slow far away, fast near)
  const persp = (u) => Math.pow(clamp(u), 2.1);
  function lanePoint(lane, u, out) {
    const f = persp(u), m = lanes[lane];
    out.x = lerp(geo.vp.x, m.x, f); out.y = lerp(geo.vp.y, m.y, f); out.w = lerp(0.35, m.w || 3.2, f);
    return out;
  }

  // target of a streak inside the E: bar b, row r (rows fuse into one solid bar), ends cut on the mark's slant
  function barTarget(c, a, b) {
    const B = geo.bars, rows = Math.ceil(count / 3);
    const y0 = B.y + c.bar * (B.h + B.gap);
    const fy = (c.row + 0.5) / rows;               // 0 top → 1 bottom of the bar
    const y = y0 + fy * B.h;
    const len = B.len * [1, 0.76, 0.54][c.bar];
    const x0 = B.x + (1 - fy) * B.h * B.slant;      // the E's bar ends lean like the slash
    a.x = x0; a.y = y; b.x = B.x + len - fy * B.h * B.slant; b.y = y;
    a.w = b.w = (B.h / rows) * 1.9;
  }

  const P = { x: 0, y: 0, w: 0 }, Q = { x: 0, y: 0, w: 0 }, A = { x: 0, y: 0, w: 0 }, Bp = { x: 0, y: 0, w: 0 };

  function draw() {
    if (!geo) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const m = ease(clamp(morph));
    for (const c of cars) {
      // head (nearest the direction of travel) and tail of the exposure
      const head = c.dir > 0 ? c.u : 1 - c.u;
      const tail = c.dir > 0 ? c.u - c.len : 1 - c.u + c.len;
      lanePoint(c.lane, head, P); lanePoint(c.lane, tail, Q);
      const near = persp(Math.max(head, tail));
      let x1 = P.x, y1 = P.y, x2 = Q.x, y2 = Q.y, w = Math.max(P.w, Q.w);
      if (m > 0) {
        barTarget(c, A, Bp);
        // streaks line up tail→head along the bar, left→right, whichever way they were travelling
        x1 = lerp(x1, Bp.x, m); y1 = lerp(y1, Bp.y, m);
        x2 = lerp(x2, A.x, m); y2 = lerp(y2, A.y, m);
        w = lerp(w, A.w, m);
      }
      // colour carries the story: white headlights and red-amber tail-lights (traffic) turn gold (system)
      const base = c.dir > 0 ? (c.white ? WHITE : HEAD) : TAIL;
      const k = clamp((m - 0.05) / 0.5);
      const col = [lerp(base[0], GOLD[0], k), lerp(base[1], GOLD[1], k), lerp(base[2], GOLD[2], k)];
      // streaks hand over to the solid bars at the end of the morph (no striped or white-capped bars at rest)
      const a = dim * lerp(0.3 + 0.7 * near, 0.95, m) * (1 - clamp((m - 0.62) / 0.3));
      if (a < 0.004) continue;
      const g = ctx.createLinearGradient(x2, y2, x1, y1);
      g.addColorStop(0, rgba(col, 0));
      g.addColorStop(lerp(0.65, 0.1, m), rgba(col, a * 0.6));
      g.addColorStop(1, rgba(col, a));
      ctx.strokeStyle = g;
      // long-exposure halation: wide faint glow, mid bloom, bright core
      for (const [wm, al] of GLOW) {
        ctx.lineWidth = w * lerp(wm, Math.min(wm, 1.6), m);
        ctx.globalAlpha = al;
        ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x1, y1); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // at the end of the morph the rows settle into solid bars (clean edges, exactly the mark's geometry)
    if (m > 0.55) {
      const B0 = geo.bars, k = ease(clamp((m - 0.55) / 0.35));
      // leaving: each bar slides left off the frame, the top bar first (a line of traffic pulling away)
      ctx.globalCompositeOperation = 'source-over';
      for (let b = 0; b < 3; b++) {
        const e = ease(clamp(exit * 1.3 - b * 0.15));
        const B = { ...B0, x: B0.x - e * (B0.x + B0.len + 80) };
        const y0 = B.y + b * (B.h + B.gap), len = B.len * [1, 0.76, 0.54][b], s = B.h * B.slant;
        const grd = ctx.createLinearGradient(B.x, 0, B.x + len, 0);
        grd.addColorStop(0, rgba([138, 90, 18], k * dim)); grd.addColorStop(0.55, rgba([201, 138, 36], k * dim)); grd.addColorStop(1, rgba([244, 205, 114], k * dim));
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.moveTo(B.x + s, y0); ctx.lineTo(B.x + len, y0); ctx.lineTo(B.x + len - s, y0 + B.h); ctx.lineTo(B.x, y0 + B.h); ctx.closePath(); ctx.fill();
      }
      // the slash between E and S
      if (geo.slash && exit < 1) {
        const S = geo.slash, ka = k * (1 - exit), sg = ctx.createLinearGradient(0, S.y0, 0, S.y1);
        sg.addColorStop(0, rgba(GOLD_HI, 0)); sg.addColorStop(0.3, rgba(GOLD_HI, ka * dim)); sg.addColorStop(0.8, rgba([227, 160, 42], ka * dim)); sg.addColorStop(1, rgba([227, 160, 42], 0));
        ctx.strokeStyle = sg; ctx.lineWidth = 2; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(S.x0, S.y0); ctx.lineTo(S.x1, S.y1); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function tick(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    // traffic slows as it becomes the system (cars brake into formation)
    const pace = 1 - ease(clamp(morph)) * 0.97;
    for (const c of cars) { c.u += dt * c.speed * pace; if (c.u > 1 + c.len) c.u -= 1 + c.len; }
    draw();
    raf = requestAnimationFrame(tick);
  }

  return {
    layout, resize,
    set(o) { if (o.morph !== undefined) morph = o.morph; if (o.dim !== undefined) dim = o.dim; if (o.exit !== undefined) exit = o.exit; if (!running) draw(); },
    start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(tick); },
    stop() { running = false; cancelAnimationFrame(raf); },
    draw,
    get running() { return running; },
  };
}
