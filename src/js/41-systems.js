/* ============================================================================
   41-systems.js — "The Construct": the headline solidifies in navy as the
   front turns the page to paper; each dashboard wipes in along the slash with
   its rows line by line (CSS, timed by --i/--r), the key values scramble, then
   the system acts once per entry, time based (~6 s): a lead lands on the
   board, the instant text reply types, the lead moves to Contacted, the
   follow-up timer starts, a waiver flips to Signed, Jarvis drafts a restock.
   Ends in the static, fully legible state (which is also the no-JS / reduced
   state). A panel re-arms once it has been fully off screen for 2 s. Phone:
   each panel runs its own part as it enters. Approve / Hold really work.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES, sec = document.getElementById('systems');
  if (!ES || !sec) return;
  var html = document.documentElement;
  var reduced = html.dataset.motion === 'reduced';
  var hasST = !!(window.gsap && window.ScrollTrigger);
  var text = ES.text;
  var eyebrow = document.getElementById('systems-eyebrow'), title = document.getElementById('systems-title');
  var grid = document.getElementById('panels');
  var panels = Array.prototype.slice.call(sec.querySelectorAll('.panel')).map(function (el) {
    var P = { el: el, name: el.dataset.panel, ran: false, at: 0, t: [], rows: Array.prototype.slice.call(el.querySelectorAll('[data-row]')),
      scr: Array.prototype.slice.call(el.querySelectorAll('[data-scr]')), wipes: Array.prototype.slice.call(el.querySelectorAll('[data-row], [data-beat], [data-lead], [data-sms], .swap__new')) };
    if (P.name === 'leads') {
      P.lead = el.querySelector('[data-lead]'); P.slotN = el.querySelector('[data-slot="new"]'); P.slotC = el.querySelector('[data-slot="contacted"]');
      P.sms = el.querySelector('[data-sms]'); P.smsText = el.querySelector('.sms__text'); P.timer = el.querySelector('[data-timer]');
      P.cNew = el.querySelector('[data-count="new"]'); P.cCon = el.querySelector('[data-count="contacted"]');
      P.steps = Array.prototype.slice.call(el.querySelectorAll('.step'));
    }
    if (P.name === 'party') { P.count = el.querySelector('[data-waivers]'); P.meter = el.querySelector('[data-meter]'); }
    if (P.name === 'jarvis') { P.card = el.querySelector('[data-approval]'); P.status = el.querySelector('[data-status]'); }
    return P;
  });

  /* ------------------------------------------------ approve / hold (all modes) */
  panels.forEach(function (P) {
    if (!P.card) return;
    function decide(msg) {
      P.card.classList.add('is-decided');
      P.status.textContent = msg;
      if (!reduced) text.scramble(P.status, { text: msg, duration: 240, stagger: 10 });
    }
    P.card.querySelector('[data-approve]').addEventListener('click', function () { decide('Approved · flats promotion goes live Friday 9:00'); });
    P.card.querySelector('[data-hold]').addEventListener('click', function () { decide('On hold · Jarvis asks again tomorrow 9:00'); });
  });

  if (reduced || !hasST) { panels.forEach(function (P) { P.el.classList.add('is-in'); }); return; }
  text.prime(title);

  /* ------------------------------------------------------- geometry for CSS */
  function measure() {
    panels.forEach(function (P) {
      P.el.style.setProperty('--ph', P.el.offsetHeight + 'px');
      P.rows.forEach(function (r, i) { r.style.setProperty('--r', i); });
      P.wipes.forEach(function (r) { r.style.setProperty('--rh', Math.max(16, r.offsetHeight) + 'px'); });
      Array.prototype.forEach.call(P.el.querySelectorAll('.bars i'), function (b, k) { b.style.setProperty('--k', k); });
    });
  }

  /* --------------------------------------------------------- pre / final */
  function step(P, name) { P.steps.forEach(function (s) { var k = s.dataset.step, order = ['new', 'reply', 'contacted', 'follow']; s.classList.toggle('is-active', k === name); s.classList.toggle('is-done', name !== null && order.indexOf(k) < order.indexOf(name)); }); }
  function count(el, v) { if (el) { text.cancel(el); el.textContent = v; } }   /* counters change instantly: the beat itself is the event */
  function pre(P) {
    P.el.classList.remove('is-in', 'is-settled', 'is-lead', 'is-sms', 'is-moved', 'is-timer', 'is-signed', 'is-restock');
    if (P.name === 'leads') {
      if (P.lead.parentNode !== P.slotN) P.slotN.appendChild(P.lead);
      P.slotN.classList.add('has-lead'); P.slotC.classList.remove('has-lead');
      P.lead.style.transform = '';
      P.smsText.textContent = ''; P.sms.classList.remove('is-typing');
      P.timer.textContent = '24:00:00';
      P.cNew.textContent = '0'; P.cCon.textContent = '1';
      step(P, null);
    }
    if (P.name === 'party') { P.count.textContent = '14'; P.meter.style.setProperty('--p', '.778'); }
    if (P.name === 'jarvis') { P.card.classList.remove('is-decided'); P.status.textContent = ''; }
  }
  function final(P) {
    P.el.classList.add('is-in', 'is-settled', 'is-lead', 'is-sms', 'is-moved', 'is-timer', 'is-signed', 'is-restock');
    if (P.name === 'leads') {
      if (P.lead.parentNode !== P.slotC) P.slotC.insertBefore(P.lead, P.slotC.firstChild);
      P.slotC.classList.add('has-lead'); P.slotN.classList.remove('has-lead');
      P.lead.style.transform = '';
      P.smsText.textContent = P.smsText.dataset.type; P.sms.classList.remove('is-typing');
      P.timer.textContent = 'Due tomorrow 2:14 pm';
      P.cNew.textContent = '0'; P.cCon.textContent = '2';
      step(P, 'follow');
    }
    if (P.name === 'party') { P.count.textContent = '15'; P.meter.style.setProperty('--p', '.833'); }
  }
  function still(P, fn) { P.el.classList.add('no-trans'); fn(); void P.el.offsetWidth; P.el.classList.remove('no-trans'); }

  /* ------------------------------------------------------------- the beats */
  function later(P, ms, fn) { P.t.push(setTimeout(fn, ms)); }
  function typeInto(P, done) {
    var full = P.smsText.dataset.type, i = 0;
    P.smsText.textContent = ''; P.sms.classList.add('is-typing');
    (function tick() {
      i++; P.smsText.textContent = full.slice(0, i);
      if (i < full.length) later(P, 22, tick); else { P.sms.classList.remove('is-typing'); if (done) done(); }
    })();
  }
  function moveLead(P) {
    var lead = P.lead, from = lead.getBoundingClientRect();
    P.slotC.insertBefore(lead, P.slotC.firstChild);
    P.slotN.classList.remove('has-lead'); P.slotC.classList.add('has-lead');
    var to = lead.getBoundingClientRect();
    lead.style.transition = 'none';
    lead.style.transform = 'translate3d(' + (from.left - to.left).toFixed(1) + 'px,' + (from.top - to.top).toFixed(1) + 'px,0)';
    void lead.offsetWidth;
    lead.style.transition = ''; lead.style.transform = '';
    P.el.classList.add('is-moved');
  }
  function beats(P, rowMode) {
    if (P.name === 'leads') return [
      [1000, function () { P.el.classList.add('is-lead'); count(P.cNew, '1'); step(P, 'new'); }],
      [1700, function () { P.el.classList.add('is-sms'); step(P, 'reply'); later(P, 260, function () { typeInto(P); }); }],
      [3600, function () { moveLead(P); step(P, 'contacted'); count(P.cNew, '0'); count(P.cCon, '2'); }],
      [4400, function () { P.el.classList.add('is-timer'); step(P, 'follow'); P.timer.textContent = '24:00:00'; }],
      [5400, function () { P.timer.textContent = '23:59:59'; }],
      [6400, function () { P.timer.textContent = '23:59:58'; }],
      [6900, function () { P.timer.textContent = 'Due tomorrow 2:14 pm'; text.scramble(P.timer, { duration: 240, stagger: 8 }); }]
    ];
    if (P.name === 'party') return [[rowMode ? 5000 : 1400, function () { P.el.classList.add('is-signed'); count(P.count, '15'); P.meter.style.setProperty('--p', '.833'); }]];
    return [[rowMode ? 5700 : 1500, function () { P.el.classList.add('is-restock'); }]];
  }
  function sameRow(P) { var top = P.el.offsetTop; return panels.filter(function (Q) { return Q !== P && Math.abs(Q.el.offsetTop - top) < 4; }); }
  function run(P) {
    if (P.ran) return;
    P.ran = true; P.at = performance.now();
    var rowMode = sameRow(P).some(function (Q) { return Q.name === 'leads'; });
    P.el.classList.add('is-in');
    // the key values scramble in line by line (scheduled here, so the text engine's 3 slots stay free for the beats)
    P.scr.forEach(function (el, i) { later(P, 320 + i * 120, function () { text.scramble(el, { duration: 240, stagger: 10 }); }); });
    later(P, 1700, function () { P.el.classList.add('is-settled'); });
    beats(P, rowMode).forEach(function (b) { later(P, b[0], b[1]); });
  }
  function rearm(P) {
    if (!P.ran || performance.now() - P.at < 2000) return;
    var r = P.el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) return;
    P.ran = false;
    P.t.forEach(clearTimeout); P.t.length = 0;
    P.scr.forEach(function (el) { text.cancel(el); });
    if (P.timer) text.cancel(P.timer);
    still(P, function () { pre(P); });
  }

  /* --------------------------------------------------------------- head */
  var headDone = false, eyebrowDone = false, headAt = 0;
  function eyebrowIn() { if (eyebrowDone) return; eyebrowDone = true; text.scramble(eyebrow, { duration: 260 }); }
  function headIn() { if (headDone) return; headDone = true; headAt = performance.now(); eyebrowIn(); text.solidify(title, { delay: 80 }); }
  function headRearm() { if (!headDone || performance.now() - headAt < 2000) return; headDone = eyebrowDone = false; text.prime(title); }
  function appsWin() { var W = ES.scroll.windows || []; for (var i = 0; i < W.length; i++) if (W[i].A && W[i].A.id === 'apps') return W[i]; return null; }
  ES.scroll.onBoundary('apps', function (p, f) { if (f > 0.02 && !headDone) eyebrowIn(); if (f >= 0.2) headIn(); });
  ES.scroll.onSection(sec, {
    enter: function () { var w = appsWin(); if (w && w.p > 0 && w.p < 1) return; headIn(); },
    progress: function (p) { if (p <= 0.001 || p >= 0.999) headRearm(); }
  });

  /* ------------------------------------------------------------- panels */
  panels.forEach(function (P) { still(P, function () { pre(P); }); });
  measure();
  panels.forEach(function (P) {
    ScrollTrigger.create({
      trigger: P.el, start: 'top 82%', end: 'bottom 18%', invalidateOnRefresh: true,
      onEnter: function () { run(P); }, onEnterBack: function () { run(P); },
      onRefresh: function (self) { if (self.isActive && !P.ran) run(P); }
    });
    ScrollTrigger.create({
      trigger: P.el, start: 'top bottom', end: 'bottom top', invalidateOnRefresh: true,
      onLeave: function () { rearm(P); }, onLeaveBack: function () { rearm(P); }
    });
  });
  var rT = 0;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(measure, 160); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(measure, 40); });

  ES.motion.on(function (r) {
    if (!r) return;
    headDone = true; text.solidify(title, { instant: true });
    panels.forEach(function (P) { P.t.forEach(clearTimeout); P.t.length = 0; P.ran = true; still(P, function () { final(P); }); });
  });
})();
