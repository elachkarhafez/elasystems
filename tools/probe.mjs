// Dev probe: load the page, report console errors, and screenshot a few progress points.
// usage: node tools/probe.mjs "<query>" <w> <h> <label> <p1,p2,...>
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [q = '', w = '1440', h = '900', label = 'probe', ps = '0'] = process.argv.slice(2);
const out = `.creative-web/qa/${label}`; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const mobile = +w < 900;
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
const p = await ctx.newPage();
const logs = [];
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`.slice(0, 400)); });
p.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`.slice(0, 400)));
p.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url()}`));
p.on('response', (r) => { if (r.status() >= 400) logs.push(`[${r.status()}] ${r.url()}`); });
await p.goto(`http://127.0.0.1:3002/${q}`, { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
// stops: numbers are progress 0..1; "hold:<scene>", "brake:<scene>", "mid:<scene>" resolve from the live timeline
for (const v of ps.split(',')) {
  await p.evaluate((vv) => {
    const { tl } = window.__route313; const t = document.querySelector('.drive-track'); const span = t.offsetHeight - innerHeight;
    let pp = Number(vv);
    if (Number.isNaN(pp)) { const [k, id] = vv.split(':'); const s = tl.scenes.find((x) => x.id === id);
      pp = k === 'hold' ? (s.brakeP ? (s.brakeP + s.holdP) / 2 : s.p0 + (s.p1 - s.p0) * 0.6) : k === 'brake' ? (s.brakeP ?? s.p0) : k === 'start' ? s.p0 + 0.001 : (s.p0 + s.p1) / 2; }
    scrollTo(0, t.offsetTop + pp * span);
  }, v);
  await p.waitForTimeout(1700);
  await p.screenshot({ path: `${out}/${v.replace(/[.:]/g, '_')}.png` });
}
const info = await p.evaluate(() => ({ cls: document.documentElement.className, live: document.querySelector('.stage')?.classList.contains('is-live'), track: document.querySelector('.drive-track')?.offsetHeight }));
console.log(JSON.stringify(info));
console.log(logs.slice(0, 30).join('\n') || 'no console errors');
await b.close();
