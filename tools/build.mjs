// Bundles assets/js/world/*.js + three.js (tree-shaken) → assets/js/dist/ (committed; the site stays static).
// Setup once:  npm install --prefix tools/.build three@0.186.0 esbuild@0.25.10
// Build:       node tools/build.mjs            (run after editing anything in assets/js/world/)
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(path.resolve('tools/.build/package.json'));
const esbuild = require('esbuild');
const threeDir = path.resolve('tools/.build/node_modules/three');
// start clean: stale hashed chunks must never ship (keep the license file)
import fs from 'node:fs';
for (const f of fs.existsSync('assets/js/dist') ? fs.readdirSync('assets/js/dist') : []) if (f.endsWith('.js') || f.endsWith('.map')) fs.rmSync(path.join('assets/js/dist', f));
const result = await esbuild.build({
  entryPoints: ['assets/js/world/main.js'],
  bundle: true, format: 'esm', splitting: true, minify: true, target: 'es2020',
  outdir: 'assets/js/dist', chunkNames: 'chunk-[hash]', entryNames: 'app',
  legalComments: 'eof', metafile: true, logLevel: 'warning', sourcemap: true,
  plugins: [{
    name: 'three-from-tools',
    setup(b) {
      b.onResolve({ filter: /^three(\/addons\/.*)?$/ }, (a) => ({
        path: a.path === 'three' ? path.join(threeDir, 'build/three.module.js') : path.join(threeDir, 'examples/jsm', a.path.slice('three/addons/'.length)),
      }));
    },
  }],
});
const out = Object.entries(result.metafile.outputs).map(([f, o]) => `${f} ${(o.bytes / 1024).toFixed(0)} KB`);
console.log(out.join('\n'));
