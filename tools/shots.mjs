// Flagship captures. node tools/shots.mjs <label> <w> <h> "<plan>" [--reduced]
// plan (comma separated): esc · click:<selector> · burst:<n> (a shot every ~120ms) · intro · open:<ms> (start the opening, shoot after ms) · wait:<ms> · hover:<0|1|2> ·
// enter:<world> (click its gateway, shoot after the zoom) · y:<fraction of world scroll> · px:<y> · back · shot:<name>
// Output: .captures/qa/<label>/NN-<item>.png ; console errors are printed.
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const args = process.argv.slice(2);
const reduced = args.includes('--reduced');
const [label, w = '1440', h = '900', plan = 'intro'] = args.filter((a) => !a.startsWith('--'));
const base = process.env.URL || 'http://127.0.0.1:3030/';
const out = `.captures/qa/${label}`; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=d3d11', '--enable-gpu'] });
const mobile = +w < 900;
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, reducedMotion: reduced ? 'reduce' : 'no-preference' });
const p = await ctx.newPage();
const logs = [];
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`.slice(0, 300)); });
p.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`.slice(0, 300)));
p.on('response', (r) => { if (r.status() >= 400) logs.push(`[${r.status()}] ${r.url()}`); });
await p.goto(base + (process.env.HASH || ''), { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(1200);
let n = 0;
const shot = (name) => p.screenshot({ path: `${out}/${String(n++).padStart(2, '0')}-${name.replace(/[:.#/]/g, '_')}.png` });
const scrollTo = async (y) => {
  const from = await p.evaluate(() => scrollY);
  const steps = Math.max(1, Math.min(40, Math.round(Math.abs(y - from) / 160)));
  for (let i = 1; i <= steps; i++) { await p.mouse.wheel(0, (y - from) / steps); await p.waitForTimeout(30); }
  await p.waitForTimeout(1300);
};
for (const item of plan.split(',')) {
  const [k, v] = [item.split(':')[0], item.split(':').slice(1).join(':')];
  if (k === 'intro') { await shot('intro'); continue; }
  if (k === 'open') { await p.mouse.wheel(0, 120); await p.waitForTimeout(+v || 400); await shot(`open-${v}`); continue; }
  if (k === 'wait') { await p.waitForTimeout(+v); await shot(`wait-${v}`); continue; }
  if (k === 'hover') { const g = p.locator('.gate').nth(+v); const bx = await g.boundingBox(); await p.mouse.move(bx.x + bx.width * 0.5, bx.y + bx.height * 0.5); await p.waitForTimeout(900); await shot(`hover-${v}`); continue; }
  if (k === 'enter') {
    if (v === 'contact') await p.locator('.hub-contact').click(); else await p.locator(`.gate-${['websites', 'apps', 'systems'].indexOf(v)}`).click();
    await p.waitForTimeout(450); await shot(`zoom-${v}`); await p.waitForTimeout(1600); await shot(`in-${v}`); continue;
  }
  if (k === 'y') { const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight); await scrollTo(Math.round(H * +v)); await shot(`y-${v}`); continue; }
  if (k === 'px') { await scrollTo(+v); await shot(`px-${v}`); continue; }
  if (k === 'esc') { await p.keyboard.press('Escape'); continue; }
  if (k === 'click') { await p.locator(v).first().click(); continue; }
  if (k === 'burst') { for (let i = 0; i < +v; i++) { await p.waitForTimeout(120); await shot(`burst-${i}`); } continue; }
  if (k === 'back') { await p.locator('.w-back').last().scrollIntoViewIfNeeded().catch(() => {}); await p.goBack(); await p.waitForTimeout(500); await shot('back-mid'); await p.waitForTimeout(1400); await shot('back'); continue; }
}
console.log(JSON.stringify(await p.evaluate(() => ({ phase: document.documentElement.dataset.phase, world: document.documentElement.dataset.world, H: document.documentElement.scrollHeight, ovf: document.documentElement.scrollWidth - innerWidth }))));
console.log(logs.slice(0, 25).join('\n') || 'no console errors');
await b.close();
