// Release checks for the cinematic pass: reverse-scroll parity, frame time while driving, static mode, overflow, errors.
// usage: URL=http://127.0.0.1:3006/ node tools/verify-cine.mjs
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const base = process.env.URL || 'http://127.0.0.1:3006/';
const out = '.creative-web/qa/verify'; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const report = {};
for (const [name, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const mobile = w < 900;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
  await p.goto(base + '?nointro', { waitUntil: 'networkidle' });
  if (mobile) await p.mouse.click(5, 300);
  await p.waitForFunction(() => document.querySelector('.stage')?.classList.contains('is-live'), null, { timeout: 30000 });
  const y = (id) => p.evaluate((i) => { const { tl } = window.__route313; const t = document.querySelector('.drive-track'); const s = tl.scenes.find((x) => x.id === i); return t.offsetTop + ((s.brakeP + s.holdP) / 2) * (t.offsetHeight - innerHeight); }, id);
  const go = async (id) => { await p.evaluate((yy) => scrollTo(0, yy), await y(id)); await p.waitForTimeout(3000); };
  await go('barber'); const fwd = await p.screenshot({ path: `${out}/${name}-barber-fwd.png` });
  // frame time while driving barber → funpark
  const from = await y('barber'), to = await y('funpark');
  const ft = await p.evaluate(async ([a, z]) => {
    const times = []; let last = performance.now();
    await new Promise((res) => { let i = 0; const step = () => { const now = performance.now(); times.push(now - last); last = now; scrollTo(0, a + (z - a) * (i / 180)); if (++i > 180) res(); else requestAnimationFrame(step); }; requestAnimationFrame(step); });
    times.sort((x, y) => x - y); return { median: times[times.length >> 1].toFixed(1), p95: times[Math.floor(times.length * 0.95)].toFixed(1) };
  }, [from, to]);
  await p.waitForTimeout(1500);
  await go('barber'); const rev = await p.screenshot({ path: `${out}/${name}-barber-rev.png` });
  const ovf = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  report[name] = { frameMs: ft, overflow: ovf, errors: errs.slice(0, 5), fwdBytes: fwd.length, revBytes: rev.length };
  await ctx.close();
  // reduced motion → static
  const c2 = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
  const p2 = await c2.newPage(); const e2 = [];
  p2.on('pageerror', (e) => e2.push(e.message)); p2.on('response', (r) => { if (r.status() >= 400) e2.push(`${r.status()} ${r.url()}`); });
  await p2.goto(base, { waitUntil: 'networkidle' });
  await p2.screenshot({ path: `${out}/${name}-static-top.png` });
  await p2.evaluate(() => scrollTo(0, document.getElementById('stop-barber').getBoundingClientRect().top + scrollY - 100));
  await p2.waitForTimeout(600);
  await p2.screenshot({ path: `${out}/${name}-static-barber.png` });
  report[name].static = { cls: await p2.evaluate(() => document.documentElement.className), overflow: await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth), errors: e2 };
  await c2.close();
}
console.log(JSON.stringify(report, null, 1));
await b.close();
