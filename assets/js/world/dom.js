// DOM director: positions the semantic scene wrappers on the scroll track, drives panel visibility from progress,
// runs the route strip (sat-nav) and the stage dimming after the drive. Readable content always lives here.
import { clamp, smoothstep } from './motion.js';

const VH_PER_UNIT = { desktop: 133, mobile: 88 };

export class DomDirector {
  constructor(tl, { mobile }) {
    this.tl = tl;
    this.mobile = mobile;
    this.root = document.documentElement;
    this.track = document.querySelector('.drive-track');
    this.stage = document.querySelector('.stage');
    this.strip = document.querySelector('.routestrip');
    this.nav = document.querySelector('.nav');
    this.stripNow = document.querySelector('.rs-now');
    this.stripLinks = [...document.querySelectorAll('.rs-stops a')];
    this.wrappers = [...document.querySelectorAll('.scene')];
    this.byScene = Object.fromEntries(tl.scenes.map((s) => [s.id, s]));
    // hide DOM scenes that aren't part of this timeline (vertical-slice builds)
    for (const w of this.wrappers) {
      const id = w.dataset.scene;
      if (id !== 'hero' && !this.byScene[id]) w.hidden = true;
    }
    this.stripLinks.forEach((a) => { if (!this.byScene[a.dataset.go]) a.parentElement.hidden = true; });
    const y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
    if (!this.root.classList.contains('is-world')) return; // static mode: native anchors, stacked layout
    // after the drive: sections rise in as they enter the viewport (motion allowed = world mode only)
    const rv = [...document.querySelectorAll('.services .eyebrow, .section-title, .svc li, .why-title, .why-body, .contact .eyebrow, .contact-title, .contact-number, .contact-actions')];
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    rv.forEach((el) => { el.classList.add('rv'); if (el.matches('.svc li')) el.style.setProperty('--d', (0.12 * [...el.parentElement.children].indexOf(el)) + 's'); io.observe(el); });
    this.layout();
    addEventListener('resize', () => this.layout());
    this.stripLinks.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); this.goTo(a.dataset.go); }));
    document.querySelectorAll('a[href^="#stop-"]').forEach((a) => {
      if (a.closest('.routestrip')) return;
      a.addEventListener('click', (e) => { e.preventDefault(); this.goTo(a.getAttribute('href').slice(6)); });
    });
    // keyboard: focusing a link inside a hidden panel drives the car to that stop
    this.track.addEventListener('focusin', (e) => {
      const sc = e.target.closest('.scene');
      if (sc && parseFloat(getComputedStyle(sc.querySelector('.stop, .hero, .collection, .commerce') || sc).opacity) < 0.5) this.goTo(sc.dataset.scene, 'auto');
    });
  }

  layout() {
    this.cache = new Map();
    const units = this.tl.total;
    const vhPer = VH_PER_UNIT[this.mobile ? 'mobile' : 'desktop'];
    this.track.style.setProperty('--track', `${Math.round(units * vhPer + 100)}vh`);
    this.H = this.track.offsetHeight;
    this.vh = innerHeight;
    this.span = Math.max(1, this.H - this.vh);
    for (const w of this.wrappers) {
      if (w.hidden) continue;
      const id = w.dataset.scene;
      const [p0, p1] = id === 'hero' ? [0, this.byScene.system.p1] : [this.byScene[id].p0, this.byScene[id].p1];
      w.style.setProperty('--top', `${Math.round(p0 * this.span)}px`);
      w.style.setProperty('--h', `${Math.round((p1 - p0) * this.span + this.vh)}px`);
    }
    this.track.classList.add('is-laid');
  }

  progress() {
    const r = this.track.getBoundingClientRect();
    this.trackEndPast = -r.top - this.span; // px scrolled beyond the end of the drive
    return clamp(-r.top / this.span);
  }

  scrollYFor(id) {
    if (id === 'hero') return 0;
    const s = this.byScene[id];
    if (!s) return 0;
    const p = s.brakeP ? (s.brakeP + s.holdP) / 2 : s.p0 + (s.p1 - s.p0) * 0.6;
    return this.track.offsetTop + p * this.span;
  }

  goTo(id, behavior) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({ top: this.scrollYFor(id), behavior: behavior || (reduce ? 'auto' : 'smooth') });
  }

  update(p, d, roadName) {
    // write a CSS variable only when it changed (avoids a style recalc per element per frame)
    const set = (el, k, v) => { if (!el) return; const key = el.dataset.scene + k; if (this.cache.get(key) === v) return; this.cache.set(key, v); el.style.setProperty(k, v); };
    const sc = this.byScene;
    // hero: beat 2 rises on the first scroll, the whole block leaves as the drive starts
    const e = sc.entry, sy = sc.system;
    const hero = this.wrappers[0];
    set(hero, '--b2', `${(1 - smoothstep(e.p0 + (e.p1 - e.p0) * 0.12, e.p0 + (e.p1 - e.p0) * 0.62, p)) * 105}%`);
    set(hero, '--o', (1 - smoothstep(sy.p0 + (sy.p1 - sy.p0) * 0.25, sy.p0 + (sy.p1 - sy.p0) * 0.75, p)).toFixed(3));
    for (const w of this.wrappers.slice(1)) {
      if (w.hidden) continue;
      const s = sc[w.dataset.scene];
      const r = s.p1 - s.p0;
      let o;
      if (s.brakeP) o = smoothstep(s.p0 + r * 0.3, s.brakeP + r * 0.02, p) * (1 - smoothstep(s.holdP + r * 0.02, s.p1 - r * 0.02, p));
      else if (s.id === 'collection') o = smoothstep(s.p0 + r * 0.3, s.p0 + r * 0.42, p) * (1 - smoothstep(s.p0 + r * 0.66, s.p0 + r * 0.8, p));
      else o = smoothstep(s.p0 + r * 0.4, s.p0 + r * 0.6, p);
      set(w, '--o', o.toFixed(3));
      const vis = o > 0.05;
      if (w.classList.contains('is-visible') !== vis) w.classList.toggle('is-visible', vis);
    }
    // route strip
    const first = this.tl.scenes[2], lastWorld = [...this.tl.scenes].reverse().find((s) => s.world);
    const on = p > first.p0 - 0.01 && p < (lastWorld ? lastWorld.p1 : 1);
    this.strip.classList.toggle('is-on', on);
    const idx = this.tl.scenes.filter((s) => s.world && p >= s.p0 - 0.002).length - 1;
    this.stripLinks.forEach((a) => {
      const s = sc[a.dataset.go];
      if (!s) return;
      const i = this.tl.scenes.indexOf(s) - 2;
      a.classList.toggle('is-now', i === idx);
      a.classList.toggle('is-past', i < idx);
      if (i === idx) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
    });
    if (roadName && this.stripNow.textContent !== roadName) this.stripNow.textContent = roadName;
    // after the drive the world dims under the DOM sections
    const past = this.trackEndPast || 0;
    set(this.stage, '--dim', (clamp(past / (this.vh * 0.9)) * 0.72).toFixed(3));
    const solid = past > this.vh * 0.25;
    if (this.nav.classList.contains('is-solid') !== solid) this.nav.classList.toggle('is-solid', solid);
    return past;
  }
}
