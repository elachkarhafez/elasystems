import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
await p.goto('http://127.0.0.1:3002/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
const r = await p.evaluate(() => {
  const W = document.documentElement.clientWidth; const out = [];
  for (const el of document.querySelectorAll('body *')) { const b = el.getBoundingClientRect(); if (b.right > W + 1 && b.width > 0) out.push(`${el.tagName}.${[...el.classList].join('.')} right=${Math.round(b.right)} w=${Math.round(b.width)}`); }
  return { W, sw: document.documentElement.scrollWidth, out: out.slice(0, 15) };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
