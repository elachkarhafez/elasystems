/* ============================================================================
   40-apps.js — "Concept work": the mono label decodes as the front starts
   across, the headline solidifies, then the shelf of paper cut-outs wipes in
   along the slash (CSS) with the group captions scrambling after. Re-armed
   once the section has been fully out of view for 2 s. Reduced motion / no
   GSAP: the CSS composition is final and nothing runs.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES, sec = document.getElementById('apps');
  if (!ES || !sec) return;
  var html = document.documentElement;
  var reduced = html.dataset.motion === 'reduced';
  var hasST = !!(window.gsap && window.ScrollTrigger);
  var text = ES.text;
  var eyebrow = document.getElementById('apps-label'), title = document.getElementById('apps-title');
  var shelf = document.getElementById('apps-shelf');
  var caps = Array.prototype.slice.call(sec.querySelectorAll('.apps__cap b'));
  var headDone = false, eyebrowDone = false, shelfDone = false, shownAt = 0;

  if (reduced || !hasST) { sec.classList.add('is-in'); return; }
  text.prime(title);

  function eyebrowIn() { if (eyebrowDone) return; eyebrowDone = true; text.scramble(eyebrow, { duration: 260 }); }
  function headIn() {
    if (headDone) return;
    headDone = true; shownAt = performance.now();
    eyebrowIn();
    text.solidify(title, { delay: 80 });
  }
  function shelfIn() {
    if (shelfDone) return;
    shelfDone = true; shownAt = performance.now();
    sec.classList.add('is-in');
    caps.forEach(function (c, i) { text.scramble(c, { delay: 520 + i * 180, duration: 260, stagger: 12 }); });
  }
  function rearm() {
    if ((!headDone && !shelfDone) || performance.now() - shownAt < 2000) return;
    headDone = eyebrowDone = shelfDone = false;
    sec.classList.remove('is-in');
    text.prime(title);
  }
  function workWin() { var W = ES.scroll.windows || []; for (var i = 0; i < W.length; i++) if (W[i].A && W[i].A.id === 'work') return W[i]; return null; }

  // the head arrives with the front from #work (eyebrow as it starts, headline once it has cleared the left edge)
  ES.scroll.onBoundary('work', function (p, f) {
    if (f > 0.02 && !headDone) eyebrowIn();
    if (f >= 0.2) headIn();
  });
  ES.scroll.onSection(sec, {
    enter: function () { var w = workWin(); if (w && w.p > 0 && w.p < 1) return; headIn(); },
    progress: function (p) { if (p <= 0.001 || p >= 0.999) rearm(); }
  });
  // the shelf wipes in on its own entry (desktop: during the sweep; phone: when the row rises into view)
  ScrollTrigger.create({
    trigger: shelf, start: 'top 88%', end: 'bottom top',
    onEnter: shelfIn, onEnterBack: shelfIn,
    onRefresh: function (self) { if (self.isActive) shelfIn(); }
  });

  ES.motion.on(function (r) { if (r) { headDone = shelfDone = true; sec.classList.add('is-in'); text.solidify(title, { instant: true }); } });
})();
