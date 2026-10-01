/* 00-core.js */
(function () {
'use strict';
var ES = window.ES = window.ES || {};
var html = document.documentElement;
var SLASH_RUN = 0.535;
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function lerp(a, b, t) { return a + (b - a) * t; }
function docTop(el) { var y = 0; while (el && el !== document.body) { y += el.offsetTop; el = el.offsetParent; } return y; }
function smooth(lambda, v) {
var s = { v: v || 0, t: v || 0, done: true };
s.to = function (target) { s.t = target; if (Math.abs(s.t - s.v) > 1e-4) s.done = false; return s; };
s.step = function (dt) {
if (s.done) return false;
var d = s.t - s.v;
if (Math.abs(d) < 5e-4) { s.v = s.t; s.done = true; return true; }
s.v += d * (1 - Math.exp(-lambda * dt));
return true;
};
s.jump = function (target) { s.v = s.t = target; s.done = true; return s; };
return s;
}
ES.util = { SLASH_RUN: SLASH_RUN, clamp: clamp, lerp: lerp, docTop: docTop, smooth: smooth };
ES.SLASH_RUN = SLASH_RUN;
ES.phone = function () { return window.innerWidth < 768; };
var motionCbs = [];
ES.motion = {
get reduced() { return html.dataset.motion === 'reduced'; },
set: function (reduced, persist) {
html.dataset.motion = reduced ? 'reduced' : 'full';
if (persist !== false) { try { localStorage.setItem('es-motion', reduced ? 'reduced' : 'full'); } catch (e) { /* noop */ } }
if (reduced) { delete html.dataset.intro; delete html.dataset.lb; }
for (var i = 0; i < motionCbs.length; i++) { try { motionCbs[i](reduced); } catch (e) { /* noop */ } }
},
on: function (cb) { motionCbs.push(cb); }
};
function reduced() { return html.dataset.motion === 'reduced'; }
var fns = [], rafId = 0, last = 0, awakeUntil = 0, W = window.innerWidth, H = window.innerHeight;
var pointer = { x: 0, y: 0, live: false };
ES.pointer = pointer;
function wake(ms) { awakeUntil = Math.max(awakeUntil, performance.now() + (ms || 1200)); if (!rafId && !document.hidden) rafId = requestAnimationFrame(frame); }
function frame(now) {
rafId = 0;
var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
var y = window.pageYOffset || 0, busy = false;
for (var i = 0; i < fns.length; i++) { try { if (fns[i](now, dt, y, W, H)) busy = true; } catch (e) { /* a broken tick never stops the film */ } }
if (busy || now < awakeUntil) rafId = requestAnimationFrame(frame); else last = 0;
}
ES.loop = {
add: function (fn) { if (fns.indexOf(fn) < 0) fns.push(fn); wake(); },
remove: function (fn) { var i = fns.indexOf(fn); if (i > -1) fns.splice(i, 1); },
wake: wake,
get W() { return W; }, get H() { return H; }
};
['scroll', 'wheel', 'touchmove', 'keydown', 'resize'].forEach(function (ev) { window.addEventListener(ev, function () { wake(); }, { passive: true }); });
document.addEventListener('visibilitychange', function () { if (document.hidden) { if (rafId) cancelAnimationFrame(rafId); rafId = 0; last = 0; } else wake(); });
var onResizeCbs = [], rT = 0;
window.addEventListener('resize', function () {
clearTimeout(rT);
rT = setTimeout(function () { W = window.innerWidth; H = window.innerHeight; for (var i = 0; i < onResizeCbs.length; i++) { try { onResizeCbs[i](); } catch (e) { /* noop */ } } wake(); }, 150);
});
var measureCbs = [], mT = 0;
function requestMeasure(ms) { clearTimeout(mT); mT = setTimeout(function () { for (var i = 0; i < measureCbs.length; i++) { try { measureCbs[i](); } catch (e) { /* noop */ } } wake(); }, ms === undefined ? 120 : ms); }
ES.loop.onResize = function (cb) { onResizeCbs.push(cb); };
ES.loop.onMeasure = function (cb) { measureCbs.push(cb); };
ES.loop.requestMeasure = requestMeasure;
if (window.ResizeObserver) { var lastH = 0; new ResizeObserver(function () { var h = document.body.offsetHeight; if (h !== lastH) { lastH = h; requestMeasure(); } }).observe(document.body); }
window.addEventListener('load', function () { requestMeasure(0); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestMeasure(0); });
if (html.dataset.input === 'fine') {
window.addEventListener('pointermove', function (e) {
if (e.pointerType && e.pointerType !== 'mouse') return;
pointer.x = clamp((e.clientX / W) * 2 - 1, -1, 1); pointer.y = clamp((e.clientY / H) * 2 - 1, -1, 1); pointer.live = true;
wake(1600);
}, { passive: true });
window.addEventListener('pointerleave', function () { pointer.x = 0; pointer.y = 0; wake(1600); });
}
var ioRise = null, ioScene = null;
function show(el, cls) { if (!el.classList.contains(cls)) el.classList.add(cls); }
function observeAll() {
var rises = document.querySelectorAll('[data-rise]'), scenes = document.querySelectorAll('[data-scene-in]'), i;
for (i = 0; i < rises.length; i++) { var v = parseInt(rises[i].dataset.rise, 10); if (v > 0) rises[i].style.setProperty('--i', String(v)); }
if (reduced() || !('IntersectionObserver' in window)) {
for (i = 0; i < rises.length; i++) show(rises[i], 'is-in');
for (i = 0; i < scenes.length; i++) show(scenes[i], 'is-on');
return;
}
ioRise = new IntersectionObserver(function (entries) {
for (var k = 0; k < entries.length; k++) if (entries[k].isIntersecting) { show(entries[k].target, 'is-in'); ioRise.unobserve(entries[k].target); }
}, { threshold: [0.2] });
ioScene = new IntersectionObserver(function (entries) {
for (var k = 0; k < entries.length; k++) if (entries[k].isIntersecting) { var t = entries[k].target; show(t, t.hasAttribute('data-scene-in') ? 'is-on' : 'is-in'); ioScene.unobserve(t); }
}, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
for (i = 0; i < rises.length; i++) { if (rises[i].offsetHeight > H * 0.7) ioScene.observe(rises[i]); else ioRise.observe(rises[i]); }
for (i = 0; i < scenes.length; i++) ioScene.observe(scenes[i]);
}
function revealAll() {
var all = document.querySelectorAll('[data-rise], [data-scene-in]');
for (var i = 0; i < all.length; i++) show(all[i], all[i].hasAttribute('data-scene-in') ? 'is-on' : 'is-in');
if (ioRise) ioRise.disconnect(); if (ioScene) ioScene.disconnect();
}
ES.reveal = { all: revealAll, show: show };
document.addEventListener('focusin', function (e) {
var el = e.target; if (!el || !el.closest) return;
var r = el.closest('[data-rise]:not(.is-in)'); while (r) { show(r, 'is-quick'); show(r, 'is-in'); r = r.parentElement && r.parentElement.closest('[data-rise]:not(.is-in)'); }
var s = el.closest('[data-scene-in]:not(.is-on)'); if (s) { show(s, 'is-quick'); show(s, 'is-on'); }
});
function grain() {
var el = document.getElementById('film-grain'); if (!el) return;
try {
var N = 96, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
var ctx = cv.getContext('2d'); if (!ctx) return;
var id = ctx.createImageData(N, N), px = id.data;
for (var i = 0; i < px.length; i += 4) { var v = 160 + (Math.random() * 95) | 0; px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = Math.random() < 0.5 ? 255 : 0; }
ctx.putImageData(id, 0, 0);
el.style.backgroundImage = 'url("' + cv.toDataURL('image/png') + '")';
} catch (e) { /* no grain, no harm */ }
}
function haze() {
var boxes = document.querySelectorAll('[data-haze]');
for (var b = 0; b < boxes.length; b++) {
var box = boxes[b], n = ES.phone() ? 4 : (box.dataset.haze === 'hero' ? 8 : 6), seed = b * 7 + 3;
var frag = document.createDocumentFragment();
for (var i = 0; i < n; i++) {
var r1 = frac(seed + i * 1.37), r2 = frac(seed + i * 2.91), r3 = frac(seed + i * 4.13), r4 = frac(seed + i * 5.71);
var size = Math.round(60 + r3 * 160), disc = document.createElement('i');
disc.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (4 + r1 * 88).toFixed(1) + '%;top:' + (4 + r2 * 84).toFixed(1) + '%;opacity:' + (0.04 + r4 * 0.06).toFixed(3) +
';--dx:' + ((r2 - 0.5) * 14).toFixed(1) + 'px;--dy:' + ((r1 - 0.5) * 12).toFixed(1) + 'px;animation-delay:-' + (r3 * 20).toFixed(1) + 's;animation-duration:' + (18 + r4 * 8).toFixed(1) + 's';
frag.appendChild(disc);
}
box.appendChild(frag);
}
}
function frac(x) { var s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); }
function boot() {
grain();
haze();
observeAll();
ES.motion.on(function (r) { if (r) revealAll(); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* 01-scroll.js */
(function () {
'use strict';
var ES = window.ES = window.ES || {};
var html = document.documentElement;
var U = ES.util, clamp = U.clamp;
var reduced = html.dataset.motion === 'reduced';
var fine = html.dataset.input === 'fine';
var sections = Array.prototype.slice.call(document.querySelectorAll('main > .section'));
var lenis = null;
var scroll = ES.scroll = { lenis: null, scrollTo: scrollTo, reduced: reduced, docTop: U.docTop, sceneOf: sceneOf };
ES.chrome = {
topbar: function (on) { html.dataset.topbar = on ? 'on' : 'off'; },
bottombar: function (on) { html.dataset.bottombar = on ? 'on' : 'off'; }
};
function sceneOf(sec) { return (sec && sec.dataset.scene) || 'page'; }
if (!reduced && fine && window.Lenis) {
try {
lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 1 });
scroll.lenis = lenis;
ES.loop.add(function (now) { lenis.raf(now); return !!lenis.isScrolling; });
lenis.on('scroll', function () { ES.loop.wake(300); });
} catch (e) { lenis = null; }
}
var dips = [];
function easeDim(e) { return e * e * (3 - 2 * e); }
function buildDips() {
var els = document.querySelectorAll('[data-dip]');
for (var i = 0; i < els.length; i++) {
var el = els[i], ov = document.createElement('i'), kind = el.dataset.dip || 'black';
ov.className = 'dip' + (kind !== 'black' ? ' dip--' + kind : '');
ov.setAttribute('aria-hidden', 'true');
el.appendChild(ov);
dips.push({ el: el, ov: ov, max: kind === 'black' ? 0.85 : 1, span: kind === 'black' ? 0.6 : 0.5, top: 0, h: 1, dim: U.smooth(6, 0), near: false, last: -1 });
}
}
function measureDips() { for (var i = 0; i < dips.length; i++) { var d = dips[i]; d.top = U.docTop(d.el); d.h = Math.max(1, d.el.offsetHeight); } }
function tickDips(now, dt, y, W, H) {
if (reduced) return false;
var busy = false;
for (var i = 0; i < dips.length; i++) {
var d = dips[i], bottom = d.top + d.h - y, top = d.top - y;
var near = bottom > -0.5 * H && top < 1.5 * H;
if (near !== d.near) { d.near = near; d.ov.classList.toggle('is-near', near); }
if (!near) { if (d.last !== 0 && d.dim.v === 0) continue; }
var e = clamp((H - bottom) / (d.span * H), 0, 1);
d.dim.to(near ? d.max * easeDim(e) : 0);
if (d.dim.step(dt)) busy = true;
var v = Math.round(d.dim.v * 500) / 500;
if (v !== d.last) { d.last = v; d.ov.style.opacity = v ? String(v) : ''; }
}
return busy;
}
function settleDips() { for (var i = 0; i < dips.length; i++) { var d = dips[i]; d.dim.jump(0); d.ov.style.opacity = ''; d.ov.classList.remove('is-near'); } }
var tops = [], curScene = '', curSec = null, pastHero = false, lbOff = false;
var navLinks = Array.prototype.slice.call(document.querySelectorAll('.topbar__nav a[href^="#"]'));
function measureSections() { tops = sections.map(function (s) { return U.docTop(s); }); }
function tickScene(now, dt, y, W, H) {
var mid = y + 0.5 * H, sec = sections[0];
for (var i = 0; i < sections.length; i++) if (tops[i] <= mid) sec = sections[i];
if (sec !== curSec) {
curSec = sec;
var sc = sceneOf(sec); if (sc !== curScene) { curScene = sc; html.dataset.scene = sc; }
for (var k = 0; k < navLinks.length; k++) {
var on = navLinks[k].getAttribute('href') === '#' + sec.id;
if (on) navLinks[k].setAttribute('aria-current', 'true'); else navLinks[k].removeAttribute('aria-current');
}
}
var ph = y > 0.9 * H;
if (ph !== pastHero) { pastHero = ph; updateBottombar(); }
if (!lbOff && y > 2) letterboxOff();
return false;
}
function updateBottombar() { html.dataset.bottombar = (pastHero && html.dataset.numberview !== '1') ? 'on' : 'off'; }
scroll.updateBottombar = updateBottombar;
function letterboxOff() { if (lbOff) return; lbOff = true; if (html.dataset.lb) html.dataset.lb = 'off'; }
['wheel', 'touchmove'].forEach(function (ev) { window.addEventListener(ev, letterboxOff, { passive: true, once: true }); });
window.addEventListener('keydown', function (e) { if (/^(Space|ArrowDown|PageDown|End)$/.test(e.code)) letterboxOff(); });
function focusable(el) { return !!(el.matches && el.matches('a[href], button, input, select, textarea, summary, [tabindex]')); }
function focusTarget(el) {
if (document.activeElement === el) return;
if (!focusable(el)) el.tabIndex = -1;
try { el.focus({ preventScroll: true }); } catch (e) { /* noop */ }
}
function scrollTo(target, opts) {
var el = typeof target === 'string' ? document.querySelector(target) : target;
if (!el) return;
opts = opts || {};
var margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
var top = Math.max(0, Math.round(U.docTop(el) - margin));
function land() { if (opts.focus !== false) focusTarget(el); }
if (lenis) { if (Math.abs(top - window.pageYOffset) < 1) land(); else { lenis.scrollTo(top, { duration: opts.duration || 1.4, onComplete: land }); ES.loop.wake(2000); } }
else { window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' }); setTimeout(land, reduced ? 0 : 700); }
}
document.addEventListener('click', function (e) {
var a = e.target.closest && e.target.closest('a[href^="#"]');
if (!a) return;
var id = a.getAttribute('href').slice(1); if (!id) return;
var el = document.getElementById(id); if (!el) return;
e.preventDefault();
scrollTo(el);
if (history.replaceState) history.replaceState(null, '', '#' + id);
});
ES.sweep = function (el) { if (!el || reduced) return; el.classList.remove('is-sweep'); void el.offsetWidth; el.classList.add('is-sweep'); };
document.addEventListener('pointerdown', function (e) {
var a = e.target.closest && e.target.closest('a[href^="sms:"], a[href^="tel:"]');
if (a) ES.sweep(a);
}, { passive: true, capture: true });
function setupToggle() {
var tgl = document.getElementById('reduce-fx');
if (!tgl) return;
tgl.checked = reduced;
tgl.addEventListener('change', function () {
if (tgl.checked) { ES.motion.set(true); teardown(); }
else { ES.motion.set(false); location.reload(); }
});
}
function teardown() {
reduced = true; scroll.reduced = true;
if (lenis) { try { lenis.destroy(); } catch (e) { /* noop */ } lenis = null; scroll.lenis = null; }
settleDips();
html.dataset.topbar = 'on';
ES.loop.requestMeasure(0);
}
function boot() {
buildDips();
measureDips(); measureSections();
ES.loop.onMeasure(function () { measureDips(); measureSections(); });
ES.loop.onResize(function () { measureDips(); measureSections(); });
ES.loop.add(tickDips);
ES.loop.add(tickScene);
setupToggle();
if (reduced) { settleDips(); letterboxOff(); }
if (location.hash) { letterboxOff(); var el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(function () { scrollTo(el, { duration: 0.1 }); }, 60); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* 10-hero.js */
(function () {
'use strict';
var ES = window.ES, hero = document.getElementById('hero');
if (!ES || !hero) return;
var html = document.documentElement;
var reduced = html.dataset.motion === 'reduced';
var U = ES.util;
var copy = document.getElementById('hero-copy'), par = document.getElementById('hero-par'), haze = hero.querySelector('.haze');
var BEATS = [[300, 'is-mark'], [1400, 'is-sweep'], [2200, 'is-wm'], [3000, 'is-title'], [3800, 'is-cta'], [4600, 'is-cue'], [5800, 'is-done']];
var timers = [], done = false, t0 = performance.now();
function measureCopy() { if (copy) hero.style.setProperty('--copy-h', Math.round(copy.offsetHeight) + 'px'); }
measureCopy();
ES.loop.onResize(measureCopy);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureCopy);
function finish() {
if (done) return; done = true;
timers.forEach(clearTimeout); timers.length = 0;
delete html.dataset.intro;
}
if (reduced || html.dataset.intro !== '1') {
BEATS.forEach(function (b) { hero.classList.add(b[1]); });
finish();
} else {
BEATS.forEach(function (b) {
timers.push(setTimeout(function () {
hero.classList.add(b[1]);
if (b[1] === 'is-wm') delete html.dataset.intro;
if (b[1] === 'is-done') finish();
}, b[0]));
});
function skip(e) {
if (done || performance.now() - t0 < 350) return;
if (e && e.type === 'keydown' && !/^(Space|ArrowDown|ArrowUp|PageDown|PageUp|End|Home|Enter)$/.test(e.code)) return;
hero.classList.add('is-skip');
BEATS.forEach(function (b) { hero.classList.add(b[1]); });
finish();
}
window.addEventListener('wheel', skip, { passive: true });
window.addEventListener('touchmove', skip, { passive: true });
window.addEventListener('scroll', function () { if (window.pageYOffset > 4) skip(); }, { passive: true });
window.addEventListener('keydown', skip);
window.addEventListener('pointerup', function (e) { if (!e.target.closest || !e.target.closest('a, button, input, label')) skip(e); }, { passive: true });
setTimeout(function () { if (!done) skip(); }, 7000);
}
var onScreen = true, sweepT = 0;
function scheduleSweep() {
clearTimeout(sweepT);
sweepT = setTimeout(function () {
if (onScreen && !document.hidden && html.dataset.motion !== 'reduced') { hero.classList.remove('is-sweep'); void hero.offsetWidth; hero.classList.add('is-sweep'); }
scheduleSweep();
}, 12000);
}
if (!reduced) {
scheduleSweep();
if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; }, { threshold: 0.1 }).observe(hero);
}
if (!reduced && html.dataset.input === 'fine' && par) {
var px = U.smooth(2.5, 0), py = U.smooth(2.5, 0), lastX = null, lastY = null;
ES.loop.add(function (now, dt) {
if (!onScreen || html.dataset.motion === 'reduced') return false;
px.to(ES.pointer.x); py.to(ES.pointer.y);
var a = px.step(dt), b = py.step(dt);
var x = Math.round(px.v * 60) / 10, y = Math.round(py.v * 60) / 10;
if (x !== lastX || y !== lastY) {
lastX = x; lastY = y;
par.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
if (haze) haze.style.transform = 'translate3d(' + (-x * 1.6).toFixed(1) + 'px,' + (-y * 1.6).toFixed(1) + 'px,0)';
}
return a || b;
});
}
ES.motion.on(function (r) {
if (!r) return;
reduced = true; clearTimeout(sweepT);
hero.classList.remove('is-skip');
BEATS.forEach(function (b) { hero.classList.add(b[1]); });
hero.classList.remove('is-sweep');
finish();
if (par) par.style.transform = ''; if (haze) haze.style.transform = '';
});
})();

/* 20-pillars.js */
(function () {
'use strict';
var ES = window.ES, sec = document.getElementById('pillars');
if (!ES || !sec) return;
var html = document.documentElement;
var reduced = html.dataset.motion === 'reduced';
var stage = sec.querySelector('.pillars__stage'), e = document.getElementById('pillars-e');
if (reduced || !stage || !e || !window.MutationObserver) { sec.classList.add('is-in'); return; }
new MutationObserver(function () { if (stage.classList.contains('is-on')) sec.classList.add('is-in'); }).observe(stage, { attributes: true, attributeFilter: ['class'] });
if (stage.classList.contains('is-on')) sec.classList.add('is-in');
sec.addEventListener('focusin', function () { if (!sec.classList.contains('is-in')) { sec.classList.add('is-quick'); sec.classList.add('is-in'); } });
ES.motion.on(function (r) { if (r) sec.classList.add('is-in'); });
})();

/* 21-diagnose.js */
(function () {
'use strict';
var ES = window.ES, sec = document.getElementById('diagnose');
if (!ES || !sec) return;
var html = document.documentElement;
var reduced = html.dataset.motion === 'reduced';
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
var TP = DATA.touchpoints, KINDS = DATA.kinds, PHONE = DATA.phone;
var STEP = 120;
var chips = Array.prototype.slice.call(sec.querySelectorAll('.chip'));
var live = document.getElementById('dx-live');
var print = document.getElementById('dx-print');
var seeLink = document.getElementById('dx-see'), seeText = document.getElementById('dx-see-text');
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
var rows = [];
(function build() {
print.textContent = '';
for (var i = 0; i < TP.length; i++) {
var li = document.createElement('li'); li.className = 'tp';
var node = document.createElement('i'); node.className = 'tp__node'; node.setAttribute('aria-hidden', 'true');
var name = document.createElement('span'); name.className = 'tp__name'; name.textContent = TP[i];
var line = document.createElement('i'); line.className = 'strike-line'; line.setAttribute('aria-hidden', 'true'); name.appendChild(line);
var sr = document.createElement('span'); sr.className = 'sr-only tp__sr';
var fix = document.createElement('span'); fix.className = 'tp__fix';
li.appendChild(node); li.appendChild(name); li.appendChild(sr); li.appendChild(fix);
print.appendChild(li);
rows.push({ li: li, name: name, sr: sr, fix: fix });
}
})();
var cur = null, timers = [], played = false, printing = false;
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers.length = 0; }
function still(fn) { sec.classList.add('no-trans'); fn(); void sec.offsetWidth; sec.classList.remove('no-trans'); }
function fill(k, hidden) {
var leaks = [];
for (var i = 0; i < rows.length; i++) {
var r = rows[i], fixText = leakOf(k, i);
r.name.firstChild.nodeValue = TP[i];
r.name.classList.toggle('strike-word', !!fixText);
r.li.classList.toggle('is-leak', !!fixText);
r.li.classList.toggle('is-fixed', !!fixText && !hidden);
r.fix.textContent = fixText || '';
r.sr.textContent = fixText ? ' usually leaks. What we build: ' : '';
if (fixText) leaks.push(TP[i]);
r.li.classList.toggle('is-wait', !!hidden);
r.li.classList.toggle('is-fixwait', !!hidden);
}
if (seeLink) { seeLink.href = '#work-' + k.slug; seeLink.dataset.slug = k.slug; }
if (seeText) seeText.textContent = 'See: ' + k.client;
if (tag) tag.textContent = 'Matching work · ' + k.place;
if (msg) msg.textContent = body(k);
cta.href = smsHref(body(k));
if (status) status.textContent = k.chip + '. Usually leaks at: ' + leaks.join(', ') + '.';
chips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.kind === k.id ? 'true' : 'false'); });
live.dataset.kind = k.id;
sec.classList.toggle('is-read', !hidden);
}
function play(k) {
clearTimers();
if (reduced || html.dataset.motion === 'reduced') { fill(k, false); return; }
still(function () { fill(k, true); });
printing = true;
rows.forEach(function (r, i) {
later(function () {
r.li.classList.remove('is-wait');
if (r.li.classList.contains('is-leak')) {
later(function () { r.li.classList.add('is-fixed'); }, 420);
later(function () { r.li.classList.remove('is-fixwait'); }, 820);
}
}, i * STEP);
});
later(function () { printing = false; sec.classList.add('is-read'); }, rows.length * STEP + 1100);
}
function select(id) {
var k = kindOf(id);
cur = k;
if (played) play(k); else { clearTimers(); printing = false; fill(k, true); }
}
chips.forEach(function (c, i) {
c.addEventListener('click', function () { if (cur && cur.id === c.dataset.kind && !printing) return; select(c.dataset.kind); });
c.addEventListener('keydown', function (e) {
var n = chips.length, j = -1;
if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = n - 1;
if (j < 0) return;
e.preventDefault(); chips[j].focus();
});
});
if (seeLink) seeLink.addEventListener('click', function (e) {
var slug = seeLink.dataset.slug;
var el = document.getElementById('work-' + slug) || document.querySelector('#work [data-slug="' + slug + '"]');
if (!el) return;
e.preventDefault(); e.stopPropagation();
ES.scroll.scrollTo(el);
if (history.replaceState) history.replaceState(null, '', '#' + (el.id || 'work'));
}, true);
var initial = (live.dataset.kind && kindOf(live.dataset.kind)) || KINDS[0];
cur = initial;
if (reduced || !('IntersectionObserver' in window)) { played = true; fill(initial, false); }
else {
still(function () { fill(initial, true); });
var io = new IntersectionObserver(function (en) {
if (!en[0].isIntersecting || played) return;
played = true; io.disconnect(); play(cur);
}, { threshold: 0.25 });
io.observe(print);
}
sec.addEventListener('focusin', function (e) { if (played && !sec.classList.contains('is-read') && e.target.closest('.dx__readout')) { clearTimers(); printing = false; fill(cur, false); } });
ES.motion.on(function (r) { if (r) { reduced = true; clearTimers(); printing = false; played = true; fill(cur, false); } });
})();

/* 30-work.js */
(function () {
'use strict';
var ES = window.ES, section = document.getElementById('work');
if (!ES || !section) return;
var html = document.documentElement;
var U = ES.util, clamp = U.clamp;
var reduced = html.dataset.motion === 'reduced';
var shots = Array.prototype.slice.call(section.querySelectorAll('[data-shot]')).map(function (el) {
return {
el: el, rig: el.querySelector('[data-rig]'), drift: el.querySelector('[data-drift]'), desk: el.querySelector('.shot__desk'),
top: 0, h: 1, travel: 0, near: false,
ry: U.smooth(6, -14), px: U.smooth(6, 0), dy: U.smooth(6, 0), lastRy: null, lastPx: null, lastDy: null
};
});
function measure() {
shots.forEach(function (s) {
s.top = U.docTop(s.el); s.h = Math.max(1, s.el.offsetHeight);
var fw = s.desk ? s.desk.offsetWidth : 0, fh = s.desk ? s.desk.offsetHeight : 0;
s.travel = fw > 0 ? clamp(fw * 2.08 - fh, 0, ES.phone() ? 420 : 720) : 0;
});
}
function apply(s, force) {
var ry = Math.round(s.ry.v * 20) / 20, px = Math.round(s.px.v * 5) / 5, dy = Math.round(s.dy.v * 2) / 2;
if (force || ry !== s.lastRy || px !== s.lastPx) { s.lastRy = ry; s.lastPx = px; if (s.rig) { s.rig.style.setProperty('--ry', ry + 'deg'); s.rig.style.setProperty('--px', px + 'px'); } }
if (force || dy !== s.lastDy) { s.lastDy = dy; if (s.drift) s.drift.style.transform = 'translate3d(0,' + (-dy) + 'px,0)'; }
}
function tick(now, dt, y, W, H) {
if (reduced) return false;
var busy = false, amp = ES.phone() ? 6 : 10;
for (var i = 0; i < shots.length; i++) {
var s = shots[i], top = s.top - y, bottom = top + s.h;
var near = bottom > -0.3 * H && top < 1.3 * H;
if (near !== s.near) { s.near = near; s.el.classList.toggle('is-near', near); }
if (!near) continue;
var p = clamp((H - top) / (H + s.h), 0, 1);
s.ry.to(ES.phone() ? (-6 + 12 * p) : (-14 + 20 * p));
s.px.to(-12 + 24 * p);
s.dy.to(s.travel * p);
var a = s.ry.step(dt), b = s.px.step(dt), c = s.dy.step(dt);
if (a || b || c) { busy = true; apply(s, false); }
}
return busy;
}
var stepTiles = Array.prototype.slice.call(section.querySelectorAll('[data-steps]')).map(function (li) {
return { el: li, steps: Array.prototype.slice.call(li.querySelectorAll('.tile__step')), imgs: Array.prototype.slice.call(li.querySelectorAll('img')), i: 0, t: 0 };
});
function setStep(t, i) {
t.i = i;
t.steps.forEach(function (p, k) { p.classList.toggle('is-on', k === i); if (k === i) p.removeAttribute('aria-hidden'); else p.setAttribute('aria-hidden', 'true'); });
}
function startSteps(t) { stopSteps(t); t.imgs.forEach(function (im) { if (im.loading === 'lazy') im.loading = 'eager'; }); t.t = setInterval(function () { if (!document.hidden) setStep(t, (t.i + 1) % t.steps.length); }, 4000); }
function stopSteps(t) { if (t.t) { clearInterval(t.t); t.t = 0; } }
function boot() {
measure();
ES.loop.onMeasure(measure); ES.loop.onResize(function () { measure(); shots.forEach(function (s) { apply(s, true); }); });
if (reduced) { shots.forEach(function (s) { s.ry.jump(-4); s.px.jump(0); s.dy.jump(0); apply(s, true); }); return; }
shots.forEach(function (s) { apply(s, true); });
ES.loop.add(tick);
if ('IntersectionObserver' in window) stepTiles.forEach(function (t) {
if (t.steps.length < 2) return;
new IntersectionObserver(function (en) { if (en[0].isIntersecting) startSteps(t); else stopSteps(t); }, { threshold: 0.2 }).observe(t.el);
});
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
ES.motion.on(function (r) {
if (!r) return;
reduced = true;
shots.forEach(function (s) { s.ry.jump(-4); s.px.jump(0); s.dy.jump(0); apply(s, true); s.el.classList.remove('is-near'); });
stepTiles.forEach(function (t) { stopSteps(t); setStep(t, 0); });
});
})();

/* 40-apps.js */
(function () {
'use strict';
var ES = window.ES, sec = document.getElementById('apps');
if (!ES || !sec) return;
var html = document.documentElement;
if (html.dataset.motion === 'reduced' || html.dataset.input !== 'fine') return;
var U = ES.util;
var cuts = Array.prototype.slice.call(sec.querySelectorAll('.cut[data-layer]')).map(function (li) { return { el: li.querySelector('.cut__par') || li, amp: 4 * (parseInt(li.dataset.layer, 10) || 1) }; });
var px = U.smooth(2.5, 0), py = U.smooth(2.5, 0), onScreen = false, lastKey = '';
if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (onScreen) ES.loop.wake(); }, { threshold: 0.05 }).observe(sec);
ES.loop.add(function (now, dt) {
if (!onScreen || html.dataset.motion === 'reduced') return false;
px.to(ES.pointer.x); py.to(ES.pointer.y);
var a = px.step(dt), b = py.step(dt);
var key = px.v.toFixed(2) + ',' + py.v.toFixed(2);
if (key !== lastKey) {
lastKey = key;
for (var i = 0; i < cuts.length; i++) cuts[i].el.style.transform = 'translate3d(' + (px.v * cuts[i].amp).toFixed(1) + 'px,' + (py.v * cuts[i].amp * 0.7).toFixed(1) + 'px,0)';
}
return a || b;
});
ES.motion.on(function (r) { if (r) cuts.forEach(function (c) { c.el.style.transform = ''; }); });
})();

/* 41-systems.js */
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
panels.forEach(function (P) {
if (!P.card) return;
function decide(msg) { P.card.classList.add('is-decided'); P.status.textContent = msg; }
P.card.querySelector('[data-approve]').addEventListener('click', function () { decide('Approved · flats promotion goes live Friday 9:00'); });
P.card.querySelector('[data-hold]').addEventListener('click', function () { decide('On hold · Jarvis asks again tomorrow 9:00'); });
});
if (reduced || !('IntersectionObserver' in window)) { panels.forEach(function (P) { P.el.classList.add('is-run'); }); return; }
panels.forEach(function (P) { P.rows.forEach(function (r, i) { r.style.setProperty('--r', i); }); });
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
panels.forEach(function (P) { still(P, function () { pre(P); }); });
panels.forEach(function (P) {
P.el.addEventListener('focusin', function () { if (!P.ran) { P.el.classList.add('is-quick'); run(P); } });
new IntersectionObserver(function (en) { if (en[0].isIntersecting) run(P); }, { threshold: 0.3 }).observe(P.el);
new IntersectionObserver(function (en) { if (!en[0].isIntersecting) rearm(P); }, { threshold: 0 }).observe(P.el);
});
ES.motion.on(function (r) {
if (!r) return;
panels.forEach(function (P) { P.t.forEach(clearTimeout); P.t.length = 0; P.ran = true; still(P, function () { final(P); }); });
});
})();

/* 50-contact.js */
(function () {
'use strict';
var ES = window.ES, sec = document.getElementById('contact');
if (!ES || !sec) return;
var html = document.documentElement;
var reduced = html.dataset.motion === 'reduced';
var $ = function (id) { return document.getElementById(id); };
var num = $('contact-number'), copyBtn = $('contact-copy'), copyLabel = $('contact-copy-label'), copied = $('contact-copied');
var NUMBER = '313-300-6898';
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

/* 52-chrome.js */
(function () {
'use strict';
var ES = window.ES; if (!ES) return;
var html = document.documentElement;
var reduced = html.dataset.motion === 'reduced';
var coarse = html.dataset.input !== 'fine';
var ticking = false, lastY = window.pageYOffset, downAcc = 0, upAcc = 0, hidden = false;
function setHidden(h) { if (h === hidden) return; hidden = h; ES.chrome.topbar(!h); }
function tick() {
ticking = false;
var y = window.pageYOffset, H = window.innerHeight;
var scrolled = y > 24;
if ((html.dataset.scrolled === '1') !== scrolled) { if (scrolled) html.dataset.scrolled = '1'; else delete html.dataset.scrolled; }
if (!coarse || reduced) return;
var d = y - lastY; lastY = y;
if (d > 0) { downAcc += d; upAcc = 0; } else if (d < 0) { upAcc -= d; downAcc = 0; }
var inNumber = html.dataset.numberview === '1';
var nearBottom = y + H >= (document.documentElement.scrollHeight - 4);
if (y < H * 1.15 || inNumber || nearBottom) { setHidden(false); downAcc = 0; upAcc = 0; return; }
if (!hidden && downAcc > 72) setHidden(true);
else if (hidden && upAcc > 14) setHidden(false);
}
function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
window.addEventListener('scroll', onScroll, { passive: true });
tick();
var targets = [document.getElementById('contact-number'), document.getElementById('contact-cta')].filter(Boolean);
if (coarse && targets.length && 'IntersectionObserver' in window) {
var flags = targets.map(function () { return false; });
var io = new IntersectionObserver(function (entries) {
for (var i = 0; i < entries.length; i++) { var k = targets.indexOf(entries[i].target); if (k > -1) flags[k] = entries[i].isIntersecting; }
var any = false; for (var j = 0; j < flags.length; j++) if (flags[j]) any = true;
if (any) { html.dataset.numberview = '1'; setHidden(false); } else delete html.dataset.numberview;
if (ES.scroll && ES.scroll.updateBottombar) ES.scroll.updateBottombar();
}, { threshold: 0 });
for (var t = 0; t < targets.length; t++) io.observe(targets[t]);
}
ES.motion.on(function (r) { if (r) { reduced = true; setHidden(false); } });
})();
