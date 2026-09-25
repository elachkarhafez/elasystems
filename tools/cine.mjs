// Cinematic capture: the opening crane over time, frames while driving (speed effects are live only in motion),
// and settled holds at stops. usage: node tools/cine.mjs <label> <w> <h> [plan]
//   plan items: "t:<sec>" = screenshot at time after load · "drive:<scene>" = scroll smoothly toward <scene>'s hold,
//   shooting mid-drive · "hold:<scene>" / "mid:<scene>" / "<p>" = settle there and shoot.
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [label = 'cine', w = '1440', h = '900', plan = 't:0.6,t:1.8,t:3.2,t:5.5,drive:bakery,hold:bakery,drive:barber,hold:barber'] = process.argv.slice(2);
const base = process.env.URL || 'http://127.0.0.1:3006/';
const out = `.creative-web/qa/${label}`; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const mobile = +w < 900;
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
const p = await ctx.newPage();
const logs = [];
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`.slice(0, 300)); });
p.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`.slice(0, 300)));
p.on('response', (r) => { if (r.status() >= 400) logs.push(`[${r.status()}] ${r.url()}`); });
const t0 = Date.now();
await p.goto(base + (process.env.Q || ''), { waitUntil: 'domcontentloaded' });
if (mobile) { await p.waitForTimeout(600); await p.mouse.click(5, 300).catch(() => {}); }
await p.waitForFunction(() => document.querySelector('.stage')?.classList.contains('is-live'), null, { timeout: 30000 }).catch(() => logs.push('never live'));
const liveAt = (Date.now() - t0) / 1000;
const yFor = (v) => p.evaluate((vv) => {
  const { tl } = window.__route313; const t = document.querySelector('.drive-track'); const span = t.offsetHeight - innerHeight;
  let pp = Number(vv);
  if (Number.isNaN(pp)) { const [k, id] = vv.split(':'); const s = tl.scenes.find((x) => x.id === id);
    pp = k === 'at' ? s.p0 + (s.p1 - s.p0) * Number(vv.split(':')[2]) : k === 'hold' ? (s.brakeP ? (s.brakeP + s.holdP) / 2 : s.p0 + (s.p1 - s.p0) * 0.6) : k === 'brake' ? (s.brakeP ?? s.p0) : (s.p0 + s.p1) / 2; }
  return t.offsetTop + pp * span;
}, v);
let n = 0;
const shot = async (name) => p.screenshot({ path: `${out}/${String(n++).padStart(2, '0')}-${name.replace(/[.:]/g, '_')}.png` });
const liveT = Date.now();
for (const item of plan.split(',')) {
  if (item.startsWith('t:')) {
    const wait = +item.slice(2) * 1000 - (Date.now() - liveT);
    if (wait > 0) await p.waitForTimeout(wait);
    await shot(item);
  } else if (item.startsWith('drive:')) {
    const target = await yFor('hold:' + item.slice(6));
    const from = await p.evaluate(() => scrollY);
    const steps = 70;
    for (let i = 1; i <= steps; i++) {
      await p.evaluate((y) => scrollTo(0, y), from + ((target - from) * i) / steps);
      await p.waitForTimeout(24);
      if (i === Math.round(steps * 0.45)) await shot(item + '-mid');
    }
  } else {
    await p.evaluate((y) => scrollTo(0, y), await yFor(item));
    await p.waitForTimeout(2600);
    await shot(item);
  }
}
console.log(JSON.stringify({ liveAt, cls: await p.evaluate(() => document.documentElement.className) }));
console.log(logs.slice(0, 20).join('\n') || 'no console errors');
await b.close();
