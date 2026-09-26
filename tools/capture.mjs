// Capture live client work (public pages only) for the flagship: desktop 1440x900 @2x (first viewport + tall
// 1440x3600) and mobile 390x844 @3x (first viewport + tall 390x2600). Output: .captures/<slug>/ (gitignored).
// usage: node tools/capture.mjs [slug ...]
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const SITES = {
  'fudge-fix': 'https://the-fudge-fix.vercel.app/',
  'rise': 'https://rise-iia-site.vercel.app/',
  'rise-perk': 'https://rise-iia-site-1.vercel.app/',
  'snug-mug': 'https://thesnugmugbyally.com/',
  'dmoda-shoes': 'https://dmodashoes.com/',
  'family-bakery': 'https://familybakerydetroit.com/',
  'bounce-it-up': 'https://bounceituplivonia.com/',
  'bounce-dashboard': 'https://bounceituplivonia.com/dashboard',
  '313-apparel': 'https://313apparelmi.com/',
  'big-wiss': 'https://bigwissmatcha.com/',
  'creative-style': 'https://creativestylewiss.com/',
};
const want = process.argv.slice(2);
const list = Object.entries(SITES).filter(([s]) => !want.length || want.includes(s));
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });

async function settle(p) {
  await p.evaluate(() => document.fonts && document.fonts.ready);
  // close first-visit promos with their non-committal buttons; never accept anything
  for (const t of ['Maybe later', 'Keep browsing', 'No thanks', 'Close', 'Decline', 'Reject']) {
    const el = p.getByRole('button', { name: t, exact: false }).first();
    if (await el.count().catch(() => 0)) await el.click({ timeout: 800 }).catch(() => {});
  }
  // walk the page so lazy images and reveal animations fire, then return to the top
  await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); } scrollTo(0, 0); });
  await p.waitForTimeout(1500);
}

for (const [slug, url] of list) {
  const dir = `.captures/${slug}`; fs.mkdirSync(dir, { recursive: true });
  for (const [kind, vp, dpr, tall, mobile] of [['d', { width: 1440, height: 900 }, 2, 3600, false], ['m', { width: 390, height: 844 }, 3, 2600, true]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
    const p = await ctx.newPage();
    try {
      await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await settle(p);
      await p.screenshot({ path: `${dir}/${kind}.png` });
      await p.setViewportSize({ width: vp.width, height: tall });
      await p.waitForTimeout(1200);
      await p.screenshot({ path: `${dir}/${kind}-tall.png` });
      const meta = await p.evaluate(() => ({ title: document.title, h1: document.querySelector('h1')?.textContent?.trim().slice(0, 120), font: getComputedStyle(document.querySelector('h1') || document.body).fontFamily }));
      fs.writeFileSync(`${dir}/${kind}.json`, JSON.stringify({ url, ...meta }, null, 2));
      console.log(slug, kind, 'ok', meta.title);
    } catch (e) { console.log(slug, kind, 'FAILED', e.message.slice(0, 120)); }
    await ctx.close();
  }
}
await b.close();
