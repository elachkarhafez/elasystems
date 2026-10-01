/* ============================================================================
   01-scroll.js — window.ES.scroll: the page scrolls like a page.
   - Lenis on fine pointers only (lerp 0.075), native on touch. Never pinned.
   - The film cut: every [data-dip] block gets a dip overlay (black, or paper
     for the Apps -> Systems cut) whose opacity follows the block's exit
     (0 -> 85 % over the last 60 vh of the block) through a lerp (6/s), only
     while the block is near the viewport. The incoming block's fade-up and
     push-in are IntersectionObserver classes (00-core).
   - The letterbox bars leave on the first scroll (html[data-lb="off"]).
   - html[data-scene] follows the section under the viewport centre (the top
     bar's ground and ink, the phone bottom bar); the nav's aria-current too.
   - scrollTo with focus management (anchor links, the diagnose "See:" link),
     the "Reduce effects" toggle, the light sweep on any sms:/tel: press.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES = window.ES || {};
  var html = document.documentElement;
  var U = ES.util, clamp = U.clamp;
  var reduced = html.dataset.motion === 'reduced';
  var fine = html.dataset.input === 'fine';
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > .section'));
  var lenis = null;

  var scroll = ES.scroll = { lenis: null, scrollTo: scrollTo, reduced: reduced, docTop: U.docTop, sceneOf: sceneOf };
  ES.chrome = {
    topbar: function (on) { html.dataset.topbar = on ? 'on' : 'off'; },
    bottombar: function (on) { html.dataset.bottombar = on ? 'on' : 'off'; }
  };
  function sceneOf(sec) { return (sec && sec.dataset.scene) || 'page'; }

  /* ------------------------------------------------------------- lenis */
  if (!reduced && fine && window.Lenis) {
    try {
      lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 1 });
      scroll.lenis = lenis;
      ES.loop.add(function (now) { lenis.raf(now); return !!lenis.isScrolling; });
      lenis.on('scroll', function () { ES.loop.wake(300); });
    } catch (e) { lenis = null; }
  }

  /* ----------------------------------------------------------- the dips */
  var dips = [];
  function easeDim(e) { return e * e * (3 - 2 * e); }
  function buildDips() {
    var els = document.querySelectorAll('[data-dip]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], ov = document.createElement('i'), kind = el.dataset.dip || 'black';
      ov.className = 'dip' + (kind !== 'black' ? ' dip--' + kind : '');
      ov.setAttribute('aria-hidden', 'true');
      el.appendChild(ov);
      /* a cut that changes the ground (night -> paper, paper -> night) goes all the way so the seam between the two
         grounds never shows; a night-on-night cut dims to 85 % */
      dips.push({ el: el, ov: ov, max: kind === 'black' ? 0.85 : 1, span: kind === 'black' ? 0.6 : 0.5, top: 0, h: 1, dim: U.smooth(6, 0), near: false, last: -1 });
    }
  }
  function measureDips() { for (var i = 0; i < dips.length; i++) { var d = dips[i]; d.top = U.docTop(d.el); d.h = Math.max(1, d.el.offsetHeight); } }
  function tickDips(now, dt, y, W, H) {
    if (reduced) return false;
    var busy = false;
    for (var i = 0; i < dips.length; i++) {
      var d = dips[i], bottom = d.top + d.h - y, top = d.top - y;
      var near = bottom > -0.5 * H && top < 1.5 * H;
      if (near !== d.near) { d.near = near; d.ov.classList.toggle('is-near', near); }
      if (!near) { if (d.last !== 0 && d.dim.v === 0) continue; }
      var e = clamp((H - bottom) / (d.span * H), 0, 1);
      d.dim.to(near ? d.max * easeDim(e) : 0);
      if (d.dim.step(dt)) busy = true;
      var v = Math.round(d.dim.v * 500) / 500;
      if (v !== d.last) { d.last = v; d.ov.style.opacity = v ? String(v) : ''; }
    }
    return busy;
  }
  function settleDips() { for (var i = 0; i < dips.length; i++) { var d = dips[i]; d.dim.jump(0); d.ov.style.opacity = ''; d.ov.classList.remove('is-near'); } }

  /* ------------------------------------------------- scene + chrome state */
  var tops = [], curScene = '', curSec = null, pastHero = false, lbOff = false;
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.topbar__nav a[href^="#"]'));
  function measureSections() { tops = sections.map(function (s) { return U.docTop(s); }); }
  function tickScene(now, dt, y, W, H) {
    var mid = y + 0.5 * H, sec = sections[0];
    for (var i = 0; i < sections.length; i++) if (tops[i] <= mid) sec = sections[i];
    if (sec !== curSec) {
      curSec = sec;
      var sc = sceneOf(sec); if (sc !== curScene) { curScene = sc; html.dataset.scene = sc; }
      for (var k = 0; k < navLinks.length; k++) {
        var on = navLinks[k].getAttribute('href') === '#' + sec.id;
        if (on) navLinks[k].setAttribute('aria-current', 'true'); else navLinks[k].removeAttribute('aria-current');
      }
    }
    var ph = y > 0.9 * H;
    if (ph !== pastHero) { pastHero = ph; updateBottombar(); }
    if (!lbOff && y > 2) letterboxOff();
    return false;
  }
  function updateBottombar() { html.dataset.bottombar = (pastHero && html.dataset.numberview !== '1') ? 'on' : 'off'; }
  scroll.updateBottombar = updateBottombar;
  function letterboxOff() { if (lbOff) return; lbOff = true; if (html.dataset.lb) html.dataset.lb = 'off'; }
  ['wheel', 'touchmove'].forEach(function (ev) { window.addEventListener(ev, letterboxOff, { passive: true, once: true }); });
  window.addEventListener('keydown', function (e) { if (/^(Space|ArrowDown|PageDown|End)$/.test(e.code)) letterboxOff(); });

  /* ------------------------------------------------------------ scrollTo */
  function focusable(el) { return !!(el.matches && el.matches('a[href], button, input, select, textarea, summary, [tabindex]')); }
  function focusTarget(el) {
    if (document.activeElement === el) return;
    if (!focusable(el)) el.tabIndex = -1;
    try { el.focus({ preventScroll: true }); } catch (e) { /* noop */ }
  }
  function scrollTo(target, opts) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    opts = opts || {};
    var margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    var top = Math.max(0, Math.round(U.docTop(el) - margin));
    function land() { if (opts.focus !== false) focusTarget(el); }
    if (lenis) { if (Math.abs(top - window.pageYOffset) < 1) land(); else { lenis.scrollTo(top, { duration: opts.duration || 1.4, onComplete: land }); ES.loop.wake(2000); } }
    else { window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' }); setTimeout(land, reduced ? 0 : 700); }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1); if (!id) return;
    var el = document.getElementById(id); if (!el) return;
    e.preventDefault();
    scrollTo(el);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

  /* --------------------------------------------- the light sweep on press */
  ES.sweep = function (el) { if (!el || reduced) return; el.classList.remove('is-sweep'); void el.offsetWidth; el.classList.add('is-sweep'); };
  document.addEventListener('pointerdown', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="sms:"], a[href^="tel:"]');
    if (a) ES.sweep(a);   /* never delays navigation: a class, nothing else */
  }, { passive: true, capture: true });

  /* ------------------------------------------------------------ toggle */
  function setupToggle() {
    var tgl = document.getElementById('reduce-fx');
    if (!tgl) return;
    tgl.checked = reduced;
    tgl.addEventListener('change', function () {
      if (tgl.checked) { ES.motion.set(true); teardown(); }
      else { ES.motion.set(false); location.reload(); }
    });
  }
  function teardown() {
    reduced = true; scroll.reduced = true;
    if (lenis) { try { lenis.destroy(); } catch (e) { /* noop */ } lenis = null; scroll.lenis = null; }
    settleDips();
    html.dataset.topbar = 'on';
    ES.loop.requestMeasure(0);
  }

  /* --------------------------------------------------------------- boot */
  function boot() {
    buildDips();
    measureDips(); measureSections();
    ES.loop.onMeasure(function () { measureDips(); measureSections(); });
    ES.loop.onResize(function () { measureDips(); measureSections(); });
    ES.loop.add(tickDips);
    ES.loop.add(tickScene);
    setupToggle();
    if (reduced) { settleDips(); letterboxOff(); }
    if (location.hash) { letterboxOff(); var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { scrollTo(el, { duration: 0.1 }); }, 60); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
