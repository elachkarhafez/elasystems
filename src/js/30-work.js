/* ============================================================================
   30-work.js — #work "The storefront decode"
   Three ES.rain.frame decodes (tint bleed 10 vh early, stage over the first
   60 % of each sticky span, the real image arriving by a slash cut with the
   glyph-mosaic band, the tall capture scrubbing over the remaining 40 %, all
   a function of scroll and therefore reversible), two-slot texture residency
   with idle uploads ahead of need, the stage's text arrivals, and the grid of
   slanted tiles (clip-path slash reveal + 300 ms mosaic band, Express
   Poultry's f0/f1/f2 steps). Reduced motion / no WebGL: CSS owns the poster.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES = window.ES || {};
  var html = document.documentElement;
  var section = document.getElementById('work');
  if (!section || !ES.util) return;
  var U = ES.util, clamp = U.clamp, RUN = ES.SLASH_RUN || 0.535;
  var reduced = html.dataset.motion === 'reduced';
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var phoneMQ = window.matchMedia('(max-width: 767px)');
  var H = window.innerHeight;
  var ric = window.requestIdleCallback || function (cb) { return setTimeout(function () { cb({ timeRemaining: function () { return 8; } }); }, 40); };
  function isPhone() { return phoneMQ.matches; }
  function bandWidth() { return isPhone() ? 28 : 36; }
  function rnd(n) { return Math.floor(Math.random() * n); }

  /* ------------------------------------------------- the glyph sheet ----
     One shared canvas of random atlas glyphs (gold-light on transparent),
     published as --glyph-sheet; every band is a clip over this background and
     "re-hashes" by jumping its background-position by whole cells.          */
  var SHEET_W = 1020, SHEET_H = 300, CELL = 20, sheetBuilt = false;
  function buildSheet() {
    if (sheetBuilt || !ES.atlas || !ES.atlasMeta) return;
    var atlas = ES.atlas, cs = ES.atlasMeta.cell || 64, cols = ES.atlasMeta.cols || 16;
    var rows = 3; // glyphs 0..47 live in the first three atlas rows
    var tinted = document.createElement('canvas');
    tinted.width = atlas.width; tinted.height = cs * rows;
    var tc = tinted.getContext('2d', { willReadFrequently: true });
    if (!tc) return;
    tc.drawImage(atlas, 0, 0, atlas.width, cs * rows, 0, 0, atlas.width, cs * rows);
    var id;
    try { id = tc.getImageData(0, 0, tinted.width, tinted.height); } catch (e) { return; }
    var px = id.data; // white on black -> gold-light with alpha = luminance
    for (var i = 0; i < px.length; i += 4) { var a = px[i]; px[i] = 244; px[i + 1] = 205; px[i + 2] = 114; px[i + 3] = a; }
    tc.putImageData(id, 0, 0);
    var sheet = document.createElement('canvas');
    sheet.width = SHEET_W; sheet.height = SHEET_H;
    var sc = sheet.getContext('2d');
    var nx = SHEET_W / CELL, ny = SHEET_H / CELL, count = Math.min(46, ES.atlasMeta.blank || 46);
    for (var y = 0; y < ny; y++) {
      for (var x = 0; x < nx; x++) {
        var r = Math.random();
        if (r < 0.22) continue;                       // empty cell
        var g = rnd(count);
        sc.globalAlpha = r < 0.5 ? 0.45 : (r < 0.8 ? 0.75 : 1);
        sc.drawImage(tinted, (g % cols) * cs, Math.floor(g / cols) * cs, cs, cs, x * CELL, y * CELL, CELL, CELL);
      }
    }
    sc.globalAlpha = 1;
    var url;
    try { url = sheet.toDataURL('image/png'); } catch (e) { return; }
    html.style.setProperty('--glyph-sheet', 'url("' + url + '")');
    sheetBuilt = true;
  }
  function hashBand(band) { var c = isPhone() ? 20 : 24; band.style.backgroundPosition = (-rnd(51) * c) + 'px ' + (-rnd(15) * c) + 'px'; }
  if (ES.rain && ES.rain.on) ES.rain.on('ready', buildSheet);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(buildSheet, 60); });
  setTimeout(buildSheet, 3500);

  /* ----------------------------------------------------------- elements */
  var stage = {
    eyebrow: document.getElementById('work-eyebrow'), title: document.getElementById('work-title'),
    ghostLabel: document.getElementById('work-ghost-label'), nodes: Array.prototype.slice.call(section.querySelectorAll('#work-nodes a')),
    cue: document.getElementById('work-cue'), moreLabel: document.getElementById('work-more-label'), done: false
  };
  var decodes = Array.prototype.slice.call(section.querySelectorAll('[data-decode]')).map(function (art, i) {
    return {
      el: art, slot: i % 2, frame: art.querySelector('[data-frame]'), img: art.querySelector('.decode__shot img'),
      band: art.querySelector('.decode__band'), tag: art.querySelector('.decode__tag'), name: art.querySelector('.decode__name'),
      tint: art.dataset.tint || '#E3A02A', srcD: art.dataset.shotD, srcM: art.dataset.shotM,
      small: null, smallKind: '', loading: false, tex: null, texKey: '', owner: false, active: false, nearby: false,
      span: 1, y: 0, P: 0, stage: 0, bleed: 0, sweep: -1, tall: -1, on: -1, hashT: 0, textDone: false, triggers: [],
      rect: { x: 0, y: 0, w: 1, h: 1 }, imgH: 0, lastClip: '', lastBand: '', mosaic: null, mctx: null, mk: -1, mop: -1
    };
  });
  var tiles = Array.prototype.slice.call(section.querySelectorAll('[data-tile]')).map(function (li) {
    return {
      el: li, frame: li.querySelector('.tile__frame'), reveal: li.querySelector('.tile__reveal'), band: li.querySelector('.tile__band'),
      name: li.querySelector('.tile__name'), steps: Array.prototype.slice.call(li.querySelectorAll('.tile__step')),
      imgs: Array.prototype.slice.call(li.querySelectorAll('img')),
      shown: false, pending: false, hashI: 0, endT: 0, hoverT: -1e9, step: 0
    };
  });
  var slots = [null, null];
  var rain = ES.rain;
  var webglOK = function () { return html.dataset.webgl === 'ok'; };

  /* ---------------------------------------------------------- reduced */
  if (reduced) return; // CSS draws the poster: frames decoded, static bands, text final

  // headlines start soft so they never flash final then soft
  ES.text.prime(stage.title);
  decodes.forEach(function (d) {
    ES.text.prime(d.name);
    // the DOM mosaic: a tiny pixelated canvas of the same small capture, under the slash-cut image
    var cv = document.createElement('canvas');
    cv.className = 'decode__mosaic'; cv.setAttribute('aria-hidden', 'true'); cv.width = 2; cv.height = 2;
    d.frame.insertBefore(cv, d.frame.firstChild);
    d.mosaic = cv; d.mctx = cv.getContext('2d');
  });

  /* --------------------------------------------- stage text arrivals */
  function stageArrive() {
    if (stage.done) return; stage.done = true;
    ES.text.scramble(stage.eyebrow, { duration: 260 });
    ES.text.solidify(stage.title, { delay: 60 });
    if (stage.ghostLabel) ES.text.scramble(stage.ghostLabel, { delay: 180 });
    stage.nodes.forEach(function (a, i) { ES.text.scramble(a, { delay: 300 + i * 120 }); });
    if (stage.cue) stage.cue.classList.add('is-on');
  }
  function stageLeave() {
    if (!stage.done) return; stage.done = false;
    ES.text.prime(stage.title);
    if (stage.cue) stage.cue.classList.remove('is-on');
  }

  /* ------------------------------------------------- texture residency */
  function loadSmall(d, cb) {
    var kind = isPhone() ? 'm' : 'd';
    if (d.small && d.smallKind === kind) { cb(); return; }
    if (d.loading === kind) { d.onLoaded = cb; return; }
    d.loading = kind;
    var im = new Image();
    im.decoding = 'async';
    im.onload = function () {
      if (d.loading !== kind) return;
      d.small = im; d.smallKind = kind; d.loading = false; d.tex = null; d.texKey = '';
      cb(); if (d.onLoaded) { var f = d.onLoaded; d.onLoaded = null; f(); }
    };
    im.onerror = function () { d.loading = false; };
    im.src = kind === 'm' ? d.srcM : d.srcD;
  }
  // the GPU texture must have the frame's aspect (the shader stretches it to the rect): crop the small capture from the top
  function makeTex(d) {
    var im = d.small; if (!im) return null;
    var fr = d.frame.getBoundingClientRect();
    if (fr.width < 2 || fr.height < 2) return null;
    var want = fr.width / fr.height, have = im.naturalWidth / im.naturalHeight;
    var key = want.toFixed(3) + ':' + d.smallKind;
    if (d.tex && d.texKey === key) return d.tex;
    if (Math.abs(want - have) / have < 0.015) { d.tex = im; d.texKey = key; return im; }
    var cw = im.naturalWidth, ch = Math.max(2, Math.min(im.naturalHeight, Math.round(cw / want)));
    var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    cv.getContext('2d').drawImage(im, 0, 0, cw, ch, 0, 0, cw, ch);
    d.tex = cv; d.texKey = key;
    return cv;
  }
  function upload(d) {
    if (!d.owner) return;
    ric(function () {
      if (!d.owner) return;
      var t = makeTex(d); if (!t) return;
      if (webglOK()) rain.frame(d.slot, { image: t, tint: d.tint, on: false });
      d.on = -1; d.mk = -1; // force a push + a mosaic redraw
      if (d.active) push(d);
      mosaic(d);
    });
  }
  function claim(d) {
    d.nearby = true;
    var prev = slots[d.slot];
    if (prev && prev !== d) { prev.owner = false; prev.on = -1; rain.frame(d.slot, { on: false }); }
    slots[d.slot] = d; d.owner = true;
    if (d.img) { if (d.img.loading === 'lazy') d.img.loading = 'eager'; if (d.img.decode) d.img.decode().then(null, function () { /* not fatal */ }); }
    loadSmall(d, function () { upload(d); });
  }
  function release(d) {
    d.nearby = false;
    if (d.owner) { d.owner = false; rain.frame(d.slot, { on: false }); d.on = 0; }
    if (slots[d.slot] === d) slots[d.slot] = null;
  }

  /* ------------------------------------------------------ the decode */
  function measure(d) {
    H = window.innerHeight;
    d.span = Math.max(1, d.el.offsetHeight - (d.el.querySelector('.decode__screen').offsetHeight || H));
  }
  function tallHeight(d, w) {
    var im = d.img, ratio = 0;
    if (im && im.complete && im.naturalWidth > 0) ratio = im.naturalHeight / im.naturalWidth;
    if (!ratio) ratio = isPhone() ? 4800 / 720 : 2500 / 1200;
    return w * ratio;
  }
  function measureRect(d) {
    var r = d.frame.getBoundingClientRect();
    d.rect.x = r.left; d.rect.y = r.top; d.rect.w = r.width; d.rect.h = r.height;
  }
  var glRect = { x: 0, y: 0, w: 1, h: 1 };
  function push(d) {
    measureRect(d);
    var on = d.owner && d.active && !!d.tex && d.rect.w > 1;
    // the engine clips the decode to the pixels inside this rect (cells within half a cell of the edge still count), so the
    // rect is the DOM frame itself; sweep = the decode resolves along the slash edge the DOM image then arrives on
    glRect.x = d.rect.x; glRect.y = d.rect.y; glRect.w = Math.max(1, d.rect.w); glRect.h = Math.max(1, d.rect.h);
    rain.frame(d.slot, { rect: glRect, stage: d.stage, bleed: d.bleed, sweep: 0.5, on: on });
    d.on = on ? 1 : 0;
  }
  // the DOM mosaic is the no-WebGL decode only (with the engine up, the shader does rain -> mosaic -> unquantise itself):
  // the front layer's cell (26 px desktop / 20 px phone), then six finer steps over stage 0.6 -> 0.9
  var MOSAIC_STEPS = [1, 0.69, 0.46, 0.31, 0.19, 0.115];
  function mosaic(d) {
    var cv = d.mosaic; if (!cv) return;
    var st = d.stage, gl = webglOK();
    var op = gl ? 0 : clamp(st / 0.12, 0, 1);
    var k = st < 0.6 ? 0 : Math.min(5, Math.floor((st - 0.6) / 0.3 * 6));
    if (op <= 0) { if (d.mop !== 0) { cv.style.opacity = '0'; d.mop = 0; } return; }
    var tex = d.tex || (d.small ? makeTex(d) : null);
    if (tex && (k !== d.mk || cv.width < 3)) {
      var base = (isPhone() ? 20 : 26) * MOSAIC_STEPS[k];
      var cols = Math.max(2, Math.round(d.rect.w / base)), rows = Math.max(2, Math.round(d.rect.h / base));
      if (cv.width !== cols || cv.height !== rows) { cv.width = cols; cv.height = rows; }
      try { d.mctx.drawImage(tex, 0, 0, cols, rows); d.mk = k; } catch (e) { /* not decoded yet */ }
    }
    if (op !== d.mop) { cv.style.opacity = op.toFixed(3); d.mop = op; }
  }
  function applyDecode(d, P) {
    d.P = P;
    var S = d.span, D = S + 2 * H, y = P * D;
    d.y = y;
    var q = clamp((y - H) / S, 0, 1), stage;
    var sweep = clamp((q - 0.39) / 0.21, 0, 1);
    var tall = clamp((q - 0.6) / 0.4, 0, 1);
    var bIn = clamp((y - 0.9 * H) / (0.1 * H + 0.08 * S), 0, 1);
    var bOut = 1 - clamp((y - (S + H)) / (0.6 * H), 0, 1);
    if (isPhone()) {
      // phone: the approach is a pre-stage. While the frame rises through the viewport (article top from 55 % of the
      // screen to the top) tinted glyphs fall inside it and the tint bleeds into the surrounding rain (stage 0 -> 0.33,
      // bleed 0 -> 1); the sticky span then carries the decode on from 0.33 (the rain announces each site by colour)
      var pre = clamp((y - 0.45 * H) / (0.55 * H), 0, 1);
      bIn = Math.max(bIn, pre);
      stage = q <= 0 ? 0.33 * pre : (q < 0.39 ? 0.33 + (q / 0.39) * 0.57 : 0.9 + ((q - 0.39) / 0.21) * 0.1);
    } else stage = q < 0.39 ? (q / 0.39) * 0.9 : 0.9 + ((q - 0.39) / 0.21) * 0.1;
    d.stage = clamp(stage, 0, 1); d.bleed = Math.min(bIn, bOut);
    if (d.active) push(d); else measureRect(d);
    mosaic(d);

    // text arrivals: when the screen is most of the way up; re-armed when the article is out of view
    if (!d.textDone && y > 0.35 * H && y < S + 1.5 * H) {
      d.textDone = true;
      ES.text.scramble(d.tag, { duration: 280 });
      ES.text.solidify(d.name, { delay: 80 });
    }

    // the real image: a slash cut across the frame while the shader finishes the unquantise (stage 0.9 -> 1)
    var w = d.rect.w, h = d.rect.h, img = d.img, band = d.band;
    if (w > 1) {
      if (sweep !== d.sweep) {
        d.sweep = sweep;
        if (sweep >= 1) { if (d.lastClip !== 'none') { img.style.clipPath = 'none'; d.lastClip = 'none'; } if (band.classList.contains('is-on')) band.classList.remove('is-on'); }
        else {
          var bw = bandWidth();
          var x0 = (-RUN * h - bw) + sweep * (w + RUN * h + bw), xTop = x0 + RUN * h, xBot = x0;
          var clip = sweep <= 0 ? 'polygon(0 0, 0 0, 0 100%, 0 100%)' : 'polygon(0 0, ' + xTop.toFixed(1) + 'px 0, ' + xBot.toFixed(1) + 'px 100%, 0 100%)';
          if (clip !== d.lastClip) { img.style.clipPath = clip; d.lastClip = clip; }
          if (sweep > 0) {
            band.style.clipPath = 'polygon(' + xTop.toFixed(1) + 'px 0, ' + (xTop + bw).toFixed(1) + 'px 0, ' + (xBot + bw).toFixed(1) + 'px 100%, ' + xBot.toFixed(1) + 'px 100%)';
            if (!band.classList.contains('is-on')) band.classList.add('is-on');
            var now = performance.now();
            if (now - d.hashT > 90) { d.hashT = now; hashBand(band); }
          } else if (band.classList.contains('is-on')) band.classList.remove('is-on');
        }
      }
    }

    // the tall capture scrubs inside the frame over the last 40 % of the span
    if (tall !== d.tall || tall > 0) {
      d.tall = tall;
      var travel = Math.max(0, Math.min(tallHeight(d, w) - h, isPhone() ? 800 : 1000));
      var ty = -travel * tall;
      img.style.transform = tall > 0 ? 'translate3d(0,' + ty.toFixed(1) + 'px,0)' : '';
    }
  }
  function setActive(d, on) {
    if (d.active === on) return;
    d.active = on;
    d.img.style.willChange = on ? 'transform, clip-path' : '';
    if (!on) { if (d.on !== 0) { rain.frame(d.slot, { on: false }); d.on = 0; } d.textDone = false; ES.text.prime(d.name); }
    else push(d);
  }
  function bindDecodes() {
    decodes.forEach(function (d) {
      measure(d);
      // residency: own the slot from 110 vh ahead until 110 vh behind (frames 0 and 2 share slot 0; their ranges never overlap)
      d.triggers.push(ScrollTrigger.create({
        trigger: d.el, invalidateOnRefresh: true,
        start: function () { return 'top ' + (window.innerHeight * 2.1).toFixed(0) + 'px'; },
        end: function () { return 'bottom ' + (-1.1 * window.innerHeight).toFixed(0) + 'px'; },
        onEnter: function () { claim(d); }, onEnterBack: function () { claim(d); },
        onLeave: function () { release(d); }, onLeaveBack: function () { release(d); },
        onRefresh: function (self) { if (self.isActive && !d.owner) claim(d); else if (!self.isActive && d.owner) release(d); }
      }));
      // the scrub: everything is a function of this progress
      d.triggers.push(ScrollTrigger.create({
        trigger: d.el, start: 'top bottom', end: 'bottom top', invalidateOnRefresh: true,
        onRefresh: function (self) { measure(d); applyDecode(d, self.progress); },
        onToggle: function (self) { setActive(d, self.isActive); if (self.isActive) applyDecode(d, self.progress); },
        onUpdate: function (self) { applyDecode(d, self.progress); }
      }));
    });
  }

  /* ------------------------------------------------------------ tiles */
  function tileGeom(t) {
    var r = t.frame.getBoundingClientRect();
    return { w: r.width, h: r.height, bw: bandWidth() };
  }
  function polys(g, e) {
    var x0 = (-RUN * g.h - g.bw) + e * (g.w + RUN * g.h + g.bw), xTop = x0 + RUN * g.h, xBot = x0;
    return {
      reveal: 'polygon(0 0, ' + xTop.toFixed(1) + 'px 0, ' + xBot.toFixed(1) + 'px 100%, 0 100%)',
      band: 'polygon(' + xTop.toFixed(1) + 'px 0, ' + (xTop + g.bw).toFixed(1) + 'px 0, ' + (xBot + g.bw).toFixed(1) + 'px 100%, ' + xBot.toFixed(1) + 'px 100%)'
    };
  }
  function setInstant(t, p) {
    t.reveal.classList.add('no-trans'); t.band.classList.add('no-trans');
    t.reveal.style.clipPath = p.reveal; t.band.style.clipPath = p.band;
    void t.reveal.offsetWidth; // commit without a transition
    t.reveal.classList.remove('no-trans'); t.band.classList.remove('no-trans');
  }
  function tileHide(t) {
    if (!t.shown) return;
    var r = t.el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) return; // still on screen (e.g. #work pinned under the next front): never pop
    t.shown = false;
    clearInterval(t.hashI); t.hashI = 0; clearTimeout(t.endT);
    t.el.classList.remove('is-shown');
    t.band.classList.remove('is-on');
    setInstant(t, polys(tileGeom(t), 0));
  }
  // the tile's capture must be on screen before the slash reveals it: load ahead, reveal once decoded (1.5 s safety)
  function tilePreload(t) {
    t.imgs.forEach(function (im) { if (im.loading === 'lazy') im.loading = 'eager'; });
  }
  function tileReady(t, cb) {
    var im = t.imgs[0];
    if (!im) { cb(); return; }
    var done = false, fin = function () { if (done) return; done = true; cb(); };
    tilePreload(t);
    if (im.decode) im.decode().then(fin, fin); // resolves once the pixels are ready to paint (waits for the load too)
    else if (im.complete && im.naturalWidth > 0) fin();
    else { im.addEventListener('load', fin, { once: true }); im.addEventListener('error', fin, { once: true }); }
    setTimeout(fin, 1500);
  }
  function tileReveal(t) {
    if (t.shown || t.pending) return;
    t.pending = true;
    tileReady(t, function () { t.pending = false; if (!t.shown) tileRevealNow(t); });
  }
  function tileRevealNow(t) {
    if (t.shown) return;
    t.shown = true;
    var g = tileGeom(t);
    setInstant(t, polys(g, 0));
    var end = polys(g, 1);
    t.band.classList.add('is-on'); hashBand(t.band);
    requestAnimationFrame(function () {
      t.reveal.style.clipPath = end.reveal; t.band.style.clipPath = end.band;
      t.el.classList.add('is-shown');
    });
    clearInterval(t.hashI);
    t.hashI = setInterval(function () { hashBand(t.band); }, 90);
    clearTimeout(t.endT);
    t.endT = setTimeout(function () { clearInterval(t.hashI); t.hashI = 0; t.band.classList.remove('is-on'); t.reveal.style.clipPath = ''; }, 720);
    ES.text.scramble(t.name, { delay: 140, duration: 260 });
  }
  function setStep(t, i) {
    if (i === t.step) return;
    t.step = i;
    t.steps.forEach(function (p, k) { p.classList.toggle('is-on', k === i); if (k === i) p.removeAttribute('aria-hidden'); else p.setAttribute('aria-hidden', 'true'); });
  }
  function bindTiles() {
    tiles.forEach(function (t) {
      // load the captures 1.5 viewports ahead of the reveal
      ScrollTrigger.create({
        trigger: t.el, invalidateOnRefresh: true,
        start: function () { return 'top ' + (window.innerHeight * 2.5).toFixed(0) + 'px'; },
        end: function () { return 'bottom ' + (-1.5 * window.innerHeight).toFixed(0) + 'px'; },
        onEnter: function () { tilePreload(t); }, onEnterBack: function () { tilePreload(t); },
        onRefresh: function (self) { if (self.isActive) tilePreload(t); }
      });
      // reveal once the tile's top passes 88 % of the viewport; re-arm (hide) only once it is fully off screen
      ScrollTrigger.create({
        trigger: t.el, start: 'top 88%', end: 'bottom top', invalidateOnRefresh: true,
        onEnter: function () { tileReveal(t); }, onEnterBack: function () { tileReveal(t); },
        onRefresh: function (self) { if (self.isActive && !t.shown) tileReveal(t); }
      });
      ScrollTrigger.create({
        trigger: t.el, start: 'top bottom', end: 'bottom top', invalidateOnRefresh: true,
        onLeave: function () { tileHide(t); }, onLeaveBack: function () { tileHide(t); }
      });
      if (t.steps.length > 1) ScrollTrigger.create({
        trigger: t.el, start: 'top 85%', end: 'bottom 15%', invalidateOnRefresh: true,
        onUpdate: function (self) { setStep(t, Math.min(t.steps.length - 1, Math.floor(self.progress * t.steps.length))); }
      });
      t.el.addEventListener('pointerenter', function () {
        var now = performance.now();
        if (now - t.hoverT < 2000 || !t.shown) return;
        t.hoverT = now;
        ES.text.scramble(t.name, { duration: 240 });
      });
    });
    if (stage.moreLabel) ScrollTrigger.create({
      trigger: stage.moreLabel, start: 'top 90%',
      onEnter: function () { ES.text.scramble(stage.moreLabel, { duration: 260 }); }, onEnterBack: function () { ES.text.scramble(stage.moreLabel, { duration: 260 }); }
    });
  }

  /* ------------------------------------------------------------ boot */
  function boot() {
    if (!hasGSAP) { // no GSAP: static page, images visible
      decodes.forEach(function (d) { d.img.style.clipPath = 'none'; });
      tiles.forEach(function (t) { t.el.classList.add('is-shown'); t.reveal.style.clipPath = 'none'; });
      return;
    }
    ES.scroll.onSection(section, { enter: stageArrive, leave: function (dir) { if (dir === 'up') stageLeave(); } });
    bindDecodes();
    bindTiles();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  /* ---------------------------------------------------------- resize */
  var rT = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () {
      H = window.innerHeight;
      decodes.forEach(function (d) {
        measure(d);
        d.lastClip = ''; d.sweep = -1; d.tall = -1; d.mk = -1;
        if (d.owner) { var kind = isPhone() ? 'm' : 'd'; if (d.smallKind !== kind) loadSmall(d, function () { upload(d); }); else { d.tex = null; d.texKey = ''; upload(d); } }
        applyDecode(d, d.P);
      });
      tiles.forEach(function (t) { if (t.shown) { t.reveal.style.clipPath = ''; } });
    }, 160);
  });

  /* ---------------------------------- "Reduce effects" switched on live */
  if (ES.motion && ES.motion.on) ES.motion.on(function (r) {
    if (!r) return;
    decodes.forEach(function (d) {
      d.active = false; d.owner = false;
      d.img.style.clipPath = ''; d.img.style.transform = ''; d.band.classList.remove('is-on'); d.band.style.clipPath = '';
      if (d.mosaic) d.mosaic.style.display = 'none';
    });
    rain.frame(0, { on: false }); rain.frame(1, { on: false });
    slots[0] = slots[1] = null;
    tiles.forEach(function (t) { clearInterval(t.hashI); clearTimeout(t.endT); t.el.classList.add('is-shown'); t.reveal.style.clipPath = ''; t.band.style.clipPath = ''; t.band.classList.remove('is-on'); });
    if (stage.cue) stage.cue.classList.remove('is-on');
  });
})();
