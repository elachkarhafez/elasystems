/* ============================================================================
   50-contact.js — "The number in light": the big number fades up over 1.4 s
   while the light sweep crosses it (CSS, .is-sweep); pressing any sms: link
   fires the sweep once at once (01-scroll adds the class on pointerdown,
   never delaying navigation); the sweep returns every ~14 s while the number
   is on screen. Copy button: navigator.clipboard, execCommand fallback,
   selection as the last resort; feedback through the label + a live region.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES, sec = document.getElementById('contact');
  if (!ES || !sec) return;
  var html = document.documentElement;
  var reduced = html.dataset.motion === 'reduced';
  var $ = function (id) { return document.getElementById(id); };
  var num = $('contact-number'), copyBtn = $('contact-copy'), copyLabel = $('contact-copy-label'), copied = $('contact-copied');
  var NUMBER = '313-300-6898';

  /* ------------------------------------------------ copy (every mode) */
  if (copyBtn && copyLabel) {
    var copyT = 0, COPY = 'Copy number';
    function say(msg) { if (copied) { copied.textContent = ''; copied.textContent = msg; } }
    function feedback(ok) {
      clearTimeout(copyT);
      copyBtn.classList.toggle('is-done', ok); copyBtn.classList.toggle('is-failed', !ok);
      copyLabel.textContent = ok ? 'Copied' : 'Number selected';
      say(ok ? 'Number copied: 313-300-6898' : 'Copy is not available here. The number is selected; copy it from the selection.');
      copyT = setTimeout(function () { copyBtn.classList.remove('is-done', 'is-failed'); copyLabel.textContent = COPY; }, 1800);
    }
    function selectNumber() {
      try { var sel = window.getSelection(), r = document.createRange(); r.selectNodeContents(num); sel.removeAllRanges(); sel.addRange(r); } catch (e) { /* noop */ }
    }
    function fallback() {
      var ok = false;
      try {
        var ta = document.createElement('textarea');
        ta.value = NUMBER; ta.setAttribute('readonly', ''); ta.setAttribute('aria-hidden', 'true'); ta.tabIndex = -1;
        ta.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;padding:0;border:0;opacity:0;font-size:16px;pointer-events:none';
        document.body.appendChild(ta);
        ta.focus({ preventScroll: true }); ta.select(); ta.setSelectionRange(0, NUMBER.length);
        ok = !!document.execCommand('copy');
        document.body.removeChild(ta);
        try { copyBtn.focus({ preventScroll: true }); } catch (e) { /* noop */ }
      } catch (e) { ok = false; }
      if (!ok) selectNumber();
      return ok;
    }
    copyBtn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext !== false) {
        navigator.clipboard.writeText(NUMBER).then(function () { feedback(true); }, function () { feedback(fallback()); });
      } else feedback(fallback());
    });
  }

  if (reduced || !num || !('IntersectionObserver' in window)) { if (num) num.classList.add('is-lit'); return; }

  /* ------------------------------------------------ the number in light */
  var onScreen = false, sweepT = 0, lit = false;
  function scheduleSweep() {
    clearTimeout(sweepT);
    sweepT = setTimeout(function () { if (onScreen && !document.hidden && html.dataset.motion !== 'reduced') ES.sweep(num); scheduleSweep(); }, 14000);
  }
  new IntersectionObserver(function (en) {
    onScreen = en[0].isIntersecting;
    if (onScreen && !lit) { lit = true; num.classList.add('is-lit'); setTimeout(function () { ES.sweep(num); }, 200); scheduleSweep(); }
  }, { threshold: 0.3 }).observe(num);
  num.addEventListener('focus', function () { if (!lit) { lit = true; num.classList.add('is-lit'); } });

  ES.motion.on(function (r) { if (r) { reduced = true; clearTimeout(sweepT); num.classList.add('is-lit'); num.classList.remove('is-sweep'); } });
})();
