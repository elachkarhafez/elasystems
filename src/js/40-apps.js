/* ============================================================================
   40-apps.js — "Concept work": the seven renders float in three depth
   layers; with a fine pointer each layer drifts +-4 / 8 / 12 px, damped
   (lerp 2.5/s), only while the section is on screen. The fade-up with the
   120 ms stagger and the 6 s Ken Burns are CSS ([data-rise], [data-kb]).
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES, sec = document.getElementById('apps');
  if (!ES || !sec) return;
  var html = document.documentElement;
  if (html.dataset.motion === 'reduced' || html.dataset.input !== 'fine') return;
  var U = ES.util;
  var cuts = Array.prototype.slice.call(sec.querySelectorAll('.cut[data-layer]'));
  var px = U.smooth(2.5, 0), py = U.smooth(2.5, 0), onScreen = false, lastKey = '';
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (onScreen) ES.loop.wake(); }, { threshold: 0.05 }).observe(sec);
  ES.loop.add(function (now, dt) {
    if (!onScreen || html.dataset.motion === 'reduced') return false;
    px.to(ES.pointer.x); py.to(ES.pointer.y);
    var a = px.step(dt), b = py.step(dt);
    var key = px.v.toFixed(2) + ',' + py.v.toFixed(2);
    if (key !== lastKey) {
      lastKey = key;
      for (var i = 0; i < cuts.length; i++) {
        var amp = 4 * (parseInt(cuts[i].dataset.layer, 10) || 1);
        cuts[i].style.transform = 'translate3d(' + (px.v * amp).toFixed(1) + 'px,' + (py.v * amp * 0.7).toFixed(1) + 'px,0)';
      }
    }
    return a || b;
  });
  ES.motion.on(function (r) { if (r) cuts.forEach(function (c) { c.style.transform = ''; }); });
})();
