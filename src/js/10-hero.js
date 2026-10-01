/* ============================================================================
   10-hero.js — "Caught in the rain": the 5 s intro (skippable), the catch,
   the slash stream, headline solidify (the mark yields to it on desktop),
   CTA digits, then the scrubbed melt, the thesis + slash strike, and the
   first Slash Front into the page.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES = window.ES || {};
  var html = document.documentElement;
  var hero = document.getElementById('hero');
  if (!hero) return;
  var reduced = html.dataset.motion === 'reduced';
  var touch = html.dataset.input !== 'fine';
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var clamp = ES.util.clamp;
  var $ = function (id) { return document.getElementById(id); };
  var els = {
    intro: $('hero-intro') || hero.querySelector('.hero__intro'), mark: $('hero-mark'), copy: $('hero-copy'), title: $('hero-title'),
    sub: $('hero-sub'), cta: $('hero-cta'), thesis: $('hero-thesis'), line1: $('hero-line-1'), line2: $('hero-line-2'),
    strike: $('hero-strike'), lock: $('hero-lock'), cue: $('hero-cue'), topCta: $('topbar-cta'),
    wm: Array.prototype.slice.call(document.querySelectorAll('#wordmark [data-scramble-part]'))
  };

  function measureMark() {
    if (!els.mark) return;
    var r = els.mark.getBoundingClientRect();
    ES.rain.setMarkRect({ x: r.left, y: r.top, w: r.width, h: r.height });
  }
  // the copy block's height drives the mark's yielded pose (--mark-w in 10-hero.css): measured, never guessed, and
  // measured in the headline's FINAL width (a primed headline sits at wdth 86 and wraps to fewer lines)
  function measureCopy() {
    if (!els.copy) return;
    var W = els.title ? els.title.querySelectorAll('.w') : [], saved = [], i;
    for (i = 0; i < W.length; i++) { saved.push(W[i].style.fontVariationSettings); W[i].style.fontVariationSettings = ''; }
    hero.style.setProperty('--copy-h', Math.round(els.copy.offsetHeight) + 'px');
    for (i = 0; i < W.length; i++) W[i].style.fontVariationSettings = saved[i];
  }
  function remeasure() { measureCopy(); measureMark(); }
  var mT = 0;
  window.addEventListener('resize', function () { clearTimeout(mT); mT = setTimeout(remeasure, 160); });
  remeasure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  // while the mark box moves (the 600 ms yield), the engine's rect follows it every frame
  var trackUntil = 0, tracking = false;
  function trackMark(ms) {
    trackUntil = performance.now() + ms;
    if (tracking) return; tracking = true;
    (function tick() { measureMark(); if (performance.now() < trackUntil) requestAnimationFrame(tick); else { tracking = false; measureMark(); } })();
  }

  /* ------------------------------------------------------- reduced: poster */
  // the still frame follows the page: the caught mark stays on the hero's mark box as it scrolls (one draw per scroll frame)
  var following = false, sT = 0;
  function followPoster() {
    if (following) return; following = true;
    window.addEventListener('scroll', function () { if (!sT) sT = requestAnimationFrame(function () { sT = 0; measureMark(); }); }, { passive: true });
    measureMark();
  }
  if (reduced) {
    hero.classList.add('is-idle');
    ES.rain.set({ scene: 'hero', catch: 1, melt: 0, dim: 1, front: -0.25 });
    ES.rain.on('ready', function () { measureMark(); ES.rain.requestFrame(); });
    followPoster();
    return;
  }

  /* --------------------------------------------------------- live state */
  ES.rain.set({ scene: 'hero', timeScale: 1, catch: 0, melt: 0, velocityCoupling: false });
  if (els.copy) els.copy.dataset.textmask = 'off';
  if (els.thesis) els.thesis.dataset.textmask = 'off';
  if (els.intro) els.intro.dataset.textmask = 'off';
  ES.text.prime(els.title); ES.text.prime(els.line1); ES.text.prime(els.line2);

  var done = false, scrubP = 0;
  var catchP = { v: 0 };
  function showIntro() { if (els.intro) { els.intro.style.opacity = '1'; els.intro.dataset.textmask = 'on'; ES.text.scramble(els.intro); } }
  function showCopy() {
    if (!els.copy) return;
    els.copy.style.opacity = '1'; els.copy.dataset.textmask = 'on';
    hero.classList.add('is-copy'); trackMark(720);   // the mark yields to the headline (desktop pose, CSS); the engine follows the box
    ES.text.solidify(els.title);
  }
  function showCta() {
    hero.classList.add('is-cta');                     // the subline and the pill exist only from their own arrival
    if (els.sub) ES.text.scramble(els.sub);
    if (els.cta) ES.text.digits(els.cta);
    if (els.cue) els.cue.style.opacity = '1';
  }
  function idle() {
    done = true;
    hero.classList.add('is-idle'); hero.classList.add('is-copy'); hero.classList.add('is-cta');
    trackMark(720);
    ES.rain.bullet(false);
    ES.rain.setCatch(1);
    ES.rain.set({ velocityCoupling: true });
    if (els.copy && scrubP <= 0) { els.copy.style.opacity = '1'; els.copy.dataset.textmask = 'on'; }
    if (els.intro) els.intro.dataset.textmask = 'on';
  }

  var tl = null;
  if (hasGSAP) {
    tl = gsap.timeline({ paused: true, onComplete: idle });
    tl.call(function () { els.wm.forEach(function (p) { ES.text.scramble(p, { duration: 260 }); }); if (els.topCta) ES.text.digits(els.topCta, { lockLastStep: 40 }); }, null, 0.2);
    tl.call(showIntro, null, 0.3);
    tl.call(function () { ES.rain.bullet(true); }, null, 0.9);
    tl.to(catchP, { v: 1, duration: 1.4, ease: 'none', onUpdate: function () { ES.rain.setCatch(catchP.v); } }, 1.2);
    tl.call(function () { ES.rain.slash(); }, null, 2.8);
    tl.call(function () { ES.rain.bullet(false); showCopy(); }, null, 3.2);
    tl.call(showCta, null, 4.0);
    tl.to({}, { duration: 1.3 }, 4.0);
  }
  function skip() {
    if (done) return;
    if (tl) { tl.progress(1); } else idle();
    ES.text.finishAll();
    if (els.intro) els.intro.style.opacity = '1';
    if (els.copy) { els.copy.style.opacity = '1'; }
    if (els.cue) els.cue.style.opacity = '1';
    ES.rain.set({ catch: 1, slash: -1, slashGlow: 0 });
    ES.rain.setTimeScale(1, 0);
  }
  // skippable: any scroll or tap after a short grace
  var t0 = performance.now();
  function maybeSkip(e) {
    if (done || performance.now() - t0 < 350) return;
    if (e && e.type === 'keydown' && !/^(Space|ArrowDown|ArrowUp|PageDown|PageUp|End|Home)$/.test(e.code)) return;
    skip();
  }
  window.addEventListener('wheel', maybeSkip, { passive: true });
  window.addEventListener('touchmove', maybeSkip, { passive: true });
  window.addEventListener('scroll', function () { if (window.scrollY > 4) maybeSkip(); }, { passive: true });
  window.addEventListener('keydown', maybeSkip);
  window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse' || !e.target.closest('a, button')) maybeSkip(e); }, { passive: true });

  // safety: never leave the hero blank
  setTimeout(function () { if (!done) { skip(); } }, 7000);

  if (tl) {
    if (!touch) ES.rain.set({ drift: false });
    tl.play();
  } else {
    showIntro(); showCopy(); showCta(); ES.rain.setCatch(1); idle();
  }

  /* --------------------------------------------------------- the scrub */
  // the first copy has left (opacity 0, 140 px up) by p = 0.28; the thesis arrives from p = 0.34: the two display
  // headlines never share the screen, forwards or backwards
  function applyScrub(p) {
    scrubP = p = clamp(p, 0, 1);
    if (p > 0.02 && !done) skip();
    ES.rain.setMelt(p);
    var out = clamp(p / 0.28, 0, 1);
    if (els.copy) {
      els.copy.style.opacity = done ? (1 - out).toFixed(3) : '0';
      els.copy.style.transform = 'translate3d(0,' + (-140 * out).toFixed(1) + 'px,0)';
      els.copy.dataset.textmask = (done && out < 0.6) ? 'on' : 'off';
    }
    if (els.intro) els.intro.style.opacity = done ? (1 - out).toFixed(3) : '0';
    if (els.cue) els.cue.style.opacity = done ? (1 - out).toFixed(3) : '0';
    var tin = clamp((p - 0.34) / 0.66, 0, 1);
    if (els.thesis) {
      els.thesis.style.opacity = tin > 0 ? '1' : '0';
      els.thesis.dataset.textmask = tin > 0.2 ? 'on' : 'off';
    }
    ES.text.solidifyAt(els.line1, clamp(tin / 0.55, 0, 1));
    ES.text.strikeAt(els.strike, clamp((tin - 0.5) / 0.2, 0, 1));
    ES.text.solidifyAt(els.line2, clamp((tin - 0.3) / 0.55, 0, 1));
    var lk = clamp((tin - 0.82) / 0.18, 0, 1);
    if (els.lock) els.lock.style.color = lk > 0 ? 'color-mix(in srgb, var(--gold) ' + Math.round(lk * 100) + '%, var(--paper))' : '';
  }
  var meltST = null;
  if (hasGSAP) {
    if (!touch) {
      // desktop: the boundary window (pinned 100vh): 0-60% melt + thesis, 60-100% the first Slash Front (02-scroll)
      ES.scroll.onBoundary('hero', function (p) { applyScrub(p / 0.6); });
    } else {
      // touch: the hero is 160svh with a sticky stage; melt over the first 60svh, then the front as pillars rises (02-scroll)
      meltST = ScrollTrigger.create({ trigger: hero, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 0.6); }, onUpdate: function (s) { applyScrub(s.progress); } });
    }
  }
  // pointer parallax goes live during bullet time: engine handles pointermove; keep the mark measured once fonts settle
  ES.rain.on('ready', measureMark);

  /* ------------------------------- "Reduce effects" switched on mid-page */
  // the hero becomes the poster: the melt scrub is gone, every inline state it wrote is cleared (the copy, the intro, the
  // cue, the thesis), the thesis headlines are final with the strike drawn, and the still frame follows the mark box
  ES.motion.on(function (r) {
    if (!r) return;
    done = true;
    if (tl) { tl.kill(); tl = null; }
    if (meltST) { meltST.kill(); meltST = null; }
    hero.classList.add('is-idle');
    ['copy', 'intro', 'cue', 'thesis'].forEach(function (k) { var el = els[k]; if (!el) return; el.style.opacity = ''; el.style.transform = ''; delete el.dataset.textmask; });
    if (els.lock) els.lock.style.color = '';
    ES.text.solidifyAt(els.line1, 1); ES.text.solidifyAt(els.line2, 1); ES.text.strikeAt(els.strike, 1);
    ES.rain.set({ scene: 'hero', catch: 1, melt: 0, dim: 1, slash: -1, slashGlow: 0, timeScale: 1 });
    remeasure();
    followPoster();
  });
})();
