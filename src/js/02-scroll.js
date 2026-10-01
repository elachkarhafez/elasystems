/* ============================================================================
   02-scroll.js — window.ES.scroll: Lenis (fine pointers only), ScrollTrigger,
   the Slash Front between sections (pinned 20/60/20 on desktop, unpinned
   100svh stops on touch), scene switching (data-scene), text masks
   (data-textmask), velocity -> rain, press-and-hold bullet time, chrome
   show/hide hooks, sms press surge + pulse, the "Reduce effects" toggle.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES = window.ES || {};
  var html = document.documentElement;
  var U = ES.util;
  var reduced = html.dataset.motion === 'reduced';
  var fine = html.dataset.input === 'fine';
  var touch = !fine;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var W = window.innerWidth, H = window.innerHeight;
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > .section'));
  var windows = [], boundaryCbs = {}, lenis = null, pair = '';
  var clamp = U.clamp;

  var scroll = ES.scroll = {
    isTouch: touch, reduced: reduced, lenis: null, windows: windows, front: -0.25,
    onSection: onSection, onBoundary: onBoundary, bindFront: bindFront, scrollTo: scrollTo, setScene: setSceneAttr,
    sceneOf: sceneOf, refresh: function () { if (hasGSAP) ScrollTrigger.refresh(); }, teardown: teardown
  };
  ES.chrome = {
    topbar: function (on) { html.dataset.topbar = on ? 'on' : 'off'; },
    bottombar: function (on) { html.dataset.bottombar = on ? 'on' : 'off'; }
  };

  function sceneOf(sec) { return (sec && sec.dataset.scene) || 'page'; }
  function setFrontVar(f) { scroll.front = f; html.style.setProperty('--front', f.toFixed(4)); ES.rain.setFront(f); }
  function setSceneAttr(name) { if (html.dataset.scene !== name) html.dataset.scene = name; }
  function ensurePair(a, b) { var key = a + '>' + b; if (key !== pair) { pair = key; ES.rain.setScenePair(a, b); } }
  /* html[data-pair="old-new"] while a window runs (0 < p < 1): the persistent chrome cuts its new ground with --front */
  var pairOwner = null;
  function setPair(win, a, b) { var key = a + '-' + b; if (html.dataset.pair !== key) html.dataset.pair = key; pairOwner = win; }
  function clearPair(win) { if (pairOwner === win) { delete html.dataset.pair; pairOwner = null; } }
  /* the top bar's ink follows the ground under each element's own centre while a ground-changing sweep runs (the
     grounds are cut by --front in CSS; text cannot be split, so each element flips as the front crosses it) */
  var inkEls = null;
  function updateInk(f, a, b) {
    if (a !== 'construct' && b !== 'construct') return;
    if (!inkEls) inkEls = ['.topbar__brand', '.topbar__nav', '.topbar__cta'].map(function (s) { return document.querySelector(s); });
    for (var i = 0; i < inkEls.length; i++) {
      var el = inkEls[i]; if (!el) continue;
      var r = el.getBoundingClientRect();
      var scene = f > U.frontThrough(r.left + r.width * 0.5, r.top + r.height * 0.5) ? b : a;
      var ink = scene === 'construct' ? 'paper' : 'night';
      if (el.dataset.ink !== ink) el.dataset.ink = ink;
    }
  }
  function clearInk() { if (!inkEls) return; for (var i = 0; i < inkEls.length; i++) if (inkEls[i] && inkEls[i].dataset.ink) delete inkEls[i].dataset.ink; }
  /* a finished section (under the next one) or a pending stage (not yet swept) is clipped away and not hit-testable;
     it stays focusable on purpose: a keyboard user walking back into it scrolls the page there (see focusin below) */
  function hide(el, on) {
    var clip = on ? 'polygon(0 0, 0 0, 0 0)' : '';
    if (el.style.clipPath !== clip) el.style.clipPath = clip;
    el.style.pointerEvents = on ? 'none' : '';
  }

  /* ------------------------------------------------------- lenis + ticker */
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (!reduced && fine && window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      scroll.lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(lenisRaf);
      gsap.ticker.lagSmoothing(0);
    }
  }
  function lenisRaf(t) { if (lenis) lenis.raf(t * 1000); }

  /* velocity (px/s) -> rain time scale */
  var lastY = window.scrollY, lastT = performance.now(), vel = 0, maskY = -1, maskT = 0;
  function velTick() {
    if (reduced) return; // the still page (switched live) measures its masks on scroll instead
    var now = performance.now(), dt = Math.max(1, now - lastT) / 1000, y = window.scrollY;
    var v = (y - lastY) / dt; lastY = y; lastT = now;
    vel += (v - vel) * Math.min(1, dt * 10);
    if (Math.abs(vel) < 2) vel = 0;
    ES.rain.velocity(vel);
    // the mask rects only move with the scroll (or with a timed reveal): re-measure on scroll, else every 200 ms
    if (y !== maskY || now - maskT > 200) { maskY = y; maskT = now; updateMasks(); }
  }
  if (!reduced) { if (hasGSAP) gsap.ticker.add(velTick); else (function raf() { velTick(); requestAnimationFrame(raf); })(); }

  /* ------------------------------------------------------------- windows */
  function parseRange(sec) {
    // data-front-range (desktop window) / data-front-range-touch (the unpinned touch rise): "start end" in 0..1
    var src = (touch && sec.dataset.frontRangeTouch) || sec.dataset.frontRange || '';
    var r = src.trim().split(/[\s,]+/).map(parseFloat);
    return (r.length === 2 && isFinite(r[0]) && isFinite(r[1])) ? r : [0.2, 0.8];
  }
  function frontOf(p, range) { return -0.25 + 1.5 * clamp((p - range[0]) / (range[1] - range[0]), 0, 1); }
  function emitBoundary(id, p, f) { var L = boundaryCbs[id]; if (!L) return; for (var i = 0; i < L.length; i++) { try { L[i](p, f); } catch (e) { /* noop */ } } }

  function bindFront(A, B, opts) {
    opts = opts || {};
    var stageB = B.querySelector('.stage') || B;
    var win = { A: A, B: B, stageB: stageB, range: opts.range || parseRange(A), p: 0, docTopB: 0, hA: 0, trigger: null };
    windows.push(win);
    if (!hasGSAP || reduced) return win;
    if (fine) {
      win.trigger = ScrollTrigger.create({
        trigger: A, start: 'bottom bottom', end: function () { return '+=' + window.innerHeight; },
        pin: A, pinSpacing: false, anticipatePin: 1, invalidateOnRefresh: true,
        onRefreshInit: function () { stageB.style.transform = ''; hide(stageB, false); hide(A, false); },
        onRefresh: function () { measure(win); applyDesktop(win, win.trigger ? win.trigger.progress : 0); },
        onUpdate: function (self) { applyDesktop(win, self.progress); }
      });
    } else {
      win.trigger = ScrollTrigger.create({
        trigger: stageB, start: 'top bottom', end: 'top top', invalidateOnRefresh: true,
        onUpdate: function (self) { applyTouch(win, self.progress); },
        onRefresh: function () { applyTouch(win, win.trigger ? win.trigger.progress : 0); }
      });
    }
    return win;
  }
  function measure(win) {
    var r = win.stageB.getBoundingClientRect();
    win.docTopB = r.top + window.scrollY;
    win.hA = win.A.offsetHeight;
    W = window.innerWidth; H = window.innerHeight;
  }
  var rectV = { x: 0, y: 0, w: 1, h: 1 };
  function applyDesktop(win, p) {
    if (p < 1e-4) p = 0; else if (p > 1 - 1e-4) p = 1;
    var f = frontOf(p, win.range), A = win.A, sB = win.stageB, sa = sceneOf(A), sb = sceneOf(win.B);
    win.p = p;
    emitBoundary(A.id, p, f);
    if (p <= 0) { sB.style.transform = ''; hide(sB, false); hide(A, false); clearPair(win); clearInk(); return; }
    ensurePair(sa, sb);
    if (p >= 1) { setFrontVar(1.25); setSceneAttr(sb); sB.style.transform = ''; hide(sB, false); hide(A, true); clearPair(win); clearInk(); return; }
    setPair(win, sa, sb);
    setFrontVar(f); setSceneAttr(f > 0.5 ? sb : sa); updateInk(f, sa, sb);
    var yB = win.docTopB - window.scrollY;
    if (f <= -0.25) { hide(sB, true); sB.style.transform = 'translate3d(0,' + (-yB).toFixed(1) + 'px,0)'; }
    else {
      rectV.x = 0; rectV.y = 0; rectV.w = W; rectV.h = Math.max(H, sB.offsetHeight);
      sB.style.clipPath = f >= 1.25 ? '' : U.slashPolygon(f, rectV, 'new', W, H);
      sB.style.pointerEvents = '';
      sB.style.transform = 'translate3d(0,' + (-yB).toFixed(1) + 'px,0)';
    }
    if (f >= 1.25) hide(A, true);
    else { rectV.x = 0; rectV.y = H - win.hA; rectV.w = W; rectV.h = win.hA; A.style.clipPath = U.slashPolygon(f, rectV, 'old', W, H); A.style.pointerEvents = ''; }
  }
  function applyTouch(win, p) {
    if (p < 1e-4) p = 0; else if (p > 1 - 1e-4) p = 1;
    var f = frontOf(p, win.range), A = win.A, sB = win.stageB, sa = sceneOf(A), sb = sceneOf(win.B);
    win.p = p;
    emitBoundary(A.id, p, f);
    if (p <= 0) { hide(sB, false); clearPair(win); clearInk(); return; }
    ensurePair(sa, sb);
    if (p >= 1) { setFrontVar(1.25); setSceneAttr(sb); hide(sB, false); clearPair(win); clearInk(); return; }
    setPair(win, sa, sb);
    setFrontVar(f); setSceneAttr(f > 0.5 ? sb : sa); updateInk(f, sa, sb);
    if (f <= -0.25) { hide(sB, true); return; }
    var r = sB.getBoundingClientRect();
    rectV.x = r.left; rectV.y = r.top; rectV.w = r.width; rectV.h = r.height;
    sB.style.clipPath = f >= 1.25 ? '' : U.slashPolygon(f, rectV, 'new', window.innerWidth, window.innerHeight);
    sB.style.pointerEvents = '';
  }
  function onBoundary(id, cb) { (boundaryCbs[id] = boundaryCbs[id] || []).push(cb); }

  /* ------------------------------------------------------------ sections */
  function onSection(id, h) {
    var sec = typeof id === 'string' ? document.getElementById(id) : id;
    if (!sec || !hasGSAP) return null;
    h = h || {};
    var t = [];
    if (h.enter || h.leave) t.push(ScrollTrigger.create({
      trigger: sec, start: 'top 60%', end: 'bottom 40%',
      onEnter: function () { h.enter && h.enter('down'); }, onEnterBack: function () { h.enter && h.enter('up'); },
      onLeave: function () { h.leave && h.leave('down'); }, onLeaveBack: function () { h.leave && h.leave('up'); }
    }));
    if (h.progress) t.push(ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onUpdate: function (s) { h.progress(s.progress, s.direction); } }));
    return t;
  }
  /* the natural document position of an element: a finished pinned section is left translated by its pin
     distance (pinSpacing: false), so bounding rects lie; offsetTop ignores transforms, and a section that is
     fixed right now (mid-pin) gets its top back from the pin trigger's start */
  function docTop(el) {
    var y = 0, e = el;
    while (e && e !== document.body && e !== html) {
      if (getComputedStyle(e).position === 'fixed') {
        for (var i = 0; i < windows.length; i++) if (windows[i].A === e && windows[i].trigger) return y + windows[i].trigger.start - e.offsetHeight + window.innerHeight;
        return y + e.getBoundingClientRect().top + window.scrollY;
      }
      y += e.offsetTop; e = e.offsetParent;
    }
    return y;
  }
  /* the section an element belongs to (a pinned section sits inside ScrollTrigger's pin-spacer, so not `main > .section`) */
  function sectionOf(el) { var s = (el && el.closest) ? el.closest('.section') : null; return (s && sections.indexOf(s) > -1) ? s : null; }
  function windowsOf(sec) {
    var o = { prev: null, next: null };
    for (var i = 0; i < windows.length; i++) { if (windows[i].B === sec) o.prev = windows[i]; if (windows[i].A === sec) o.next = windows[i]; }
    return o;
  }
  function focusable(el) { return !!(el.matches && el.matches('a[href], button, input, select, textarea, summary, [tabindex]')); }
  /* after a scroll the target holds the focus, so Tab continues from there (a container gets tabindex -1) */
  function focusTarget(el) {
    if (document.activeElement === el) return;
    if (!focusable(el)) el.tabIndex = -1;
    try { el.focus({ preventScroll: true }); } catch (e) { /* noop */ }
  }
  function scrollTo(target, opts) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    opts = opts || {};
    // honour scroll-margin-top (native scrollIntoView does; Lenis needs it as an offset)
    var margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    var top = Math.max(0, docTop(el) - margin);
    // pinned boundaries: something in a section's last screen is shown at that section's window start (front unswept);
    // something in the next section's first screen is shown once that window has completed (front swept)
    if (hasGSAP && !reduced) {
      var sec = sectionOf(el), w = sec ? windowsOf(sec) : null;
      if (w && w.next && w.next.trigger) top = Math.min(top, w.next.trigger.start);
      if (w && w.prev && w.prev.trigger && w.prev.stageB.contains(el)) top = Math.max(top, w.prev.trigger.end);
    }
    top = Math.max(0, Math.round(top));
    var dur = opts.duration || 1.2;
    function land() { if (opts.focus !== false) focusTarget(el); }
    if (lenis) { if (Math.abs(top - window.scrollY) < 1) land(); else lenis.scrollTo(top, { duration: dur, onComplete: land }); }
    else { window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' }); setTimeout(land, reduced ? 0 : 700); }
  }
  scroll.docTop = docTop;
  /* keyboard traversal across pinned boundaries: focus landing in a finished section (clipped under the next one) or in
     a stage the front has not swept yet scrolls the page there, so the front reverses (or completes) and the element shows */
  document.addEventListener('focusin', function (e) {
    if (reduced || !hasGSAP) return;
    var el = e.target; if (!el || el === document.body || !el.closest) return;
    var sec = sectionOf(el); if (!sec) return;
    var w = windowsOf(sec);
    // A is cut once its window's sweep has started (fully clipped from the sweep's end on); B's stage is cut until the sweep ends
    var clipped = (fine && w.next && w.next.p > w.next.range[0]) || (w.prev && w.prev.p > 0 && w.prev.p < w.prev.range[1] && w.prev.stageB.contains(el));
    if (clipped) scrollTo(el);
  });

  /* ---------------------------------------------------------- text masks */
  var maskEls = [], visible = [], io = null, maskRects = [{}, {}, {}, {}];
  function collectMasks() {
    maskEls = Array.prototype.slice.call(document.querySelectorAll('[data-textmask]'));
    if (io) io.disconnect();
    if (!('IntersectionObserver' in window)) { visible = maskEls.slice(); return; }
    io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i], idx = visible.indexOf(e.target);
        if (e.isIntersecting && idx < 0) visible.push(e.target);
        else if (!e.isIntersecting && idx > -1) visible.splice(idx, 1);
      }
    }, { rootMargin: '0px' });
    for (var i = 0; i < maskEls.length; i++) io.observe(maskEls[i]);
  }
  var maskOut = [];
  function updateMasks() {
    maskOut.length = 0;
    for (var i = 0; i < visible.length && maskOut.length < 8; i++) {
      var el = visible[i];
      if (el.dataset.textmask === 'off') continue;
      var r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > H) continue;
      maskOut.push(r);
    }
    if (maskOut.length > 4) maskOut.sort(function (a, b) { return b.width * b.height - a.width * a.height; });
    for (var k = 0; k < 4 && k < maskOut.length; k++) { var m = maskRects[k], rr = maskOut[k]; m.x = rr.left - 6; m.y = rr.top - 4; m.w = rr.width + 12; m.h = rr.height + 8; }
    ES.rain.setTextMask(maskRects.slice(0, Math.min(4, maskOut.length)));
  }
  scroll.collectMasks = collectMasks;
  scroll.updateMasks = updateMasks;

  /* ------------------------------------------------- press-and-hold bullet */
  var holdTimer = 0, holding = false;
  function releaseHold() { clearTimeout(holdTimer); holdTimer = 0; if (holding) { holding = false; ES.rain.bullet(false); delete html.dataset.bullet; } }
  if (!reduced) {
    window.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest && e.target.closest('a, button, input, label, select, textarea, summary, [data-no-hold]')) return;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(function () { holding = true; ES.rain.bullet(true); html.dataset.bullet = '1'; }, 180);
    }, { passive: true });
    window.addEventListener('pointerup', releaseHold, { passive: true });
    window.addEventListener('pointercancel', releaseHold, { passive: true });
    window.addEventListener('blur', releaseHold);
    window.addEventListener('touchmove', function () { if (!holding) clearTimeout(holdTimer); }, { passive: true });
  }

  /* ----------------------------------------------------- sms press: surge */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="sms:"], a[href^="tel:"]');
    if (!a) return;
    ES.rain.surge(400); ES.rain.pulse();
  }, { passive: true });
  document.addEventListener('pointerdown', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="sms:"]');
    if (a) ES.rain.pulse();
  }, { passive: true });

  /* ------------------------------------------------------- anchor links */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || !lenis) return;
    var id = a.getAttribute('href').slice(1); if (!id) return;
    var el = document.getElementById(id); if (!el) return;
    e.preventDefault();
    scrollTo(el);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

  /* ------------------------------------------------------------- chrome */
  var inOff = 0, pastHero = false;
  function updateBottombar() { html.dataset.bottombar = (pastHero && inOff <= 0) ? 'on' : 'off'; }
  function setupChrome() {
    var hero = document.getElementById('hero');
    if (hasGSAP && hero) {
      ScrollTrigger.create({ trigger: hero, start: 'bottom top', onEnter: function () { pastHero = true; updateBottombar(); }, onLeaveBack: function () { pastHero = false; updateBottombar(); } });
    } else {
      window.addEventListener('scroll', function () { var p = window.scrollY > H * 0.6; if (p !== pastHero) { pastHero = p; updateBottombar(); } }, { passive: true });
    }
    sections.forEach(function (sec) {
      if (sec.dataset.bottombar !== 'off' || !hasGSAP) return;
      ScrollTrigger.create({ trigger: sec, start: 'top 70%', end: 'bottom 30%', onToggle: function (s) { inOff += s.isActive ? 1 : -1; updateBottombar(); } });
    });
    // current section in the top bar nav
    var links = Array.prototype.slice.call(document.querySelectorAll('.topbar__nav a[href^="#"]'));
    links.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute('href').slice(1)); if (!sec || !hasGSAP) return;
      ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: function (s) { if (s.isActive) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); } });
    });
    // reduce effects toggle
    var tgl = document.getElementById('reduce-fx');
    if (tgl) {
      tgl.checked = reduced;
      tgl.addEventListener('change', function () {
        if (tgl.checked) { ES.motion.set(true); teardown(); }
        else { ES.motion.set(false); location.reload(); }
      });
    }
    // copy number
    var cp = document.querySelector('[data-copy]');
    if (cp) cp.addEventListener('click', function () {
      var v = cp.dataset.copy, live = document.getElementById('contact-copied');
      function ok() { cp.textContent = 'Copied'; if (live) live.textContent = 'Number copied'; setTimeout(function () { cp.textContent = 'Copy number'; }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(ok, function () { fallback(); });
      else fallback();
      function fallback() {
        var ta = document.createElement('textarea'); ta.value = v; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { /* noop */ } document.body.removeChild(ta);
      }
    });
  }

  function teardown() {
    if (hasGSAP) { ScrollTrigger.getAll().forEach(function (t) { t.kill(); }); gsap.ticker.remove(lenisRaf); }
    if (lenis) { lenis.destroy(); lenis = null; scroll.lenis = null; }
    windows.forEach(function (w) { w.stageB.style.transform = ''; hide(w.stageB, false); hide(w.A, false); });
    delete html.dataset.pair; pairOwner = null; clearInk();
    html.style.setProperty('--front', '1.25');
    ES.text.finishAll();
    reduced = true; scroll.reduced = true;
    bindStatic();
    // the hero trigger that drove the phone bottom bar is gone: keep it on a plain scroll threshold
    window.addEventListener('scroll', function () { var p = window.scrollY > window.innerHeight * 0.9; if (p !== pastHero) { pastHero = p; updateBottombar(); } }, { passive: true });
  }

  /* the still page (reduced motion, at boot or switched live): no windows; the scene attribute follows the
     section under the viewport centre, the still frame keeps the caught mark while the hero leads and a quiet
     dim field behind every other section's window, and the text masks are re-measured on scroll */
  var staticBound = false, onHero = null;
  function staticScene() {
    var mid = window.innerHeight * 0.5, cur = sections[0];
    for (var i = 0; i < sections.length; i++) { if (sections[i].getBoundingClientRect().top <= mid) cur = sections[i]; }
    setSceneAttr(sceneOf(cur));
    var h = cur === sections[0];
    if (h !== onHero) { onHero = h; ES.rain.set({ catch: h ? 1 : 0, dim: h ? 1 : 0.6 }); }
    updateMasks();
  }
  function bindStatic() {
    if (staticBound) return; staticBound = true;
    html.style.setProperty('--front', '1.25');
    ES.rain.setFront(-0.25);
    window.addEventListener('scroll', staticScene, { passive: true });
    staticScene();
  }

  /* --------------------------------------------------------------- boot */
  function boot() {
    collectMasks();
    if (!reduced) {
      for (var i = 0; i < sections.length - 1; i++) bindFront(sections[i], sections[i + 1]);
      // initial scene = the hero's
      ES.rain.setScene(sceneOf(sections[0]));
      setFrontVar(-0.25); setSceneAttr(sceneOf(sections[0]));
    } else {
      setSceneAttr('hero');
      ES.rain.setScene('hero');
      bindStatic();
    }
    setupChrome();
    if (hasGSAP) {
      // ScrollTrigger refresh after fonts/images settle
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    }
    // deep link: let the browser land, then refresh triggers
    if (location.hash && hasGSAP) setTimeout(function () { ScrollTrigger.refresh(); }, 50);
  }
  var resizeT = 0;
  window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(function () { W = window.innerWidth; H = window.innerHeight; windows.forEach(measure); if (reduced) updateMasks(); }, 150); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
