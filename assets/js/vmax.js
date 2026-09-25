// ElaSystems V Max director. One scroll source (scroll.js), pure functions of scroll progress for every
// scrubbed state (reverse scroll replays exactly), and the traffic canvas as the only continuous animation.
import { track, request } from './scroll.js';
import { createTraffic } from './traffic.js';

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (a, b, v) => clamp((v - a) / (b - a));
const io = (a, b, v) => { const t = ramp(a, b, v); return t * t * (3 - 2 * t); };  // smooth in-out
const settle = (a, b, v) => 1 - Math.pow(1 - ramp(a, b, v), 3);                  // decelerate
const px = (v) => `${v.toFixed(1)}px`;
const calm = root.classList.contains('is-calm');
const CINE_Q = '(min-width: 1180px) and (min-height: 640px)';
const cine = root.classList.contains('is-cine');

/* ── small things ──────────────────────────────────────────────────────────────────────────── */
$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
const nav = $('.nav');
addEventListener('scroll', () => { const on = scrollY > 24; if (nav.classList.contains('is-solid') !== on) nav.classList.toggle('is-solid', on); }, { passive: true });

const copyBtn = $('.copy-num'); // sms: links do nothing on many desktops
if (copyBtn && matchMedia('(pointer: fine)').matches && navigator.clipboard) {
  copyBtn.hidden = false;
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('313-300-6898'); copyBtn.textContent = 'Copied'; setTimeout(() => (copyBtn.textContent = 'Copy number'), 1800); } catch { /* ignore */ }
  });
}

/* ── images: the tall captures load only when their project is next ────────────────────────── */
const projects = $$('.proj');
function loadProject(li) {
  if (!li || li.dataset.loaded) return;
  li.dataset.loaded = '1';
  const img = $('img', li), src = $('source', li);
  if (src && src.dataset.srcset) src.srcset = src.dataset.srcset;
  if (img.dataset.src) img.src = img.dataset.src;
}

/* ── reveals: bars draw in; in the flowing layout frames open from a slit ───────────────────── */
const reveal = (els, margin) => {
  const o = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); o.unobserve(e.target); } }), { rootMargin: margin });
  els.forEach((el) => o.observe(el));
};
reveal($$('.rows li, .contact'), '0px 0px -22% 0px');

/* ── geometry (cine) ───────────────────────────────────────────────────────────────────────── */
const G = {};
function measure() {
  const vw = document.documentElement.clientWidth, vh = innerHeight, nav = 72, // clientWidth: excludes a Windows scrollbar
    m = clamp(vw * 0.039, 16, 56);
  G.vw = vw; G.vh = vh; G.m = m;
  // hero: the site sits right of the copy, above the road; copy keeps a 56px gutter from it at every width
  const top = nav + clamp(vh * 0.085, 36, 78), road = vh * 0.745;
  let h = road - top, w = h / 0.625;
  let x = vh <= 800 ? vw - w - 16 : vw - w + vw * 0.04;
  const minX = m + 56 + 470;                       // the copy column never drops under 470px
  if (x < minX) { const right = vh <= 800 ? vw - 16 : vw + vw * 0.04; x = minX; w = right - x; h = w * 0.625; }
  G.hero = { x, y: top, w, h };
  G.copyW = Math.min(620, x - m - 56);
  G.road = road;
  // the lockup: E (three bars) · slash · the site as the S, centred
  const bh = Math.round(clamp(vh * 0.058, 30, 54)), gap = Math.round(bh * 1.15), eh = bh * 3 + gap * 2;
  const blen = Math.min(400, vw * 0.3), lh = eh * 1.35, lw = lh / 0.625;
  const run = (eh + bh * 1.8) * 0.545;
  let L = blen + 24 + run + 28 + lw;
  const fit = Math.min(1, (vw - 2 * Math.max(m, 72)) / L); // keep the lockup ≥72px from the edges
  if (fit < 1) { measureLock(vw, vh, m, fit); return measureWork(vw, vh, nav); }
  const x0 = (vw - L) / 2, cy = vh * 0.5 + 6;
  G.bars = { x: x0, y: cy - eh / 2, h: bh, gap, len: blen, slant: 0.6 };
  G.slash = { x0: x0 + blen + 24 + run, y0: cy - eh / 2 - bh * 0.9, x1: x0 + blen + 24, y1: cy + eh / 2 + bh * 0.9 };
  G.lock = { x: x0 + blen + 24 + run + 28, y: cy - lh / 2, w: lw, h: lh };
  G.sysLine = { x: x0, y: cy + lh / 2 + 40 };
  measureWork(vw, vh, nav);
}
// the lockup at a reduced scale (narrow cine widths)
function measureLock(vw, vh, m, k) {
  const bh = Math.round(clamp(vh * 0.058, 30, 54) * k), gap = Math.round(bh * 1.15), eh = bh * 3 + gap * 2;
  const blen = Math.min(400, vw * 0.3) * k, lh = eh * 1.35, lw = lh / 0.625, run = (eh + bh * 1.8) * 0.545;
  const L = blen + 24 + run + 28 + lw, x0 = (vw - L) / 2, cy = vh * 0.5 + 6;
  G.bars = { x: x0, y: cy - eh / 2, h: bh, gap, len: blen, slant: 0.6 };
  G.slash = { x0: x0 + blen + 24 + run, y0: cy - eh / 2 - bh * 0.9, x1: x0 + blen + 24, y1: cy + eh / 2 + bh * 0.9 };
  G.lock = { x: x0 + blen + 24 + run + 28, y: cy - lh / 2, w: lw, h: lh };
  G.sysLine = { x: x0, y: cy + lh / 2 + 40 };
}
// work frame: centred and as large as the viewport allows; its top sits 16px under the (measured) head,
// its caption underneath. Two passes, because the head wraps differently at different frame widths.
const workHead = document.querySelector('.work-head');
function measureWork(vw, vh, nav) {
  let ww = Math.min(vw * 0.86, 1240, 1.6 * (vh - nav - 92 - 72)), y = nav + 92;
  for (let i = 0; i < 2; i++) {
    workHead.style.width = `${ww}px`;
    const headH = workHead.getBoundingClientRect().height;
    y = nav + 18 + headH + 16;
    ww = Math.min(vw * 0.86, 1240, 1.6 * (vh - y - 62));
  }
  workHead.style.width = '';
  G.work = { x: (vw - ww) / 2, y, w: ww, h: ww * 0.625 };
}

/* ── HERO: traffic → system ────────────────────────────────────────────────────────────────── */
const hero = $('.hero'), stage = $('.hero-stage'), canvas = $('.traffic'), frame = $('.hero-frame'), sysLine = $('.system-line');
const traffic = createTraffic(canvas, { count: cine ? 30 : 16, dpr: Math.min(devicePixelRatio || 1, cine ? 1.5 : 1.25) });

function layoutTraffic() {
  const r = canvas.getBoundingClientRect(), W = r.width, H = r.height;
  if (cine) {
    // the road runs under the site: vanishing point at its lower right, lanes opening toward the lower left
    // place the frame at its first-fold position before measuring, so the caption is where a fresh visitor sees it
    if (scrollY < hero.offsetTop + 2) setRect(frame, G.hero);
    const actions = $('.hero-actions').getBoundingClientRect(), cr = canvas.getBoundingClientRect();
    const capBottom = G.hero.y + G.hero.h + $('.hero-cap').offsetHeight + 4;
    const floor = Math.max(G.road + 4, capBottom + 20, actions.bottom - cr.top + 36);
    const vp = { x: W * 0.975, y: Math.min(floor, H - 40) };
    const y0 = Math.max(H * 0.8, vp.y + 24);
    const fan = Array.from({ length: 8 }, (_, i) => ({ x: -W * 0.06, y: y0 + (i * (H + 40 - y0)) / 7, w: 1.6 + i * 0.55 }));
    traffic.layout({ vp, fan, bars: G.bars, slash: G.slash });
  } else {
    const vp = { x: W * 1.04, y: H * 0.12 };
    const fan = Array.from({ length: 6 }, (_, i) => ({ x: -W * 0.08, y: H * (0.38 + i * 0.14), w: 1.3 + i * 0.45 }));
    traffic.layout({ vp, fan, bars: { x: 16, y: H * 0.2, h: 16, gap: 18, len: W * 0.5, slant: 0.6 } });
  }
}

function setRect(el, r) {
  el.style.setProperty('--fx', px(r.x)); el.style.setProperty('--fy', px(r.y));
  el.style.setProperty('--fw', px(r.w)); el.style.setProperty('--fh', px(r.h));
}
const mix = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

function heroUpdate(p) {
  // .04–.22 copy leaves · .24–.55 the camera moves the site into the lockup while traffic straightens (.26–.52)
  // .50–.62 the line · hold · .78–1 the site grows into the work frame
  const out = io(0.05, 0.21, p);
  stage.style.setProperty('--co', (1 - out).toFixed(3));
  stage.style.setProperty('--cy', px(-40 * out));
  stage.style.setProperty('--capo', Math.max(1 - io(0.02, 0.14, p), io(0.9, 1, p)).toFixed(3));
  const landing = p > 0.5; if (frame.classList.contains('is-landing') !== landing) frame.classList.toggle('is-landing', landing);
  const sysIn = settle(0.44, 0.56, p);
  stage.style.setProperty('--so', (sysIn * (1 - io(0.8, 0.92, p))).toFixed(3));
  stage.style.setProperty('--sy', px(12 * (1 - sysIn)));
  traffic.set({ morph: io(0.15, 0.44, p), exit: io(0.8, 0.92, p), dim: 1 - io(0.9, 0.95, p) });
  stage.style.setProperty('--hh', io(0.86, 1, p).toFixed(3));   // the work heading arrives with the hand-off
  setRect(frame, mix(mix(G.hero, G.lock, io(0.15, 0.48, p)), G.work, io(0.78, 1, p)));
  canvas.style.opacity = (1 - io(0.92, 1, p)).toFixed(3);
}

/* ── WORK: one frame. Each site arrives as a bar of light in its own colour, opens, is browsed,
      closes back to the bar and streaks off. Names crossfade across the cut, so no frame is empty. ── */
const work = $('.work'), wstage = $('.work-stage');
const N = projects.length;
function clipFor(o, x0, x1) {
  const bh = 0.13, t0 = 0.5 - bh / 2;
  const top = lerp(t0, 0, o), bot = lerp(t0 + bh, 1, o);
  const s = ((bot - top) * G.work.h * 0.6 / G.work.w) * (1 - o); // bar ends cut like the E while it's a bar
  const pc = (v) => `${(v * 100).toFixed(3)}%`;
  return `polygon(${pc(x0 + s)} ${pc(top)}, ${pc(x1)} ${pc(top)}, ${pc(Math.max(x0, x1 - s))} ${pc(bot)}, ${pc(x0)} ${pc(bot)})`;
}
function workUpdate(p) {
  const P = p * N;
  projects.forEach((li, i) => {
    const t = P - i, first = i === 0, last = i === N - 1;
    // caption: slides in from below as the bar arrives, leaves upward as the next one arrives
    const capIn = first ? 1 : settle(0.04, 0.13, t), capOut = last ? 0 : io(0.86, 0.93, t);
    li.style.setProperty('--capo', (capIn * (1 - capOut)).toFixed(3));
    li.style.setProperty('--capy', px(14 * (1 - capIn) - 14 * capOut));
    const on = t > -0.036 && (last || t < 1.001);
    const x1 = first ? 1 : settle(-0.035, 0.02, t), x0 = last ? 0 : io(0.965, 0.996, t);
    const o = Math.min(first ? 1 : io(0.02, 0.09, t), 1 - (last ? 0 : io(0.9, 0.965, t)));
    if (!on || x1 <= x0 + 0.001) {
      if (li.dataset.off !== '1') { li.dataset.off = '1'; li.style.setProperty('--clip', 'polygon(0 0, 0 0, 0 0, 0 0)'); li.classList.remove('is-on', 'is-slit'); }
      return;
    }
    li.dataset.off = '0';
    if (work.classList.contains('is-live')) { loadProject(li); if (t > 0.5) loadProject(projects[i + 1]); }
    li.classList.toggle('is-on', o > 0.6);
    li.classList.toggle('is-slit', o < 0.999);
    li.style.setProperty('--clip', clipFor(o, x0, x1));
    // while it travels as a bar it is solid light in the client's colour; the colour clears as it opens
    const clear = (first ? 1 : io(0.05, 0.12, t)) * (1 - (last ? 0 : io(0.88, 0.93, t)));
    li.style.setProperty('--kf', (1 - clear).toFixed(3));
    if (!('still' in li.dataset)) {
      const img = $('img', li), ratio = img.naturalWidth ? img.naturalHeight / img.naturalWidth : 3750 / 1800;
      const max = Math.max(0, G.work.w * ratio - G.work.h) * 0.5;
      li.style.setProperty('--iy', px(-max * io(0.16, 0.84, t)));
    }
  });
}

/* ── flowing layout: frames open as they arrive; the site scrolls once the frame is up the screen ── */
function flowProject(li) {
  reveal([li], '0px 0px -5% 0px');
  if ('still' in li.dataset || calm) return;
  const inner = $('.shot-in', li), shot = $('.shot', li);
  track(li, (p, s) => {
    const img = $('img', li);
    if (!img.naturalWidth) return;
    const ih = shot.clientWidth * (img.naturalHeight / img.naturalWidth);
    const max = Math.max(0, ih - shot.clientHeight) * 0.45;
    const span = s.vh + li.offsetHeight;
    const start = (s.vh * 0.8) / span; // the frame's top has reached 20% of the viewport
    inner.style.transform = `translate3d(0, ${px(-max * io(start, start + 0.45, p))}, 0)`;
  }, { sticky: false });
}

/* ── boot ──────────────────────────────────────────────────────────────────────────────────── */
function applyGeometry() {
  if (cine) {
    measure();
    stage.style.setProperty('--copyw', px(G.copyW));
    stage.style.setProperty('--herotop', px(G.hero.y));
    stage.style.setProperty('--wx', px(G.work.x));
    wstage.style.setProperty('--wx', px(G.work.x)); wstage.style.setProperty('--wy', px(G.work.y));
    wstage.style.setProperty('--ww', px(G.work.w)); wstage.style.setProperty('--wh', px(G.work.h));
    work.style.setProperty('--projects', N);
    Object.assign(sysLine.style, { left: px(G.sysLine.x), top: px(G.sysLine.y) });
  }
  layoutTraffic();
  request();
}
applyGeometry();
document.fonts?.ready.then(applyGeometry); // text metrics change the CTA row; re-place the road once fonts are in
addEventListener('load', applyGeometry, { once: true });
root.classList.add('is-ready');
addEventListener('resize', () => {
  if ((matchMedia(CINE_Q).matches && !calm) !== cine) { location.reload(); return; } // switching layouts: rebuild
  applyGeometry();
});

if (cine) {
  track(hero, (p, s) => {
    heroUpdate(p);
    if (p > 0.3) loadProject(projects[0]); // the first tall capture, well before the hand-off
    if (s.visible && !traffic.running) traffic.start(); else if (!s.visible && traffic.running) traffic.stop();
  });
  track(work, (p, s) => {
    // the work stage takes over exactly where the hero frame lands
    const live = s.sy >= work.offsetTop;
    if (work.classList.contains('is-live') !== live) { work.classList.toggle('is-live', live); frame.classList.toggle('is-handed', live); }
    workUpdate(p);
  });
  $('.hero-copy').addEventListener('focusin', () => { if (scrollY > hero.offsetTop + innerHeight * 0.1) scrollTo({ top: 0, behavior: 'auto' }); });
  // keyboard: a focused project link scrolls the pin to that project's hold, so focus is never invisible
  projects.forEach((li, i) => li.addEventListener('focusin', () => {
    const range = work.offsetHeight - innerHeight;
    const y = work.offsetTop + ((i + 0.5) / N) * range;
    if (Math.abs(scrollY - y) > innerHeight * 0.1) scrollTo({ top: y, behavior: 'auto' });
  }));
  // hand-off without a jump: once the tall capture is in, the hero frame shows the same image the work frame uses
  const heroImg = $('img', frame), firstImg = $('img', projects[0]);
  const swap = () => { if (firstImg.naturalWidth) { $('source', frame)?.remove(); heroImg.removeAttribute('srcset'); heroImg.src = firstImg.src; } };
  firstImg.addEventListener('load', swap, { once: true });
} else {
  const lazy = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && loadProject(e.target)), { rootMargin: '60% 0px' });
  projects.forEach((li) => { lazy.observe(li); flowProject(li); });
  if (calm) traffic.draw();
  else new IntersectionObserver(([e]) => (e.isIntersecting ? traffic.start() : traffic.stop())).observe(stage);
}
