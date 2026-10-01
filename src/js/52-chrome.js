/* ============================================================================
   52-chrome.js — persistent chrome behaviour (markup: the top bar in the
   template, the bottom bar in chrome.html; behaviour only, via attributes).
   - html[data-scrolled="1"] once the page has moved (stronger top-bar ground
     over bright storefront captures).
   - Phones (coarse pointer, full motion): the top bar slides away on a
     downward flick past the hero and returns on the first upward move, at
     the top, and whenever the big number is on screen.
   - The bottom bar hides while the big number or its pill is on screen
     (IntersectionObserver -> html[data-numberview="1"], CSS does the cut).
   02-scroll owns html[data-bottombar] (after the hero) and the sms press
   surge + pulse; nothing here duplicates them.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES; if (!ES) return;
  var html = document.documentElement;
  var reduced = html.dataset.motion === 'reduced';
  var coarse = html.dataset.input !== 'fine';

  /* ---- scrolled state + phone top bar ---------------------------------- */
  var ticking = false, lastY = window.scrollY, downAcc = 0, upAcc = 0, hidden = false, lastT = 0;
  function setHidden(h) {
    if (h === hidden) return;
    hidden = h; ES.chrome.topbar(!h);
  }
  function tick() {
    ticking = false;
    var y = window.scrollY, H = window.innerHeight;
    var scrolled = y > 24;
    if ((html.dataset.scrolled === '1') !== scrolled) { if (scrolled) html.dataset.scrolled = '1'; else delete html.dataset.scrolled; }
    if (!coarse || reduced) return;
    var d = y - lastY; lastY = y;
    if (d > 0) { downAcc += d; upAcc = 0; } else if (d < 0) { upAcc -= d; downAcc = 0; }
    var inNumber = html.dataset.numberview === '1';
    var nearBottom = y + H >= (document.documentElement.scrollHeight - 4);
    if (y < H * 1.15 || inNumber || nearBottom) { setHidden(false); downAcc = 0; upAcc = 0; return; }
    if (!hidden && downAcc > 72) setHidden(true);
    else if (hidden && upAcc > 14) setHidden(false);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  tick();

  /* ---- bottom bar vs the big number ------------------------------------ */
  var targets = [document.getElementById('contact-number'), document.getElementById('contact-cta')].filter(Boolean);
  if (coarse && targets.length && 'IntersectionObserver' in window) {
    var flags = targets.map(function () { return false; });
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) { var k = targets.indexOf(entries[i].target); if (k > -1) flags[k] = entries[i].isIntersecting; }
      var any = false; for (var j = 0; j < flags.length; j++) if (flags[j]) any = true;
      if (any) { html.dataset.numberview = '1'; setHidden(false); } else delete html.dataset.numberview;
    }, { threshold: 0 });
    for (var t = 0; t < targets.length; t++) io.observe(targets[t]);
  }

  ES.motion.on(function (r) { if (r) { reduced = true; setHidden(false); } });
})();
