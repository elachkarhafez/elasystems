// Scroll-story sites (pinned, scroll-driven) can't be captured as one tall page. Capture what a visitor sees at
// successive scroll depths instead and stack those screens into a strip: .captures/<slug>/{d,m}-story.png
// usage: node tools/capture-story.mjs <slug> <url> [frames=5]
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/hafez/creative-web-os/noop.js');
const sharp = require('sharp');

const [slug, url, n = '5'] = process.argv.slice(2);
const frames = +n;
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const [kind, vp, dpr, mobile] of [['d', { width: 1440, height: 900 }, 2, false], ['m', { width: 390, height: 844 }, 3, true]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await p.evaluate(() => document.fonts && document.fonts.ready);
  await p.waitForTimeout(1500);
  const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const shots = [];
  for (let i = 0; i < frames; i++) {
    const y = Math.round((H * i) / (frames - 1));
    // scroll in steps so scroll-driven scenes update like a real scroll
    const from = await p.evaluate(() => scrollY);
    for (let k = 1; k <= 12; k++) { await p.evaluate((yy) => scrollTo(0, yy), from + ((y - from) * k) / 12); await p.waitForTimeout(40); }
    await p.waitForTimeout(1300);
    shots.push(await p.screenshot());
  }
  const W = vp.width * dpr, Hh = vp.height * dpr;
  await sharp({ create: { width: W, height: Hh * frames, channels: 3, background: '#000' } })
    .composite(shots.map((buf, i) => ({ input: buf, top: i * Hh, left: 0 })))
    .png().toFile(`.captures/${slug}/${kind}-story.png`);
  console.log(slug, kind, frames, 'frames, page height', H);
  await ctx.close();
}
await b.close();
