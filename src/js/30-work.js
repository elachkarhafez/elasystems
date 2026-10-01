/* ============================================================================
   30-work.js — "Bullet time". Each featured shot stands in CSS 3D (the
   perspective and the frames are CSS); as the shot passes through the
   viewport the camera orbits slowly (rotateY -14deg -> +6deg), the phone
   drifts 24 px against the desktop and the tall capture drifts up inside the
   desktop frame. All three are read from the scroll position in the shared
   loop and passed through a lerp (6/s) so they are silky, only for shots near
   the viewport. Fade-up on enter and the dim on exit are the film-cut
   classes from 00-core / 01-scroll. The quiet grid fades up tile by tile
   (CSS); Express Poultry's three frames crossfade every 4 s while on screen.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES, section = document.getElementById('work');
  if (!ES || !section) return;
  var html = document.documentElement;
  var U = ES.util, clamp = U.clamp;
  var reduced = html.dataset.motion === 'reduced';

  var shots = Array.prototype.slice.call(section.querySelectorAll('[data-shot]')).map(function (el) {
    return {
      el: el, rig: el.querySelector('[data-rig]'), drift: el.querySelector('[data-drift]'), desk: el.querySelector('.shot__desk'),
      top: 0, h: 1, travel: 0, near: false,
      ry: U.smooth(6, -14), px: U.smooth(6, 0), dy: U.smooth(6, 0), lastRy: null, lastPx: null, lastDy: null
    };
  });
  function measure() {
    shots.forEach(function (s) {
      s.top = U.docTop(s.el); s.h = Math.max(1, s.el.offsetHeight);
      var fw = s.desk ? s.desk.offsetWidth : 0, fh = s.desk ? s.desk.offsetHeight : 0;
      /* the tall capture (1 : 2.08) drifts over at most its overflow, and never faster than ~0.4 px per px scrolled */
      s.travel = fw > 0 ? clamp(fw * 2.08 - fh, 0, ES.phone() ? 420 : 720) : 0;
    });
  }
  function apply(s, force) {
    var ry = Math.round(s.ry.v * 20) / 20, px = Math.round(s.px.v * 5) / 5, dy = Math.round(s.dy.v * 2) / 2;
    if (force || ry !== s.lastRy || px !== s.lastPx) { s.lastRy = ry; s.lastPx = px; if (s.rig) { s.rig.style.setProperty('--ry', ry + 'deg'); s.rig.style.setProperty('--px', px + 'px'); } }
    if (force || dy !== s.lastDy) { s.lastDy = dy; if (s.drift) s.drift.style.transform = 'translate3d(0,' + (-dy) + 'px,0)'; }
  }
  function tick(now, dt, y, W, H) {
    if (reduced) return false;
    var busy = false, amp = ES.phone() ? 6 : 10;
    for (var i = 0; i < shots.length; i++) {
      var s = shots[i], top = s.top - y, bottom = top + s.h;
      var near = bottom > -0.3 * H && top < 1.3 * H;
      if (near !== s.near) { s.near = near; s.el.classList.toggle('is-near', near); }
      if (!near) continue;
      /* p: 0 when the shot's top reaches the viewport bottom, 1 when its bottom reaches the viewport top */
      var p = clamp((H - top) / (H + s.h), 0, 1);
      s.ry.to(ES.phone() ? (-6 + 12 * p) : (-14 + 20 * p));
      s.px.to(-12 + 24 * p);
      s.dy.to(s.travel * p);
      var a = s.ry.step(dt), b = s.px.step(dt), c = s.dy.step(dt);
      if (a || b || c) { busy = true; apply(s, false); }
    }
    return busy;
  }

  /* ---- Express Poultry's frames: a slow crossfade (4 s each) while the tile is on screen */
  var stepTiles = Array.prototype.slice.call(section.querySelectorAll('[data-steps]')).map(function (li) {
    return { el: li, steps: Array.prototype.slice.call(li.querySelectorAll('.tile__step')), imgs: Array.prototype.slice.call(li.querySelectorAll('img')), i: 0, t: 0 };
  });
  function setStep(t, i) {
    t.i = i;
    t.steps.forEach(function (p, k) { p.classList.toggle('is-on', k === i); if (k === i) p.removeAttribute('aria-hidden'); else p.setAttribute('aria-hidden', 'true'); });
  }
  function startSteps(t) { stopSteps(t); t.imgs.forEach(function (im) { if (im.loading === 'lazy') im.loading = 'eager'; }); t.t = setInterval(function () { if (!document.hidden) setStep(t, (t.i + 1) % t.steps.length); }, 4000); }
  function stopSteps(t) { if (t.t) { clearInterval(t.t); t.t = 0; } }

  function boot() {
    measure();
    ES.loop.onMeasure(measure); ES.loop.onResize(function () { measure(); shots.forEach(function (s) { apply(s, true); }); });
    if (reduced) { shots.forEach(function (s) { s.ry.jump(-4); s.px.jump(0); s.dy.jump(0); apply(s, true); }); return; }
    shots.forEach(function (s) { apply(s, true); });
    ES.loop.add(tick);
    if ('IntersectionObserver' in window) stepTiles.forEach(function (t) {
      if (t.steps.length < 2) return;
      new IntersectionObserver(function (en) { if (en[0].isIntersecting) startSteps(t); else stopSteps(t); }, { threshold: 0.2 }).observe(t.el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  ES.motion.on(function (r) {
    if (!r) return;
    reduced = true;
    shots.forEach(function (s) { s.ry.jump(-4); s.px.jump(0); s.dy.jump(0); apply(s, true); s.el.classList.remove('is-near'); });
    stepTiles.forEach(function (t) { stopSteps(t); setStep(t, 0); });
  });
})();
