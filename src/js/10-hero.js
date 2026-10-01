/* ============================================================================
   10-hero.js — "Opening title". Black, letterbox. 0.3 s the mark fades in
   (1.6 s) under a slow push-in (1.10 -> 1.00 over 7 s); 1.4 s the gold light
   sweep crosses the mark (2.4 s); 2.2 s the wordmark (and the top bar); 3.0 s
   the headline rises; 3.8 s the mono line and the pill; 4.6 s the scroll cue.
   Every beat is a class on #hero; CSS owns the motion. Skippable: any scroll
   or tap snaps to the final state in 400 ms (.is-skip). The sweep returns
   every ~12 s while the hero is on screen. Pointer parallax: mark +-6 px,
   haze +-10 px, damped (lerp 2.5/s ~ 1.2 s). The copy block's height is
   measured into --copy-h so the mark never collides with the headline.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES, hero = document.getElementById('hero');
  if (!ES || !hero) return;
  var html = document.documentElement;
  var reduced = html.dataset.motion === 'reduced';
  var U = ES.util;
  var copy = document.getElementById('hero-copy'), par = document.getElementById('hero-par'), haze = hero.querySelector('.haze');
  var BEATS = [[300, 'is-mark'], [1400, 'is-sweep'], [2200, 'is-wm'], [3000, 'is-title'], [3800, 'is-cta'], [4600, 'is-cue'], [5800, 'is-done']];
  var timers = [], done = false, t0 = performance.now();

  function measureCopy() { if (copy) hero.style.setProperty('--copy-h', Math.round(copy.offsetHeight) + 'px'); }
  measureCopy();
  ES.loop.onResize(measureCopy);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureCopy);

  function finish() {
    if (done) return; done = true;
    timers.forEach(clearTimeout); timers.length = 0;
    delete html.dataset.intro;
  }
  if (reduced || html.dataset.intro !== '1') {
    BEATS.forEach(function (b) { hero.classList.add(b[1]); });
    finish();
  } else {
    BEATS.forEach(function (b) {
      timers.push(setTimeout(function () {
        hero.classList.add(b[1]);
        if (b[1] === 'is-wm') delete html.dataset.intro;
        if (b[1] === 'is-done') finish();
      }, b[0]));
    });
    /* skippable: any scroll or tap after a short grace snaps to the final state (400 ms, CSS) */
    function skip(e) {
      if (done || performance.now() - t0 < 350) return;
      if (e && e.type === 'keydown' && !/^(Space|ArrowDown|ArrowUp|PageDown|PageUp|End|Home|Enter)$/.test(e.code)) return;
      hero.classList.add('is-skip');
      BEATS.forEach(function (b) { hero.classList.add(b[1]); });
      finish();
    }
    window.addEventListener('wheel', skip, { passive: true });
    window.addEventListener('touchmove', skip, { passive: true });
    window.addEventListener('scroll', function () { if (window.pageYOffset > 4) skip(); }, { passive: true });
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerup', function (e) { if (!e.target.closest || !e.target.closest('a, button, input, label')) skip(e); }, { passive: true });
    setTimeout(function () { if (!done) skip(); }, 7000);   /* never leave the hero half-built */
  }

  /* the light returns every ~12 s while the hero is on screen */
  var onScreen = true, sweepT = 0;
  function scheduleSweep() {
    clearTimeout(sweepT);
    sweepT = setTimeout(function () {
      if (onScreen && !document.hidden && html.dataset.motion !== 'reduced') { hero.classList.remove('is-sweep'); void hero.offsetWidth; hero.classList.add('is-sweep'); }
      scheduleSweep();
    }, 12000);
  }
  if (!reduced) {
    scheduleSweep();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; }, { threshold: 0.1 }).observe(hero);
  }

  /* pointer parallax, damped */
  if (!reduced && html.dataset.input === 'fine' && par) {
    var px = U.smooth(2.5, 0), py = U.smooth(2.5, 0), lastX = null, lastY = null;
    ES.loop.add(function (now, dt) {
      if (!onScreen || html.dataset.motion === 'reduced') return false;
      px.to(ES.pointer.x); py.to(ES.pointer.y);
      var a = px.step(dt), b = py.step(dt);
      var x = Math.round(px.v * 60) / 10, y = Math.round(py.v * 60) / 10;
      if (x !== lastX || y !== lastY) {
        lastX = x; lastY = y;
        par.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
        if (haze) haze.style.transform = 'translate3d(' + (-x * 1.6).toFixed(1) + 'px,' + (-y * 1.6).toFixed(1) + 'px,0)';
      }
      return a || b;
    });
  }

  ES.motion.on(function (r) {
    if (!r) return;
    reduced = true; clearTimeout(sweepT);
    hero.classList.remove('is-skip');
    BEATS.forEach(function (b) { hero.classList.add(b[1]); });
    hero.classList.remove('is-sweep');
    finish();
    if (par) par.style.transform = ''; if (haze) haze.style.transform = '';
  });
})();
