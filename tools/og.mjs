// Share image: the hub (Websites preview), 1200x630 → public/brand/og.jpg
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1600, height: 840 }, deviceScaleFactor: 1.5 });
await p.goto('http://localhost:3030/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await p.mouse.wheel(0, 120);
await p.waitForTimeout(3600);
await p.mouse.move(5, 835);
await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
await p.waitForTimeout(900);
await p.screenshot({ path: '.captures/og.png' });
await b.close();
execFileSync('npx', ['--yes', 'sharp-cli', '-i', '.captures/og.png', '-o', 'public/brand/og.jpg', '-f', 'jpeg', '-q', '84', 'resize', '1200', '630'], { stdio: 'inherit', shell: true });
