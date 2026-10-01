/* ============================================================================
   01-text.js — window.ES.text: the two text arrivals (scramble for mono,
   solidify for display) + the slash strike + the ten-digit lock.
   One rAF loop, pooled spans, max 3 concurrent jobs, real text kept in the
   DOM (visually hidden copy) while scrambling. Reduced motion = instant.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES = window.ES || {};
  var html = document.documentElement;
  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·–'; // the brand glyph set only (what the rain atlas carries)
  var MAX = 3;
  var pool = [], active = [], queue = [], rafId = 0;

  function reduced() { return html.dataset.motion === 'reduced'; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function easeOut(u) { u = 1 - clamp(u, 0, 1); return 1 - u * u * u; }
  function rnd() { return ALPHABET[(Math.random() * ALPHABET.length) | 0]; }
  function getSpan() { return pool.pop() || document.createElement('span'); }
  function release(sp) { sp.textContent = ''; sp.className = ''; sp.removeAttribute('style'); sp.removeAttribute('aria-hidden'); if (pool.length < 200) pool.push(sp); }

  // after a fast navigation the queue fills with jobs for elements far off screen: those finish instantly so the
  // three slots stay free for what is actually in view
  function offscreen(el) { if (!el || !el.getBoundingClientRect) return false; var r = el.getBoundingClientRect(), H = window.innerHeight; return r.bottom < -H || r.top > 2 * H; }
  function loop(now) {
    rafId = 0;
    for (var i = active.length - 1; i >= 0; i--) {
      var j = active[i];
      var done = false;
      try { done = j.step(now); } catch (e) { done = true; }
      if (done) { active.splice(i, 1); j.finish(); }
    }
    if (queue.length) {
      for (var q = queue.length - 1; q >= 0; q--) if (offscreen(queue[q].el)) { var jq = queue.splice(q, 1)[0]; jq.finish(); }
      for (var a = active.length - 1; a >= 0; a--) if (offscreen(active[a].el)) { var ja = active.splice(a, 1)[0]; ja.finish(); }
    }
    while (active.length < MAX && queue.length) { var k = queue.shift(); k.start(now); active.push(k); }
    if (active.length) rafId = requestAnimationFrame(loop);
  }
  function schedule(job) {
    if (active.length < MAX) { job.start(performance.now()); active.push(job); } else queue.push(job);
    if (!rafId) rafId = requestAnimationFrame(loop);
  }
  function cancelJob(el) {
    var j = el.__esJob; if (!j) return;
    var i = active.indexOf(j); if (i > -1) active.splice(i, 1);
    i = queue.indexOf(j); if (i > -1) queue.splice(i, 1);
    j.finish();
  }
  function normText(el, opts) {
    var t = opts && opts.text !== undefined ? opts.text : (el.dataset.text !== undefined ? el.dataset.text : el.textContent);
    return String(t).replace(/\s+/g, ' ').trim();
  }

  /* ------------------------------------------------------------ scramble */
  function scramble(el, opts) {
    if (!el) return;
    opts = opts || {};
    cancelJob(el);
    var text = normText(el, opts);
    el.dataset.text = text;
    if (reduced() || opts.instant) { el.textContent = text; if (opts.onDone) opts.onDone(); return; }
    var dur = opts.duration || 300, stagger = opts.stagger === undefined ? 18 : opts.stagger, delay = opts.delay || 0;
    var lockLast = opts.lockLast || null, lastStep = opts.lockLastStep || 60;
    var chars = text.split(''), n = chars.length;
    var spans = [], locked = [], flipAt = [], lockAt = [];
    var baseAll = (n - 1) * stagger + dur, late = 0;
    for (var i = 0; i < n; i++) {
      var isLate = lockLast && lockLast(chars[i], i);
      lockAt[i] = isLate ? baseAll + (late++) * lastStep : i * stagger + dur;
      locked[i] = chars[i] === ' ';
      flipAt[i] = 0;
    }
    var job = {
      el: el, t0: 0, lockedW: false,
      start: function (now) {
        this.t0 = now + delay;
        var cs = getComputedStyle(el);
        if (cs.display !== 'inline') { var w = el.getBoundingClientRect().width; if (w > 0) { el.style.minWidth = w + 'px'; this.lockedW = true; } }
        var sr = getSpan(); sr.className = 'sr-only'; sr.textContent = text;
        var wrap = getSpan(); wrap.setAttribute('aria-hidden', 'true'); wrap.className = 'scr';
        for (var i = 0; i < n; i++) { var s = getSpan(); s.textContent = locked[i] ? chars[i] : rnd(); wrap.appendChild(s); spans.push(s); }
        el.textContent = ''; el.appendChild(sr); el.appendChild(wrap);
        this.sr = sr; this.wrap = wrap;
      },
      step: function (now) {
        var t = now - this.t0; if (t < 0) return false;
        var all = true;
        for (var i = 0; i < n; i++) {
          if (locked[i]) continue;
          if (t >= lockAt[i]) { spans[i].textContent = chars[i]; locked[i] = true; }
          else { all = false; if (now - flipAt[i] > 44) { spans[i].textContent = rnd(); flipAt[i] = now; } }
        }
        return all;
      },
      finish: function () {
        if (el.__esJob !== job) return;
        el.textContent = text;
        for (var i = 0; i < spans.length; i++) release(spans[i]);
        if (this.sr) release(this.sr); if (this.wrap) release(this.wrap);
        if (this.lockedW) el.style.minWidth = '';
        el.__esJob = null;
        if (opts.onDone) opts.onDone();
      }
    };
    el.__esJob = job;
    schedule(job);
  }
  function digits(el, opts) {
    opts = opts || {};
    opts.lockLast = function (ch) { return /\d/.test(ch); };
    opts.lockLastStep = opts.lockLastStep || 60;
    scramble(el, opts);
  }

  /* ------------------------------------------------------------ solidify */
  function words(el) {
    if (el.__esWords) return el.__esWords;
    var list = [];
    var nodes = Array.prototype.slice.call(el.childNodes);
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.nodeType === 3) {
        var parts = nd.nodeValue.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        for (var k = 0; k < parts.length; k++) {
          if (!parts[k]) continue;
          if (/^\s+$/.test(parts[k])) { frag.appendChild(document.createTextNode(' ')); continue; }
          var sp = document.createElement('span'); sp.className = 'w'; sp.textContent = parts[k]; frag.appendChild(sp); list.push(sp);
        }
        el.replaceChild(frag, nd);
      } else if (nd.nodeType === 1) {
        if (nd.classList.contains('sr-only')) continue;
        nd.classList.add('w'); list.push(nd);
      }
    }
    el.__esWords = list;
    return list;
  }
  function setWord(sp, e) {
    var wght = 400 + 420 * e, wdth = 86 + 39 * e;
    sp.style.fontVariationSettings = '"wght" ' + wght.toFixed(1) + ', "wdth" ' + wdth.toFixed(1);
    sp.style.opacity = (0.4 + 0.6 * e).toFixed(3);
  }
  function clearWord(sp) { sp.style.fontVariationSettings = ''; sp.style.opacity = ''; }
  function prime(el) { if (!el || reduced()) return; var W = words(el); for (var i = 0; i < W.length; i++) setWord(W[i], 0); }
  function solidifyAt(el, p) {
    if (!el) return;
    var W = words(el);
    if (reduced()) { for (var k = 0; k < W.length; k++) clearWord(W[k]); return; }
    var n = W.length, kf = n > 1 ? Math.min(0.08, 0.5 / n) : 0;
    for (var i = 0; i < n; i++) {
      var u = clamp((p - i * kf) / (1 - (n - 1) * kf), 0, 1);
      if (u >= 1) clearWord(W[i]); else setWord(W[i], easeOut(u));
    }
  }
  function solidify(el, opts) {
    if (!el) return;
    opts = opts || {};
    cancelJob(el);
    var W = words(el);
    if (reduced() || opts.instant) { for (var k = 0; k < W.length; k++) clearWord(W[k]); if (opts.onDone) opts.onDone(); return; }
    var dur = opts.duration || 600, stagger = opts.stagger === undefined ? 40 : opts.stagger, delay = opts.delay || 0;
    var job = {
      el: el, t0: 0,
      start: function (now) { this.t0 = now + delay; for (var i = 0; i < W.length; i++) setWord(W[i], 0); },
      step: function (now) {
        var t = now - this.t0; if (t < 0) return false;
        var all = true;
        for (var i = 0; i < W.length; i++) {
          var u = (t - i * stagger) / dur;
          if (u >= 1) clearWord(W[i]); else { all = false; setWord(W[i], easeOut(u)); }
        }
        return all;
      },
      finish: function () { if (el.__esJob !== job) return; for (var i = 0; i < W.length; i++) clearWord(W[i]); el.__esJob = null; if (opts.onDone) opts.onDone(); }
    };
    el.__esJob = job;
    schedule(job);
  }

  /* -------------------------------------------------------------- strike */
  function lineOf(el) {
    var line = el.querySelector('.strike-line');
    if (!line) { line = document.createElement('i'); line.className = 'strike-line'; line.setAttribute('aria-hidden', 'true'); el.classList.add('strike-word'); el.appendChild(line); }
    return line;
  }
  function strikeAt(el, p) { if (!el) return; var line = lineOf(el); line.style.transform = 'scaleX(' + clamp(p, 0, 1).toFixed(3) + ')'; }
  function strike(el, opts) {
    if (!el) return;
    opts = opts || {};
    var line = lineOf(el);
    if (reduced() || opts.instant || !line.animate) { line.style.transform = 'scaleX(1)'; return; }
    line.style.transform = '';
    line.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: opts.duration || 260, delay: opts.delay || 0, easing: 'cubic-bezier(.52,0,.12,1)', fill: 'forwards' });
  }

  function finishAll() {
    var all = active.concat(queue); active.length = 0; queue.length = 0;
    for (var i = 0; i < all.length; i++) all[i].finish();
  }
  /* the still page, switched on mid-way: every job finishes, every primed headline becomes final (the word spans drop
     their inline variation settings / opacity) and every strike line is fully drawn, regardless of per-section handlers */
  function settleAll() {
    finishAll();
    var sol = document.querySelectorAll('[data-solidify]');
    for (var i = 0; i < sol.length; i++) { var W = sol[i].querySelectorAll('.w'); for (var k = 0; k < W.length; k++) clearWord(W[k]); }
    var lines = document.querySelectorAll('.strike-line');
    for (var j = 0; j < lines.length; j++) {
      var ln = lines[j];
      if (ln.getAnimations) { var an = ln.getAnimations(); for (var a = 0; a < an.length; a++) an[a].cancel(); }
      ln.style.transform = '';
    }
  }

  ES.text = { scramble: scramble, digits: digits, solidify: solidify, solidifyAt: solidifyAt, prime: prime, strike: strike, strikeAt: strikeAt, finishAll: finishAll, settleAll: settleAll, cancel: cancelJob, words: words };
})();
