// Renders poster stills FROM the world (canvas only, DOM hidden) for: the hero LCP poster, the reduced-motion /
// no-WebGL stacked layout, and the OG image. Desktop 1600×900 and mobile 390×780 @2x. Re-run after visual changes.
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const ONLY = process.argv[2] ? process.argv[2].split(',') : null;
const scenesAll = [['entry', '0'], ['bakery', 'hold:bakery'], ['barber', 'hold:barber'], ['popup', 'hold:popup'], ['cafe', 'hold:cafe'],
  ['funpark', 'hold:funpark'], ['billboard', 'hold:billboard'], ['mall', 'hold:mall'], ['collection', 'mid:collection'], ['commerce', 'hold:commerce']];
const scenes = ONLY ? scenesAll.filter(([n]) => ONLY.includes(n)) : scenesAll;
fs.mkdirSync('.creative-web/posters-raw', { recursive: true });
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [suffix, vp, dpr, mobile] of [['d', { width: 1600, height: 900 }, 1, false], ['m', { width: 390, height: 780 }, 2, true]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.goto(`${process.env.URL || 'http://127.0.0.1:3002/'}?nointro&tier=${mobile ? 'low' : 'high'}`, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '.nav,.scene-inner>*:not(.scene-poster),.routestrip,.stage-scrim,.stage-poster,.lb,.grain{visibility:hidden!important} .stage::after{display:none}' });
  await p.waitForTimeout(3500);
  for (const [name, stop] of scenes) {
    await p.evaluate((vv) => {
      const { tl } = window.__route313; const t = document.querySelector('.drive-track'); const span = t.offsetHeight - innerHeight;
      let pp = Number(vv);
      if (Number.isNaN(pp)) { const [k, id] = vv.split(':'); const s = tl.scenes.find((x) => x.id === id); pp = k === 'hold' ? (s.brakeP ? (s.brakeP + s.holdP) / 2 : s.p0 + (s.p1 - s.p0) * 0.75) : (s.p0 + s.p1) / 2; }
      scrollTo(0, t.offsetTop + pp * span);
    }, stop);
    await p.waitForTimeout(2600);
    await p.screenshot({ path: `.creative-web/posters-raw/${name}-${suffix}.png` });
    process.stdout.write(`${name}-${suffix} `);
  }
  await ctx.close();
}
await b.close();
console.log('\nrendered');
