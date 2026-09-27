// Frames for sites whose best views sit behind a click (split landings, menus): landing, then each clicked view.
// usage: node tools/capture-frames.mjs <slug> <url> "<button text 1>" "<button text 2>"  → .captures/<slug>/{d,m}-f{0..2}.png
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [slug, url, ...clicks] = process.argv.slice(2);
fs.mkdirSync(`.captures/${slug}`, { recursive: true });
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const [kind, vp, dpr, mobile] of [['d', { width: 1440, height: 900 }, 2, false], ['m', { width: 390, height: 844 }, 3, true]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `.captures/${slug}/${kind}-f0.png` });
  let i = 1;
  for (const text of clicks) {
    await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    const el = p.getByText(text, { exact: false }).locator('visible=true').first();
    await el.scrollIntoViewIfNeeded(); await el.click({ timeout: 15000 });
    await p.waitForTimeout(2200);
    await p.evaluate(() => scrollBy(0, innerHeight * 0.35)); await p.waitForTimeout(1200);
    await p.screenshot({ path: `.captures/${slug}/${kind}-f${i++}.png` });
    console.log(slug, kind, text, p.url());
  }
  await ctx.close();
}
await b.close();
