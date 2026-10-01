#!/usr/bin/env node
// Zero-dependency site assembler.
//   node tools/build.mjs            → writes index.html, css/site.css, js/site.js at the repo root
//   node tools/build.mjs --out DIR  → writes the same three files into DIR (for isolated testing), leaving the repo untouched
//   node tools/build.mjs --pretty   → keep comments and indentation in the generated css/js (default: stripped)
//
// Sources (edit these, never the generated files):
//   src/index.template.html   the document; `<!-- @partial name -->` is replaced by src/partials/<name>.html
//   src/partials/*.html       one file per section
//   src/css/NN-*.css          concatenated in filename order → css/site.css
//   src/js/NN-*.js            concatenated in filename order → js/site.js   (each file is its own IIFE; shared API on window.ES)
//
// The strip is deliberately conservative (no parser, nothing semantic): comments and indentation only, line structure
// kept, so the generated files stay diffable and the sources need no special care beyond "no multi-line template
// literals that start a line with // or /*".
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outIdx = process.argv.indexOf('--out');
const OUT = outIdx > -1 ? path.resolve(process.argv[outIdx + 1]) : ROOT;
const PRETTY = process.argv.includes('--pretty');

const read = (p) => fs.readFileSync(p, 'utf8');
const list = (dir, ext) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(ext)).sort().map(f => path.join(dir, f)) : [];

// comments + indentation out, line structure kept
function stripCSS(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}
function stripJS(s) {
  const out = []; let inBlock = false;
  for (const line of s.split('\n')) {
    let t = line.trim();
    if (inBlock) { const i = t.indexOf('*/'); if (i < 0) continue; inBlock = false; t = t.slice(i + 2).trim(); if (!t) continue; }
    if (t.startsWith('//')) continue;
    if (t.startsWith('/*')) { const i = t.indexOf('*/'); if (i < 0) { inBlock = true; continue; } t = t.slice(i + 2).trim(); if (!t) continue; }
    t = t.replace(/\s*\/\*[^*\n]*\*\/\s*$/, '');   // a trailing `/* note */`
    if (t) out.push(t);
  }
  return out.join('\n');
}

// 1. HTML
let html = read(path.join(ROOT, 'src/index.template.html'));
const missing = [];
html = html.replace(/<!--\s*@partial\s+([\w-]+)\s*-->/g, (_, name) => {
  const p = path.join(ROOT, 'src/partials', name + '.html');
  if (!fs.existsSync(p)) { missing.push(name); return `<!-- missing partial: ${name} -->`; }
  return read(p).trim();
});

// 2. CSS
const css = list(path.join(ROOT, 'src/css'), '.css').map(p => {
  const src = read(p).trim();
  return PRETTY ? `/* ---- ${path.basename(p)} ---- */\n${src}\n` : `/* ${path.basename(p)} */\n${stripCSS(src)}\n`;
}).join('\n');

// 3. JS
const js = list(path.join(ROOT, 'src/js'), '.js').map(p => {
  const src = read(p).trim();
  return PRETTY ? `/* ---- ${path.basename(p)} ---- */\n${src}\n` : `/* ${path.basename(p)} */\n${stripJS(src)}\n`;
}).join('\n');

fs.mkdirSync(path.join(OUT, 'css'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.writeFileSync(path.join(OUT, 'css/site.css'), css);
fs.writeFileSync(path.join(OUT, 'js/site.js'), js);

// 4. When building into another directory, link the static asset folders so the page works from there too.
if (OUT !== ROOT) {
  for (const d of ['brand', 'work', 'apps', 'fonts', 'js/vendor']) {
    const src = path.join(ROOT, d), dst = path.join(OUT, d);
    if (!fs.existsSync(src)) continue;
    fs.rmSync(dst, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.symlinkSync(src, dst, 'dir');
  }
  for (const f of ['404.html', 'favicon.ico']) if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
}
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1) + 'KB';
console.log(`built → ${OUT}  index.html ${kb(html)}  site.css ${kb(css)}  site.js ${kb(js)}${PRETTY ? '  (pretty)' : ''}${missing.length ? '  MISSING PARTIALS: ' + missing.join(', ') : ''}`);
