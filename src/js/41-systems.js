/* ============================================================================
   41-systems.js — "The white room": the three dashboards fade up in sequence
   (CSS, [data-rise] 200 ms apart), their rows fade in 60 ms apart (CSS, --r),
   then the system acts once per entry, time based (~7 s): a lead lands on
   the board, the instant text reply types, the lead moves to Contacted, the
   follow-up timer starts, a waiver flips to Signed, Jarvis drafts a restock.
   Ends in the static, fully legible state (also the no-JS / reduced state).
   A panel re-arms once it has been fully off screen for 2 s. Phone: each
   panel runs its own part as it enters. Approve / Hold really work.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES, sec = document.getElementById('systems');
  if (!ES || !sec) return;
  var html = document.documentElement;
  var reduced = html.dataset.motion === 'reduced';
  var panels = Array.prototype.slice.call(sec.querySelectorAll('.panel')).map(function (el) {
    var P = { el: el, name: el.dataset.panel, ran: false, at: 0, t: [], rows: Array.prototype.slice.call(el.querySelectorAll('[data-row]')) };
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
    function decide(msg) { P.card.classList.add('is-decided'); P.status.textContent = msg; }
    P.card.querySelector('[data-approve]').addEventListener('click', function () { decide('Approved · flats promotion goes live Friday 9:00'); });
    P.card.querySelector('[data-hold]').addEventListener('click', function () { decide('On hold · Jarvis asks again tomorrow 9:00'); });
  });

  if (reduced || !('IntersectionObserver' in window)) { panels.forEach(function (P) { P.el.classList.add('is-run'); }); return; }
  panels.forEach(function (P) { P.rows.forEach(function (r, i) { r.style.setProperty('--r', i); }); });

  /* --------------------------------------------------------- pre / final */
  function step(P, name) { P.steps.forEach(function (s) { var k = s.dataset.step, order = ['new', 'reply', 'contacted', 'follow']; s.classList.toggle('is-active', k === name); s.classList.toggle('is-done', name !== null && order.indexOf(k) < order.indexOf(name)); }); }
  function pre(P) {
    P.el.classList.remove('is-run', 'is-lead', 'is-sms', 'is-moved', 'is-timer', 'is-signed', 'is-restock');
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
    P.el.classList.add('is-run', 'is-lead', 'is-sms', 'is-moved', 'is-timer', 'is-signed', 'is-restock');
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
      if (i < full.length) later(P, 26, tick); else { P.sms.classList.remove('is-typing'); if (done) done(); }
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
      [1400, function () { P.el.classList.add('is-lead'); P.cNew.textContent = '1'; step(P, 'new'); }],
      [2400, function () { P.el.classList.add('is-sms'); step(P, 'reply'); later(P, 300, function () { typeInto(P); }); }],
      [4600, function () { moveLead(P); step(P, 'contacted'); P.cNew.textContent = '0'; P.cCon.textContent = '2'; }],
      [5600, function () { P.el.classList.add('is-timer'); step(P, 'follow'); P.timer.textContent = '24:00:00'; }],
      [6600, function () { P.timer.textContent = '23:59:59'; }],
      [7600, function () { P.timer.textContent = '23:59:58'; }],
      [8200, function () { P.timer.textContent = 'Due tomorrow 2:14 pm'; }]
    ];
    if (P.name === 'party') return [[rowMode ? 6200 : 2000, function () { P.el.classList.add('is-signed'); P.count.textContent = '15'; P.meter.style.setProperty('--p', '.833'); }]];
    return [[rowMode ? 7000 : 2200, function () { P.el.classList.add('is-restock'); }]];
  }
  function sameRow(P) { var top = P.el.offsetTop; return panels.filter(function (Q) { return Q !== P && Math.abs(Q.el.offsetTop - top) < 4; }); }
  function run(P) {
    if (P.ran) return;
    P.ran = true; P.at = performance.now();
    var rowMode = sameRow(P).some(function (Q) { return Q.name === 'leads'; });
    P.el.classList.add('is-run');
    beats(P, rowMode).forEach(function (b) { later(P, b[0], b[1]); });
  }
  function rearm(P) {
    if (!P.ran || performance.now() - P.at < 2000) return;
    var r = P.el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) return;
    P.ran = false;
    P.t.forEach(clearTimeout); P.t.length = 0;
    still(P, function () { pre(P); });
  }

  /* ------------------------------------------------------------- panels */
  panels.forEach(function (P) { still(P, function () { pre(P); }); });
  panels.forEach(function (P) {
    /* keyboard focus into a panel that has not run yet: run it at once (the rows must be visible under the focus) */
    P.el.addEventListener('focusin', function () { if (!P.ran) { P.el.classList.add('is-quick'); run(P); } });
    new IntersectionObserver(function (en) { if (en[0].isIntersecting) run(P); }, { threshold: 0.3 }).observe(P.el);
    new IntersectionObserver(function (en) { if (!en[0].isIntersecting) rearm(P); }, { threshold: 0 }).observe(P.el);
  });

  ES.motion.on(function (r) {
    if (!r) return;
    panels.forEach(function (P) { P.t.forEach(clearTimeout); P.t.length = 0; P.ran = true; still(P, function () { final(P); }); });
  });
})();
