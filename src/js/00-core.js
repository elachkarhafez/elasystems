/* ============================================================================
   00-core.js — window.ES: the shared helpers of the film.
   - ES.util: clamp, lerp, docTop, smooth (an exponential lerp, lambda per s)
   - ES.loop: ONE requestAnimationFrame loop. Everything scroll-linked or
     pointer-linked reads from here (scrollY, pointer, dt) and lerps; the loop
     sleeps when nothing moves and pauses while the document is hidden.
   - ES.reveal: IntersectionObserver reveals (once): [data-rise] at 20 %
     visibility -> .is-in (fade + 24 px rise, staggered by --i in CSS);
     [data-scene-in] on entering the viewport -> .is-on (fade up from black
     with the slow push-in). Keyboard focus into a hidden block reveals it.
   - the film layer: vignette (CSS), one static grain tile generated once on
     a tiny canvas (never per frame), the hero letterbox (html[data-lb]).
   - haze: the out-of-focus gold discs (radial gradients, no filter blur).
   - pointer parallax targets (ES.pointer.x/y, lerped by the consumers).
   - ES.motion: the reduced-motion switch (prefers-reduced-motion or the
     footer toggle): everything in its final state.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES = window.ES || {};
  var html = document.documentElement;
  var SLASH_RUN = 0.535;

  /* ---------------------------------------------------------------- util */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function docTop(el) { var y = 0; while (el && el !== document.body) { y += el.offsetTop; el = el.offsetParent; } return y; }
  /* an exponential approach: v moves toward the target with rate lambda (1/s); settles in ~3/lambda s */
  function smooth(lambda, v) {
    var s = { v: v || 0, t: v || 0, done: true };
    s.to = function (target) { s.t = target; if (Math.abs(s.t - s.v) > 1e-4) s.done = false; return s; };
    s.step = function (dt) {
      if (s.done) return false;
      var d = s.t - s.v;
      if (Math.abs(d) < 5e-4) { s.v = s.t; s.done = true; return true; }
      s.v += d * (1 - Math.exp(-lambda * dt));
      return true;
    };
    s.jump = function (target) { s.v = s.t = target; s.done = true; return s; };
    return s;
  }
  ES.util = { SLASH_RUN: SLASH_RUN, clamp: clamp, lerp: lerp, docTop: docTop, smooth: smooth };
  ES.SLASH_RUN = SLASH_RUN;
  ES.phone = function () { return window.innerWidth < 768; };

  /* -------------------------------------------------------------- motion */
  var motionCbs = [];
  ES.motion = {
    get reduced() { return html.dataset.motion === 'reduced'; },
    set: function (reduced, persist) {
      html.dataset.motion = reduced ? 'reduced' : 'full';
      if (persist !== false) { try { localStorage.setItem('es-motion', reduced ? 'reduced' : 'full'); } catch (e) { /* noop */ } }
      if (reduced) { delete html.dataset.intro; delete html.dataset.lb; }
      for (var i = 0; i < motionCbs.length; i++) { try { motionCbs[i](reduced); } catch (e) { /* noop */ } }
    },
    on: function (cb) { motionCbs.push(cb); }
  };
  function reduced() { return html.dataset.motion === 'reduced'; }

  /* ---------------------------------------------------------------- loop */
  var fns = [], rafId = 0, last = 0, awakeUntil = 0, W = window.innerWidth, H = window.innerHeight;
  var pointer = { x: 0, y: 0, live: false };   /* -1..1 from the viewport centre */
  ES.pointer = pointer;
  function wake(ms) { awakeUntil = Math.max(awakeUntil, performance.now() + (ms || 1200)); if (!rafId && !document.hidden) rafId = requestAnimationFrame(frame); }
  function frame(now) {
    rafId = 0;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
    var y = window.pageYOffset || 0, busy = false;
    for (var i = 0; i < fns.length; i++) { try { if (fns[i](now, dt, y, W, H)) busy = true; } catch (e) { /* a broken tick never stops the film */ } }
    if (busy || now < awakeUntil) rafId = requestAnimationFrame(frame); else last = 0;
  }
  ES.loop = {
    add: function (fn) { if (fns.indexOf(fn) < 0) fns.push(fn); wake(); },
    remove: function (fn) { var i = fns.indexOf(fn); if (i > -1) fns.splice(i, 1); },
    wake: wake,
    get W() { return W; }, get H() { return H; }
  };
  ['scroll', 'wheel', 'touchmove', 'keydown', 'resize'].forEach(function (ev) { window.addEventListener(ev, function () { wake(); }, { passive: true }); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { if (rafId) cancelAnimationFrame(rafId); rafId = 0; last = 0; } else wake(); });
  var onResizeCbs = [], rT = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { W = window.innerWidth; H = window.innerHeight; for (var i = 0; i < onResizeCbs.length; i++) { try { onResizeCbs[i](); } catch (e) { /* noop */ } } wake(); }, 150);
  });
  /* the page's height changes (the diagnose readout, fonts, the Reduce toggle): everyone who measured re-measures */
  var measureCbs = [], mT = 0;
  function requestMeasure(ms) { clearTimeout(mT); mT = setTimeout(function () { for (var i = 0; i < measureCbs.length; i++) { try { measureCbs[i](); } catch (e) { /* noop */ } } wake(); }, ms === undefined ? 120 : ms); }
  ES.loop.onResize = function (cb) { onResizeCbs.push(cb); };
  ES.loop.onMeasure = function (cb) { measureCbs.push(cb); };
  ES.loop.requestMeasure = requestMeasure;
  if (window.ResizeObserver) { var lastH = 0; new ResizeObserver(function () { var h = document.body.offsetHeight; if (h !== lastH) { lastH = h; requestMeasure(); } }).observe(document.body); }
  window.addEventListener('load', function () { requestMeasure(0); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestMeasure(0); });

  if (html.dataset.input === 'fine') {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      pointer.x = clamp((e.clientX / W) * 2 - 1, -1, 1); pointer.y = clamp((e.clientY / H) * 2 - 1, -1, 1); pointer.live = true;
      wake(1600);
    }, { passive: true });
    window.addEventListener('pointerleave', function () { pointer.x = 0; pointer.y = 0; wake(1600); });
  }

  /* -------------------------------------------------------------- reveal */
  var ioRise = null, ioScene = null;
  function show(el, cls) { if (!el.classList.contains(cls)) el.classList.add(cls); }
  function observeAll() {
    var rises = document.querySelectorAll('[data-rise]'), scenes = document.querySelectorAll('[data-scene-in]'), i;
    for (i = 0; i < rises.length; i++) { var v = parseInt(rises[i].dataset.rise, 10); if (v > 0) rises[i].style.setProperty('--i', String(v)); }
    if (reduced() || !('IntersectionObserver' in window)) {
      for (i = 0; i < rises.length; i++) show(rises[i], 'is-in');
      for (i = 0; i < scenes.length; i++) show(scenes[i], 'is-on');
      return;
    }
    ioRise = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) if (entries[k].isIntersecting) { show(entries[k].target, 'is-in'); ioRise.unobserve(entries[k].target); }
    }, { threshold: [0.2] });
    /* big blocks (taller than 70 % of the viewport) can never reach 20 % visibility on a short screen: 0 % plus a margin */
    ioScene = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) if (entries[k].isIntersecting) { var t = entries[k].target; show(t, t.hasAttribute('data-scene-in') ? 'is-on' : 'is-in'); ioScene.unobserve(t); }
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    for (i = 0; i < rises.length; i++) { if (rises[i].offsetHeight > H * 0.7) ioScene.observe(rises[i]); else ioRise.observe(rises[i]); }
    for (i = 0; i < scenes.length; i++) ioScene.observe(scenes[i]);
  }
  function revealAll() {
    var all = document.querySelectorAll('[data-rise], [data-scene-in]');
    for (var i = 0; i < all.length; i++) show(all[i], all[i].hasAttribute('data-scene-in') ? 'is-on' : 'is-in');
    if (ioRise) ioRise.disconnect(); if (ioScene) ioScene.disconnect();
  }
  ES.reveal = { all: revealAll, show: show };
  /* keyboard: Tab into something not revealed yet reveals its block at once (nothing hides from the tab order) */
  document.addEventListener('focusin', function (e) {
    var el = e.target; if (!el || !el.closest) return;
    var r = el.closest('[data-rise]:not(.is-in)'); while (r) { show(r, 'is-in'); r = r.parentElement && r.parentElement.closest('[data-rise]:not(.is-in)'); }
    var s = el.closest('[data-scene-in]:not(.is-on)'); if (s) show(s, 'is-on');
  });

  /* ------------------------------------------------------------ the film */
  function grain() {
    var el = document.getElementById('film-grain'); if (!el) return;
    try {
      var N = 96, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
      var ctx = cv.getContext('2d'); if (!ctx) return;
      var id = ctx.createImageData(N, N), px = id.data;
      for (var i = 0; i < px.length; i += 4) { var v = 160 + (Math.random() * 95) | 0; px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = Math.random() < 0.5 ? 255 : 0; }
      ctx.putImageData(id, 0, 0);
      el.style.backgroundImage = 'url("' + cv.toDataURL('image/png') + '")';
    } catch (e) { /* no grain, no harm */ }
  }
  function haze() {
    var boxes = document.querySelectorAll('[data-haze]');
    for (var b = 0; b < boxes.length; b++) {
      var box = boxes[b], n = ES.phone() ? 4 : (box.dataset.haze === 'hero' ? 8 : 6), seed = b * 7 + 3;
      var frag = document.createDocumentFragment();
      for (var i = 0; i < n; i++) {
        var r1 = frac(seed + i * 1.37), r2 = frac(seed + i * 2.91), r3 = frac(seed + i * 4.13), r4 = frac(seed + i * 5.71);
        var size = Math.round(60 + r3 * 160), disc = document.createElement('i');
        disc.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (4 + r1 * 88).toFixed(1) + '%;top:' + (4 + r2 * 84).toFixed(1) + '%;opacity:' + (0.04 + r4 * 0.06).toFixed(3) +
          ';--dx:' + ((r2 - 0.5) * 14).toFixed(1) + 'px;--dy:' + ((r1 - 0.5) * 12).toFixed(1) + 'px;animation-delay:-' + (r3 * 20).toFixed(1) + 's;animation-duration:' + (18 + r4 * 8).toFixed(1) + 's';
        frag.appendChild(disc);
      }
      box.appendChild(frag);
    }
  }
  function frac(x) { var s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); }

  function boot() {
    grain();
    haze();
    observeAll();
    ES.motion.on(function (r) { if (r) revealAll(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
