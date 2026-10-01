/* ============================================================================
   20-pillars.js — the three bars of the E: eyebrow scrambles as the front
   crosses in, bars enter (CSS: slash-edge clip + translate along the normal,
   120 ms apart), words solidify, lines scramble, the thin slash draws after.
   Hover/focus: the bar lifts (CSS) and its mono line scrambles once (re-armed
   after 2 s). Fully out of view for 2 s+ re-arms the whole entrance.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES, sec = document.getElementById('pillars');
  if (!ES || !sec) return;
  var html = document.documentElement;
  var reduced = html.dataset.motion === 'reduced';
  var hasST = !!(window.gsap && window.ScrollTrigger);
  var text = ES.text;
  var eyebrow = document.getElementById('pillars-title');
  var bars = Array.prototype.slice.call(sec.querySelectorAll('.bar'));
  var words = bars.map(function (b) { return b.querySelector('.bar__word'); });
  var lines = bars.map(function (b) { return b.querySelector('.bar__line'); });
  var entered = false, enteredAt = 0, eyebrowDone = false;

  if (reduced || !hasST) { sec.classList.add('is-in'); return; }
  words.forEach(function (w) { text.prime(w); });

  function enter() {
    if (entered) return;
    entered = true; enteredAt = performance.now();
    sec.classList.add('is-in');
    if (!eyebrowDone) { eyebrowDone = true; text.scramble(eyebrow, { duration: 260 }); }
    words.forEach(function (w, i) { text.solidify(w, { delay: 160 + i * 120 }); });
    lines.forEach(function (l, i) { text.scramble(l, { delay: 260 + i * 120, duration: 300, stagger: 14 }); });
  }
  function rearm() {
    if (!entered || performance.now() - enteredAt < 2000) return;
    entered = false; eyebrowDone = false;
    sec.classList.remove('is-in');
    words.forEach(function (w) { text.prime(w); });
  }

  // The hero -> pillars window sweeps late (front range 0.6-1), so the entrance is driven by the
  // boundary itself: the eyebrow decodes as the front starts across, the bars arrive once the
  // front has cleared the left edge. onSection only covers landings where no window runs.
  // (windows are bound by 02-scroll on DOMContentLoaded, after this file runs: look the hero window up lazily)
  function heroWin() { var W = ES.scroll.windows || []; for (var i = 0; i < W.length; i++) if (W[i].A && W[i].A.id === 'hero') return W[i]; return null; }
  ES.scroll.onBoundary('hero', function (p, f) {
    if (f > 0.02 && !eyebrowDone && !entered) { eyebrowDone = true; text.scramble(eyebrow, { duration: 260 }); }
    if (f >= 0.08) enter();
  });
  ES.scroll.onSection(sec, {
    enter: function () { var w = heroWin(); if (w && w.p > 0 && w.p < 1) return; enter(); },
    progress: function (p) { if (p <= 0.001 || p >= 0.999) rearm(); }
  });

  // hover / focus: one mono scramble per bar, re-armed after 2 s
  bars.forEach(function (b, i) {
    var link = b.querySelector('.bar__link'), last = 0;
    function once() {
      if (!entered) return;
      var now = performance.now(); if (now - last < 2000) return;
      last = now; text.scramble(lines[i], { duration: 300, stagger: 14 });
    }
    link.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') once(); });
    link.addEventListener('focus', once);
  });

  ES.motion.on(function (r) { if (r) { entered = true; sec.classList.add('is-in'); words.forEach(function (w) { text.solidify(w, { instant: true }); }); } });
})();
