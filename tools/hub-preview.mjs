// Renders the hub window (Websites preview) to public/brand/hub-preview.webp: the backs of the opening tiles.
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
await p.goto('http://localhost:3030/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await p.mouse.wheel(0, 120);
await p.waitForTimeout(3600);
await p.mouse.move(5, 895);
await p.addStyleTag({ content: '.panel{clip-path:none!important}.pv-cap,.gate,.slash,.hub-ui,.topbar{visibility:hidden!important}' });
await p.waitForTimeout(900);
await p.locator('.panel').screenshot({ path: '.captures/hub-preview.png' });
await b.close();
execFileSync('npx', ['--yes', 'sharp-cli', '-i', '.captures/hub-preview.png', '-o', 'public/brand/hub-preview.webp', '-f', 'webp', '-q', '78'], { stdio: 'inherit', shell: true });
