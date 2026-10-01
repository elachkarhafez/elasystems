#!/usr/bin/env node
// Zero-dependency site assembler.
//   node tools/build.mjs            → writes index.html, css/site.css, js/site.js at the repo root
//   node tools/build.mjs --out DIR  → writes the same three files into DIR (for isolated testing), leaving the repo untouched
//
// Sources (edit these, never the generated files):
//   src/index.template.html   the document; `<!-- @partial name -->` is replaced by src/partials/<name>.html
//   src/partials/*.html       one file per section
//   src/css/NN-*.css          concatenated in filename order → css/site.css
//   src/js/NN-*.js            concatenated in filename order → js/site.js   (each file is wrapped in its own IIFE block
//                             only if it does not already start with one; shared API goes on window.ES)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outIdx = process.argv.indexOf('--out');
const OUT = outIdx > -1 ? path.resolve(process.argv[outIdx + 1]) : ROOT;

const read = (p) => fs.readFileSync(p, 'utf8');
const list = (dir, ext) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(ext)).sort().map(f => path.join(dir, f)) : [];

// 1. HTML
let html = read(path.join(ROOT, 'src/index.template.html'));
const missing = [];
html = html.replace(/<!--\s*@partial\s+([\w-]+)\s*-->/g, (_, name) => {
  const p = path.join(ROOT, 'src/partials', name + '.html');
  if (!fs.existsSync(p)) { missing.push(name); return `<!-- missing partial: ${name} -->`; }
  return read(p).trim();
});

// 2. CSS
const css = list(path.join(ROOT, 'src/css'), '.css').map(p => `/* ---- ${path.basename(p)} ---- */\n${read(p).trim()}\n`).join('\n');

// 3. JS
const js = list(path.join(ROOT, 'src/js'), '.js').map(p => `/* ---- ${path.basename(p)} ---- */\n${read(p).trim()}\n`).join('\n');

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
}
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1) + 'KB';
console.log(`built → ${OUT}  index.html ${kb(html)}  site.css ${kb(css)}  site.js ${kb(js)}${missing.length ? '  MISSING PARTIALS: ' + missing.join(', ') : ''}`);
