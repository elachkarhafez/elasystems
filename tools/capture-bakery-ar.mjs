// Captures the Arabic (RTL) version of familybakerydetroit.com (the site's own ع toggle) for the bakery world window.
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const [vp, size, mobile, tall] of [['desktop', { width: 1440, height: 900 }, false, 1800], ['mobile', { width: 390, height: 844 }, true, 844]]) {
  const ctx = await b.newContext({ viewport: size, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.goto('https://familybakerydetroit.com', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const t = p.getByText('ع', { exact: true });
  const n = await t.count();
  for (let i = 0; i < n; i++) { if (await t.nth(i).isVisible()) { await t.nth(i).click(); break; } }
  await p.waitForTimeout(1500);
  for (let y = 0; y < tall + 900; y += 450) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(150); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1500);
  console.log(vp, 'dir', await p.evaluate(() => document.documentElement.dir));
  await p.screenshot({ path: `.creative-web/research/family-bakery-detroit-ar-${vp}.png`, fullPage: vp === 'desktop', clip: vp === 'desktop' ? { x: 0, y: 0, width: 1440, height: tall } : undefined });
  await ctx.close();
}
await b.close();
