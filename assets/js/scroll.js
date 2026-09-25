// One scroll source for the whole page (no library). Sections subscribe with track();
// measurements are cached and refreshed on resize/ResizeObserver, never read inside the frame loop.
const subs = [];
let sy = window.scrollY, vh = window.innerHeight, vw = window.innerWidth;
let queued = false;

function frame() {
  queued = false;
  sy = window.scrollY;
  for (const s of subs) {
    const range = Math.max(1, s.height - (s.sticky ? vh : -vh));
    // sticky: 0 when the section top hits the viewport top, 1 when its bottom hits the viewport bottom.
    // flow: 0 when the section top enters at the viewport bottom, 1 when its bottom leaves at the top.
    const start = s.sticky ? s.top : s.top - vh;
    const p = Math.min(1, Math.max(0, (sy - start) / range));
    const visible = sy + vh > s.top - s.margin && sy < s.top + s.height + s.margin;
    if (visible || s.visible) s.update(p, { visible, sy, vh, vw });
    s.visible = visible;
  }
}
export function request() {
  if (!queued) { queued = true; requestAnimationFrame(frame); }
}
function measure() {
  vh = window.innerHeight; vw = window.innerWidth;
  for (const s of subs) {
    const r = s.el.getBoundingClientRect();
    s.top = r.top + window.scrollY;
    s.height = r.height;
  }
  request();
}
/**
 * track(el, update, { sticky=true, margin=0 })
 * update(progress 0..1, { visible, sy, vh, vw }) runs inside rAF only while visible (plus one exit frame).
 */
export function track(el, update, opts = {}) {
  const s = { el, update, sticky: opts.sticky !== false, margin: opts.margin || 0, top: 0, height: 0, visible: true };
  subs.push(s);
  measure();
  return s;
}
export const viewport = () => ({ vw, vh });

window.addEventListener('scroll', request, { passive: true });
window.addEventListener('resize', measure);
if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
document.fonts && document.fonts.ready.then(measure);
window.addEventListener('load', measure);
