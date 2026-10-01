/* ============================================================================
   50-contact.js — "The live line"
   Screen A: the eyebrow scrambles and the headline solidifies as the front
   from the construct crosses it (boundary-driven; onSection for landings).
   Screen B: TEXT US + "Start with a message." scramble, the pill digits lock
   last; the mono lines and the body arrive by the slash edge (no scramble on
   contact details: they must be readable the moment they land).
   THE NUMBER CATCH: the DOM anchor's digits are rasterised per character,
   with the anchor's own font, size, tracking and line positions (Range
   rects + fontBoundingBoxAscent), into a mask canvas for ES.rain.setNumber;
   while the number screen is sticky (80 vh of scroll) the catch scrubs 0 -> 1
   and the rect follows the DOM every scroll frame. Re-rasterised on resize,
   on font arrival and when a lost WebGL context comes back.
   Copy button: navigator.clipboard, execCommand fallback, selection as the
   last resort; feedback through the mono label (scramble) + a live region.
   Pulse origin: for any sms:/tel: press away from the number while nothing is
   caught, the ring starts from the pressed link (02-scroll fires the pulse).
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES, sec = document.getElementById('contact');
  if (!ES || !sec) return;
  var html = document.documentElement;
  var reduced = html.dataset.motion === 'reduced';
  var hasST = !!(window.gsap && window.ScrollTrigger);
  var U = ES.util, text = ES.text, rain = ES.rain;
  var $ = function (id) { return document.getElementById(id); };
  var stage = sec.querySelector('.contact__stage'), head = sec.querySelector('.contact__head');
  var eyebrow = $('contact-eyebrow'), title = $('contact-title');
  var pin = $('contact-pin'), live = $('contact-live'), label = $('contact-label'), start = $('contact-start');
  var num = $('contact-number');
  var lines = num ? Array.prototype.slice.call(num.querySelectorAll('[data-line]')) : [];
  var cta = $('contact-cta');
  var copyBtn = $('contact-copy'), copyLabel = $('contact-copy-label'), copied = $('contact-copied');
  var NUMBER = '313-300-6898';

  /* ------------------------------------------------ copy (every mode) */
  if (copyBtn && copyLabel) {
    var copyT = 0, COPY = 'Copy number';
    function say(msg) { if (copied) { copied.textContent = ''; copied.textContent = msg; } }
    // feedback must not wait in the text engine's queue behind other jobs: finish them, then decode the label
    function setLabel(t) { if (text && text.scramble) { text.finishAll(); text.scramble(copyLabel, { text: t, duration: 240, stagger: 14 }); } else copyLabel.textContent = t; }
    function feedback(ok) {
      clearTimeout(copyT);
      copyBtn.classList.toggle('is-done', ok); copyBtn.classList.toggle('is-failed', !ok);
      setLabel(ok ? 'Copied' : 'Number selected');
      say(ok ? 'Number copied: 313-300-6898' : 'Copy is not available here. The number is selected; copy it from the selection.');
      copyT = setTimeout(function () { copyBtn.classList.remove('is-done', 'is-failed'); setLabel(COPY); }, 1800);
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

  /* ------------------------------------------------ static modes stop here */
  if (reduced || !hasST || !stage || !live) {
    sec.classList.add('is-in'); if (live) live.classList.add('is-in');
    return;
  }

  /* ------------------------------------------------ screen A: the front crosses the headline */
  text.prime(title);
  var playedA = false, playedAt = 0, scrubbedA = false;
  function playA(timed) {
    if (playedA) return;
    playedA = true; playedAt = performance.now();
    sec.classList.add('is-in');
    text.scramble(eyebrow, { duration: 260 });
    if (timed) text.solidify(title, { delay: 80 });
  }
  function rearmA() {
    if (!playedA || performance.now() - playedAt < 2000) return;
    playedA = false; scrubbedA = false; sec.classList.remove('is-in'); text.prime(title);
  }
  function contactWindow() { var W = ES.scroll.windows || []; for (var i = 0; i < W.length; i++) if (W[i].B === sec) return W[i]; return null; }
  var prevId = sec.previousElementSibling && sec.previousElementSibling.id;
  // the headline compiles in the wake of the slash edge: a scrub of the front, no job queue
  if (prevId) ES.scroll.onBoundary(prevId, function (p, f) {
    if (f > -0.2 && f < 1.3 && head) {
      var r = head.getBoundingClientRect();
      var fHit = U.frontThrough(r.left + 36, r.top + r.height * 0.55);
      var t = U.clamp((f - fHit) / 0.42, 0, 1);
      if (t > 0 || scrubbedA) { scrubbedA = true; text.solidifyAt(title, t); }
      if (t > 0) playA(false);
    }
    if (f <= -0.24) rearmA();
  });
  ES.scroll.onSection(stage, {
    enter: function () { var w = contactWindow(); if (w && w.p > 0 && w.p < 1) return; if (scrubbedA) { playA(false); text.solidifyAt(title, 1); } else playA(true); },
    progress: function (p) { if (p <= 0.001) rearmA(); }
  });

  /* ------------------------------------------------ screen B: arrival */
  var playedB = false, playedBAt = 0;
  function playB() {
    if (playedB) return;
    playedB = true; playedBAt = performance.now();
    live.classList.add('is-in');
    // the sections above are off screen now: complete their queued jobs so these three start at once
    text.finishAll();
    if (label) text.scramble(label, { duration: 260 });
    if (start) text.scramble(start, { delay: 120, duration: 300, stagger: 14 });
    if (cta) text.digits(cta, { delay: 220 });
  }
  function rearmB() {
    if (!playedB || performance.now() - playedBAt < 2000) return;
    playedB = false; live.classList.remove('is-in');
  }
  ES.scroll.onSection(pin, { enter: playB, progress: function (p) { if (p <= 0.001 || p >= 0.999) rearmB(); } });

  /* ------------------------------------------------ the number catch */
  var maskCv = null, maskUp = false, catchV = 0, bound = false;
  var rectN = { x: 0, y: 0, w: 1, h: 1 };
  var range = document.createRange();
  function measureNum() { var r = num.getBoundingClientRect(); rectN.x = r.left; rectN.y = r.top; rectN.w = r.width; rectN.h = r.height; return r; }
  function raster() {
    if (!num || html.dataset.webgl !== 'ok') return false;
    var r = measureNum();
    if (r.width < 2 || r.height < 2) return false;
    var cs = getComputedStyle(num), size = parseFloat(cs.fontSize) || 100, ls = parseFloat(cs.letterSpacing) || 0;
    var scale = Math.min(2, 2048 / Math.max(1, r.width), 2048 / Math.max(1, r.height));
    var cv = maskCv || (maskCv = document.createElement('canvas'));
    cv.width = Math.max(2, Math.round(r.width * scale)); cv.height = Math.max(2, Math.round(r.height * scale));
    var ctx = cv.getContext('2d'); if (!ctx) return false;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    // the anchor's font: Archivo wght 820, wdth 125 ("expanded" = 125 % on the variable axis)
    ctx.font = '820 expanded ' + size + 'px "Archivo", "Helvetica Neue", Arial, sans-serif';
    if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
    var m = ctx.measureText('0'), asc = m.fontBoundingBoxAscent;
    for (var i = 0; i < lines.length; i++) {
      var sp = lines[i];
      range.selectNodeContents(sp);
      var rr = range.getBoundingClientRect();
      if (rr.width < 1 || rr.height < 1) continue;
      // the DOM baseline of this line: the inline box top + the font's ascent (Archivo: 0.807 of the box)
      var base = asc > 0 ? rr.top + asc : rr.top + rr.height * 0.807;
      ctx.save();
      ctx.translate((rr.left - r.left) * scale, (base - r.top) * scale);
      ctx.scale(scale, scale);
      var s = sp.textContent, x = 0;
      for (var k = 0; k < s.length; k++) {
        var ch = s.charAt(k);
        if (ch !== ' ') ctx.fillText(ch, x, 0);
        x += ctx.measureText(ch).width + ls;
      }
      ctx.restore();
    }
    rain.setNumber({ rect: rectN, maskCanvas: cv, catch: catchV });
    maskUp = true;
    sec.classList.add('is-numbercatch');
    return true;
  }
  function pushRect() { if (!maskUp) return; measureNum(); rain.set({ numRect: rectN, catchNum: catchV }); }
  // the catch starts the moment the number screen rises into view (0 -> 0.35 over the rise, so the digits are
  // already forming when the screen docks) and completes over the 80 vh the screen is held
  function catchOf(p) {
    var hold = Math.max(1, pin.offsetHeight - live.offsetHeight), k = window.innerHeight / (window.innerHeight + hold);
    return p < k ? (p / k) * 0.35 : 0.35 + ((p - k) / (1 - k)) * 0.65;
  }
  function bindCatch() {
    if (bound) return; bound = true;
    ScrollTrigger.create({
      trigger: pin, start: 'top bottom',
      end: function () { return '+=' + Math.max(1, window.innerHeight + pin.offsetHeight - live.offsetHeight); },
      invalidateOnRefresh: true,
      onUpdate: function (s) { catchV = catchOf(s.progress); pushRect(); },
      onRefresh: function (s) { catchV = catchOf(s.progress); pushRect(); }
    });
    // the rect follows the DOM whenever the number screen is anywhere on screen
    ES.scroll.onSection(pin, { progress: function () { pushRect(); } });
  }
  function whenFonts(cb) {
    var done = false, go = function () { if (!done) { done = true; cb(); } };
    if (document.fonts && document.fonts.load) {
      try { document.fonts.load('820 expanded 100px "Archivo"').then(function () { return document.fonts.ready; }).then(go, go); }
      catch (e) { go(); }
      setTimeout(go, 2500);
    } else go();
  }
  rain.on('ready', function () {
    if (html.dataset.webgl !== 'ok') return;
    whenFonts(function () { if (raster()) { bindCatch(); ES.scroll.refresh(); } });
  });
  // re-rasterise on resize (after the engine's own 150 ms resize), and when a lost context returns
  var rT = 0;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { if (maskUp) { raster(); pushRect(); } }, 220); });
  if (window.MutationObserver) new MutationObserver(function () {
    if (html.dataset.webgl === 'ok' && maskUp) { raster(); pushRect(); if (!bound) { bindCatch(); ES.scroll.refresh(); } }
    if (html.dataset.webgl !== 'ok') sec.classList.remove('is-numbercatch');
  }).observe(html, { attributes: true, attributeFilter: ['data-webgl'] });

  /* ------------------------------------------------ pulse origin: the pressed link */
  document.addEventListener('pointerdown', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="sms:"], a[href^="tel:"]');
    if (!a || a === num || catchV > 0.001) return;
    var r = a.getBoundingClientRect();
    rain.set({ numRect: { x: r.left, y: r.top, w: r.width, h: r.height } });
  }, { capture: true, passive: true });

  /* ------------------------------------------------ "Reduce effects" mid-page */
  ES.motion.on(function (r) {
    if (!r) return;
    sec.classList.add('is-in'); live.classList.add('is-in'); sec.classList.remove('is-numbercatch');
    catchV = 0; rain.set({ catchNum: 0 });
    text.solidify(title, { instant: true });
    text.solidifyAt(title, 1);
  });
})();
