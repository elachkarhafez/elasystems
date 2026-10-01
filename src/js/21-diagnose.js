/* ============================================================================
   21-diagnose.js — "What do you run?": nine mono chips, six touchpoints that
   print (scramble, 280 ms apart), the slash strike on the ones that usually
   leak with what we build in gold beneath, the matching client, and the CTA
   rewritten with a prefilled sms body. Content = the static JSON below; the
   no-JS list in src/partials/diagnose.html is generated from it
   (scratchpad/gen-diagnose.mjs), so the two never drift.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES, sec = document.getElementById('diagnose');
  if (!ES || !sec) return;
  var html = document.documentElement;
  var reduced = html.dataset.motion === 'reduced';
  var hasST = !!(window.gsap && window.ScrollTrigger);

  /* @dx-data */
  var DATA = {
    "phone": "+13133006898",
    "touchpoints": ["search", "first click", "the site", "order / booking", "follow-up text", "return visit"],
    "kinds": [
      { "id": "bakery", "chip": "Bakery", "noun": "a bakery", "client": "Family Bakery", "place": "W Warren Ave", "slug": "family-bakery",
        "leaks": [[2, "menu, online ordering, catering requests, English and Arabic"], [4, "instant text reply"]] },
      { "id": "barber", "chip": "Barber", "noun": "a barbershop", "client": "Creative Style", "place": "Ford Rd", "slug": "creative-style",
        "leaks": [[3, "online booking by barber and chair, confirmed by text"], [4, "a reminder text before the cut, a rebook link after"]] },
      { "id": "cafe", "chip": "Cafe", "noun": "a cafe", "client": "The Snug Mug", "place": "Middlebelt Rd", "slug": "snug-mug",
        "leaks": [[1, "hours, menu and directions on the first tap"], [3, "order ahead for pickup, built into the site"], [5, "a loyalty card that lives in their phone"]] },
      { "id": "matcha", "chip": "Matcha pop-up", "noun": "a matcha pop-up", "client": "Big Wiss Matcha", "place": "Dearborn", "slug": "big-wiss-matcha",
        "leaks": [[0, "a page for this week's spot, with hours and a map"], [2, "the menu and the drops, with where the cart is today"], [5, "a text when the next drop goes live"]] },
      { "id": "fun", "chip": "Fun center", "noun": "a fun center", "client": "Bounce It Up", "place": "Plymouth Rd", "slug": "bounce-it-up",
        "leaks": [[2, "hours, passes and parties, built for a parent on a phone"], [3, "party booking with online waivers"], [4, "booking confirmed by text, waiver link included"]] },
      { "id": "shoes", "chip": "Shoe boutique", "noun": "a shoe boutique", "client": "D'Moda Shoes", "place": "Monroe St", "slug": "dmoda-shoes",
        "leaks": [[2, "an online store with sizes in stock, synced with the shelf"], [3, "checkout that works on a phone, pickup or shipping"], [5, "a text when a size is back or the next drop lands"]] },
      { "id": "streetwear", "chip": "Streetwear", "noun": "a streetwear brand", "client": "313 Apparel", "place": "Online", "slug": "313-apparel",
        "leaks": [[2, "a storefront built around drops, with a waitlist"], [4, "drop alerts by text, with the link to buy"], [5, "a members list that hears about the next drop first"]] },
      { "id": "urgent", "chip": "Urgent care", "noun": "an urgent care", "client": "Monarch Urgent Care", "place": "Allen Park", "slug": "monarch-urgent-care",
        "leaks": [[0, "a clinic page with hours, services and insurance, built for a phone"], [1, "one tap to call, one tap to directions"], [3, "online check-in before leaving the house"]] },
      { "id": "fish", "chip": "Fish market", "noun": "a fish market", "client": "Express Poultry & Fish", "place": "Fish market", "slug": "express-poultry-fish",
        "leaks": [[2, "the counter online: today's fish, zabiha halal chicken, hours"], [3, "call-ahead orders taken on the site, ready at the counter"], [4, "instant text reply when someone asks what's fresh"]] }
    ]
  };
  /* @/dx-data */

  var TP = DATA.touchpoints, KINDS = DATA.kinds, PHONE = DATA.phone;
  var STEP = 280, text = ES.text;
  var chips = Array.prototype.slice.call(sec.querySelectorAll('.chip'));
  var live = document.getElementById('dx-live');
  var print = document.getElementById('dx-print');
  var seeLink = document.getElementById('dx-see'), seeText = seeLink && seeLink.querySelector('[data-scramble]');
  var tag = document.getElementById('dx-tag'), msg = document.getElementById('dx-msg'), cta = document.getElementById('diagnose-cta');
  var status = document.getElementById('dx-status');
  if (!live || !print || !cta) return;

  function body(k) { return 'Hi, I run ' + k.noun + ' in Detroit. I want to talk about a system.'; }
  function smsHref(bodyText) {
    var ua = navigator.userAgent || '';
    var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var android = /Android/i.test(ua);
    var b = encodeURIComponent(bodyText);
    return ios ? 'sms:' + PHONE + '&body=' + b : android ? 'sms:' + PHONE + '?body=' + b : 'sms:' + PHONE;
  }
  function kindOf(id) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].id === id) return KINDS[i]; return KINDS[0]; }
  function leakOf(k, i) { for (var j = 0; j < k.leaks.length; j++) if (k.leaks[j][0] === i) return k.leaks[j][1]; return null; }

  /* ---------------------------------------------------------- build rows */
  var rows = [];
  (function build() {
    print.textContent = '';
    for (var i = 0; i < TP.length; i++) {
      var li = document.createElement('li'); li.className = 'tp';
      var node = document.createElement('i'); node.className = 'tp__node'; node.setAttribute('aria-hidden', 'true');
      var name = document.createElement('span'); name.className = 'tp__name'; name.textContent = TP[i];
      var sr = document.createElement('span'); sr.className = 'sr-only tp__sr';
      var fix = document.createElement('span'); fix.className = 'tp__fix';
      li.appendChild(node); li.appendChild(name); li.appendChild(sr); li.appendChild(fix);
      print.appendChild(li);
      rows.push({ li: li, name: name, sr: sr, fix: fix });
    }
  })();

  /* ------------------------------------------------------------- state */
  var cur = null, timers = [], played = false, playedAt = 0, printing = false, firstRead = true;
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers.length = 0; }
  function cancelJobs() {
    for (var i = 0; i < rows.length; i++) {
      text.cancel(rows[i].name); text.cancel(rows[i].fix);
      var line = rows[i].name.querySelector('.strike-line');
      if (line && line.getAnimations) line.getAnimations().forEach(function (a) { a.cancel(); });
    }
    if (seeText) text.cancel(seeText); if (tag) text.cancel(tag); if (msg) text.cancel(msg); text.cancel(cta);
  }
  function strikeLine(row) {
    var line = row.name.querySelector('.strike-line');
    if (!line) { line = document.createElement('i'); line.className = 'strike-line'; line.setAttribute('aria-hidden', 'true'); row.name.appendChild(line); }
    row.name.classList.add('strike-word');
    return line;
  }

  /* fill the rows + readout with a kind; hidden = rows wait for the print */
  function fill(k, hidden) {
    var leaks = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], fixText = leakOf(k, i);
      r.name.textContent = TP[i]; r.name.dataset.text = TP[i];
      r.li.classList.toggle('is-leak', !!fixText);
      r.li.classList.remove('is-fixed');
      r.fix.textContent = fixText || ''; r.fix.dataset.text = fixText || '';
      r.sr.textContent = fixText ? ' usually leaks. What we build: ' : '';
      r.name.classList.remove('strike-word');
      var old = r.name.querySelector('.strike-line'); if (old) old.remove();
      if (fixText) { leaks.push(TP[i]); var line = strikeLine(r); line.style.transform = hidden ? 'scaleX(0)' : 'scaleX(1)'; if (!hidden) r.li.classList.add('is-fixed'); }
      r.li.classList.toggle('is-wait', !!hidden);
      r.li.classList.toggle('is-fixwait', !!hidden);
    }
    // the readout: links and hrefs switch at once; the visible texts wait for the print when hidden
    if (seeLink) { seeLink.href = '#work-' + k.slug; seeLink.dataset.slug = k.slug; }
    var b = body(k);
    cta.href = smsHref(b); cta.dataset.body = b;
    if (!hidden) readout(k, false);
    if (status) status.textContent = k.chip + '. Usually leaks at: ' + leaks.join(', ') + '.';
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.kind === k.id ? 'true' : 'false'); });
    live.dataset.kind = k.id;
  }

  function readout(k, animate) {
    var see = 'See: ' + k.client, t = 'Matching work · ' + k.place, b = body(k);
    if (!animate) {
      if (seeText) { seeText.textContent = see; seeText.dataset.text = see; }
      if (tag) { tag.textContent = t; tag.dataset.text = t; }
      if (msg) { msg.textContent = b; msg.dataset.text = b; }
      return;
    }
    if (tag) text.scramble(tag, { text: t, duration: 260, stagger: 12 });
    if (seeText) text.scramble(seeText, { text: see, duration: 300, stagger: 18, delay: 120 });
    if (msg) text.scramble(msg, { text: b, duration: 300, stagger: 8, delay: 220 });
  }

  /* the print: six lines 280 ms apart, strike + fix on the leaks; the readout sweeps in
     (slash edge) with its texts scrambling once the last row has locked. `gen` guards the
     chain: the text engine fires onDone on cancel too, so a superseded print must not finish. */
  var gen = 0;
  function play(k) {
    clearTimers(); cancelJobs();
    var g = ++gen;
    if (reduced || html.dataset.motion === 'reduced') { fill(k, false); sec.classList.add('is-read'); return; }
    fill(k, true);
    printing = true;
    sec.classList.remove('is-read');
    var pending = rows.length;
    function done() {
      if (g !== gen || --pending > 0) return;
      printing = false;
      sec.classList.add('is-read');
      readout(k, true);
      if (firstRead) { firstRead = false; text.digits(cta, { delay: 300 }); }
    }
    rows.forEach(function (r, i) {
      later(function () {
        r.li.classList.remove('is-wait');
        text.scramble(r.name, { duration: 300, stagger: 18, onDone: function () {
          if (g !== gen) return;
          if (!r.li.classList.contains('is-leak')) { done(); return; }
          text.strike(r.name, { duration: 260 });
          later(function () {
            r.li.classList.remove('is-fixwait');
            text.scramble(r.fix, { duration: 300, stagger: 10, onDone: function () { if (g !== gen) return; r.li.classList.add('is-fixed'); done(); } });
          }, 200);
        } });
      }, i * STEP);
    });
  }

  /* ------------------------------------------------------------- chips */
  function select(id, animate) {
    var k = kindOf(id);
    cur = k;
    if (animate && played) play(k); else { clearTimers(); cancelJobs(); gen++; printing = false; fill(k, false); if (played) sec.classList.add('is-read'); }
  }
  chips.forEach(function (c, i) {
    c.addEventListener('click', function () { if (cur && cur.id === c.dataset.kind && !printing) return; select(c.dataset.kind, true); });
    c.addEventListener('keydown', function (e) {
      var n = chips.length, j = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = n - 1;
      if (j < 0) return;
      e.preventDefault(); chips[j].focus();
    });
  });

  /* "See: client" jumps to its Work frame; tiles without an id are found by slug */
  if (seeLink) seeLink.addEventListener('click', function (e) {
    var slug = seeLink.dataset.slug, id = 'work-' + slug;
    var el = document.getElementById(id) || document.querySelector('#work [data-slug="' + slug + '"]');
    if (!el) return;
    e.preventDefault(); e.stopPropagation();
    ES.scroll.scrollTo(el);
    if (history.replaceState) history.replaceState(null, '', '#' + (el.id || 'work'));
  }, true);

  /* ------------------------------------------------------------- boot */
  var initial = (live.dataset.kind && kindOf(live.dataset.kind)) || KINDS[0];
  cur = initial;
  if (reduced || !hasST) { played = true; fill(initial, false); sec.classList.add('is-read'); }
  else fill(initial, true);

  function enter() {
    if (played) return;
    played = true; playedAt = performance.now();
    play(cur);
  }
  if (hasST && !reduced) {
    ES.scroll.onSection(sec, {
      enter: enter,
      progress: function (p) {
        // fully out of view for 2 s+ after a play: re-arm, so the print runs again on the next entry
        if (played && !printing && (p <= 0.001 || p >= 0.999) && performance.now() - playedAt > 2000) { played = false; fill(cur, true); sec.classList.remove('is-read'); }
      }
    });
  }
  ES.motion.on(function (r) { if (r) { reduced = true; clearTimers(); cancelJobs(); gen++; printing = false; played = true; fill(cur, false); sec.classList.add('is-read'); } });
})();
