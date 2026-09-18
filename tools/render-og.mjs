// OG share image (1200×630): the entry poster (rendered from the world) + the owner's line + mark.
import { chromium } from 'file:///C:/Users/hafez/creative-web-os/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const poster = 'data:image/webp;base64,' + fs.readFileSync('assets/posters/entry-d.webp').toString('base64');
const mark = 'data:image/svg+xml;base64,' + fs.readFileSync('assets/brand/es-mark-reversed.svg').toString('base64');
const font = 'data:font/woff2;base64,' + fs.readFileSync('assets/fonts/overpass-var-latin.woff2').toString('base64');
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(`<!doctype html><style>@font-face{font-family:O;src:url(${font}) format('woff2');font-weight:100 900}
body{margin:0;width:1200px;height:630px;overflow:hidden;background:#050B16 url(${poster}) 62% 50%/cover;font-family:O;color:#F2EFE8}
.s{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,11,22,.9) 0%,rgba(5,11,22,.55) 45%,rgba(5,11,22,0) 70%)}
h1{position:absolute;left:64px;top:170px;margin:0;font-size:66px;font-weight:850;line-height:.98;letter-spacing:-.025em;width:640px}
h1 em{font-style:normal;color:#F4CD72}
img{position:absolute;left:64px;top:64px;width:92px;filter:brightness(1.1)}
p{position:absolute;left:64px;bottom:58px;margin:0;font-size:20px;font-weight:700;letter-spacing:.02em;color:#E3A02A}
</style><div class="s"></div><img src="${mark}"><h1>Most businesses don't have a traffic problem. They have a <em>system</em> problem.</h1><p>ElaSystems&nbsp;&nbsp;·&nbsp;&nbsp;Websites, apps &amp; advertising&nbsp;&nbsp;·&nbsp;&nbsp;Detroit&nbsp;&nbsp;·&nbsp;&nbsp;313-300-6898</p>`, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: 'assets/brand/og.png' });
await b.close();
