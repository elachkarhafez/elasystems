import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const [name, vp, mobile] of [['d', { width: 1440, height: 900 }, false], ['m', { width: 390, height: 844 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, reducedMotion: 'reduce', isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://127.0.0.1:3002/', { waitUntil: 'networkidle' });
  for (let y = 0; y < 30000; y += 700) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(40); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600);
  const info = await p.evaluate(() => ({ cls: document.documentElement.className, h: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth > innerWidth }));
  await p.screenshot({ path: `.creative-web/qa/static-${name}.png`, fullPage: true });
  console.log(name, JSON.stringify(info), errs.length ? errs.join(' | ') : 'no errors');
  await ctx.close();
}
await b.close();
