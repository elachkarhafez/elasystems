// Converts storyboard progress labels into creative-web-qa page-percent stops for a given viewport.
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
const [q = '', ...vps] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const vp of vps) {
  const [w, h] = vp.split('x').map(Number);
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: w < 900, hasTouch: w < 900 });
  await p.goto(`http://127.0.0.1:3002/${q}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => {
    const { tl } = window.__route313; const t = document.querySelector('.drive-track');
    const span = t.offsetHeight - innerHeight, max = document.documentElement.scrollHeight - innerHeight;
    const pct = (pp) => +(((t.offsetTop + pp * span) / max) * 100).toFixed(2);
    const out = {};
    for (const s of tl.scenes) { out[s.id + '.start'] = pct(s.p0 + 0.002); if (s.brakeP) { out[s.id + '.brake'] = pct(s.brakeP); out[s.id + '.hold'] = pct((s.brakeP + s.holdP) / 2); } out[s.id + '.mid'] = pct((s.p0 + s.p1) / 2); }
    out['services'] = pct(1) + 2; return out;
  });
  console.log(vp, JSON.stringify(r));
  await p.close();
}
await b.close();
