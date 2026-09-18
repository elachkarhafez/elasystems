import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
const [w = '390', h = '844', rate = '4'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const mobile = +w < 900;
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: +rate });
await p.goto('http://127.0.0.1:3002/', { waitUntil: 'load' });
await p.waitForTimeout(9000);
const r = await p.evaluate(() => {
  const m = performance.getEntriesByType('mark').filter((x) => x.name.startsWith('r313:'));
  const paint = performance.getEntriesByType('paint').map((x) => `${x.name} ${Math.round(x.startTime)}`);
  let prev = 0; return { marks: m.map((x) => { const d = Math.round(x.startTime - prev); prev = x.startTime; return `${x.name.slice(5)} @${Math.round(x.startTime)} (+${d})`; }), paint };
});
console.log(r.paint.join(' | ')); console.log(r.marks.join('\n'));
await b.close();
