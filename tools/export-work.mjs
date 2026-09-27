// Export captures to the WebP sizes the site uses.
//   node tools/export-work.mjs page <slug>                 → {slug}-d-{960,1600,2400}, -dt-{1200,1800}, -m-{390,780}, -mt-{360,720}
//   node tools/export-work.mjs frames <slug> d:0,1,4 m:0,1,5 → {slug}-f{0..2}-1600, -mf{0..2}-720 from the story strips
import { createRequire } from 'node:module';
const sharp = createRequire('C:/Users/hafez/creative-web-os/noop.js')('sharp');
const [mode, slug, ...rest] = process.argv.slice(2);
const src = `.captures/${slug}`, out = 'public/work';
const webp = (img, w, file) => img.clone().resize(w).webp({ quality: 80 }).toFile(`${out}/${file}`);
if (mode === 'page') {
  const d = sharp(`${src}/d.png`), dt = sharp(`${src}/d-tall.png`), m = sharp(`${src}/m.png`), mt = sharp(`${src}/m-tall.png`);
  await Promise.all([
    ...[960, 1600, 2400].map((w) => webp(d, w, `${slug}-d-${w}.webp`)),
    ...[1200, 1800].map((w) => webp(dt, w, `${slug}-dt-${w}.webp`)),
    ...[390, 780].map((w) => webp(m, w, `${slug}-m-${w}.webp`)),
    ...[360, 720].map((w) => webp(mt, w, `${slug}-mt-${w}.webp`)),
  ]);
} else {
  const pick = Object.fromEntries(rest.map((a) => { const [k, v] = a.split(':'); return [k, v.split(',').map(Number)]; }));
  for (const [kind, h, w, name] of [['d', 1800, 1600, 'f'], ['m', 2532, 720, 'mf']]) {
    const strip = sharp(`${src}/${kind}-story.png`);
    const W = (await strip.metadata()).width;
    await Promise.all(pick[kind].map((idx, i) => strip.clone().extract({ left: 0, top: idx * h, width: W, height: h }).resize(w).webp({ quality: 80 }).toFile(`${out}/${slug}-${name}${i}-${w}.webp`)));
    // the first frame doubles as the single-view image (hub preview, share art)
    if (kind === 'd') await strip.clone().extract({ left: 0, top: pick.d[0] * h, width: W, height: h }).resize(1600).webp({ quality: 80 }).toFile(`${out}/${slug}-d-1600.webp`);
    if (kind === 'm') await strip.clone().extract({ left: 0, top: pick.m[0] * h, width: W, height: h }).resize(780).webp({ quality: 80 }).toFile(`${out}/${slug}-m-780.webp`);
  }
}
console.log('exported', mode, slug);
