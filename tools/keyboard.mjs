import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=d3d11'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://127.0.0.1:3002/', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const rows = [];
for (let i = 0; i < 22; i++) {
  await p.keyboard.press('Tab');
  await p.waitForTimeout(450);
  rows.push(await p.evaluate(() => {
    const a = document.activeElement; const r = a.getBoundingClientRect();
    const sc = a.closest('.scene'); const o = sc ? getComputedStyle(sc.querySelector('.stop,.hero,.collection,.commerce') || sc).opacity : '1';
    return `${(a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 38).padEnd(40)} inView=${r.top >= 0 && r.bottom <= innerHeight} opacity=${(+o).toFixed(2)}`;
  }));
}
console.log(rows.join('\n'));
await b.close();
