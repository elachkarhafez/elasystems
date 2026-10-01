/* ============================================================================
   20-pillars.js — "Three bars of light": the bars arrive one by one from
   darkness (CSS: fade over 1.2 s, 200 ms apart, each with its own light
   sweep) once the stage has faded up; the strike through "traffic" draws
   smoothly (600 ms) after the headline has risen. Hover is CSS.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES, sec = document.getElementById('pillars');
  if (!ES || !sec) return;
  var html = document.documentElement;
  var reduced = html.dataset.motion === 'reduced';
  var stage = sec.querySelector('.pillars__stage'), e = document.getElementById('pillars-e');
  if (reduced || !stage || !e || !window.MutationObserver) { sec.classList.add('is-in'); return; }
  /* the stage's own fade-up (00-core) is the cue: the bars follow it */
  new MutationObserver(function () { if (stage.classList.contains('is-on')) sec.classList.add('is-in'); }).observe(stage, { attributes: true, attributeFilter: ['class'] });
  if (stage.classList.contains('is-on')) sec.classList.add('is-in');
  sec.addEventListener('focusin', function () { if (!sec.classList.contains('is-in')) { sec.classList.add('is-quick'); sec.classList.add('is-in'); } });
  ES.motion.on(function (r) { if (r) sec.classList.add('is-in'); });
})();
