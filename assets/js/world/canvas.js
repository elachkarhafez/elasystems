// Canvas-drawn textures: client signs (their real web fonts), road markings, street blades, generic ramps.
import * as THREE from 'three';

const FONT_FILES = {
  'Bebas Neue': 'bebas-neue-400', Syne: 'syne-800', Montserrat: 'montserrat-800', Anton: 'anton-400',
  'Fredoka One': 'fredoka-one-400', Oswald: 'oswald-600', 'Cormorant Garamond': 'cormorant-garamond-600',
};

// load the client faces explicitly (FontFace API) so signs never draw in a fallback face
export async function loadClientFonts(base = 'assets/fonts/clients/') {
  const jobs = Object.entries(FONT_FILES).map(async ([family, file]) => {
    const [, weight] = file.match(/-(\d+)$/);
    try {
      const f = new FontFace(family, `url(${base}${file}.woff2)`, { weight });
      await f.load();
      document.fonts.add(f);
    } catch (e) { /* sign falls back; not fatal */ }
  });
  await Promise.all(jobs);
  try { await document.fonts.load('800 40px Overpass'); } catch (e) { /* ignore */ }
}

function canvasTexture(cv, { srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}

// a lit sign band: text fitted into the band, in the client's own face
export function signTexture({ text, font, weight = 400, fg, bg, size = 0.7, w = 1024, h = 192, border = null }) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (border) { g.strokeStyle = border; g.lineWidth = h * 0.05; g.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1); }
  let px = Math.round(h * size);
  g.font = `${weight} ${px}px "${font}"`;
  while (g.measureText(text).width > w * 0.86 && px > 12) { px -= 2; g.font = `${weight} ${px}px "${font}"`; }
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + px * 0.04);
  return canvasTexture(cv);
}

// green enamel street blade (Highway Gothic lineage → Overpass)
export function bladeTexture(text, { w = 512, h = 112 } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const r = h * 0.14;
  g.fillStyle = '#0E5B3A';
  g.beginPath(); g.roundRect(2, 2, w - 4, h - 4, r); g.fill();
  g.strokeStyle = '#F2EFE8'; g.lineWidth = 4;
  g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, r * 0.7); g.stroke();
  let px = Math.round(h * 0.56);
  g.font = `700 ${px}px Overpass`;
  while (g.measureText(text).width > w * 0.84) { px -= 2; g.font = `700 ${px}px Overpass`; }
  g.fillStyle = '#F2EFE8'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 2);
  return canvasTexture(cv);
}

// road-marking type painted on asphalt: tall condensed capitals, slightly worn
// one shared wear pattern (paint flecks knocked out of the markings), built once
let _wear;
function wearPattern(g) {
  if (!_wear) {
    _wear = document.createElement('canvas');
    _wear.width = _wear.height = 128;
    const wg = _wear.getContext('2d');
    const img = wg.createImageData(128, 128);
    let seed = 7;
    for (let i = 0; i < img.data.length; i += 4) { seed = (seed * 1664525 + 1013904223) >>> 0; const r = seed / 4294967296; img.data[i + 3] = r > 0.93 ? 200 : r > 0.86 ? 90 : 0; }
    wg.putImageData(img, 0, 0);
  }
  return g.createPattern(_wear, 'repeat');
}

export function roadMarkTexture(text, { w = 256, h = 640 } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(236,233,224,0.9)';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const words = text.split(' ').reverse(); // road markings read near → far: first word nearest the driver
  const lineH = h / Math.max(2, words.length);
  words.forEach((word, i) => {
    let px = 110;
    g.font = `800 ${px}px Overpass`;
    while (g.measureText(word).width > w * 0.9) { px -= 4; g.font = `800 ${px}px Overpass`; }
    g.save();
    g.translate(w / 2, lineH * (i + 0.5));
    g.scale(1, Math.min(2.6, (lineH * 0.8) / (px * 0.72)));
    g.fillText(word, 0, 0);
    g.restore();
  });
  // wear: knock out specks so it reads as paint on asphalt (one pattern fill, not thousands of rects)
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = wearPattern(g);
  g.fillRect(0, 0, w, h);
  const t = canvasTexture(cv);
  return t;
}

// soft radial pool (light on the ground / glow sprite)
let _radial;
export function radialTexture() {
  if (_radial) return _radial;
  const s = 256, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  // exponential falloff: reads as light, never as a disc
  for (let i = 0; i <= 12; i++) { const x = i / 12; grd.addColorStop(x, `rgba(255,255,255,${(Math.exp(-x * x * 7) * (1 - x)).toFixed(4)})`); }
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  _radial = canvasTexture(cv, { srgb: false });
  return _radial;
}

// striped fabric / barber pole
export function stripeTexture(colors, { w = 256, h = 256, diagonal = false } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const n = colors.length * 4;
  const band = (diagonal ? w + h : w) / n;
  for (let i = 0; i < n + 4; i++) {
    g.fillStyle = colors[i % colors.length];
    if (diagonal) {
      g.beginPath();
      g.moveTo(i * band - h, h); g.lineTo(i * band + band - h, h); g.lineTo(i * band + band, 0); g.lineTo(i * band, 0); g.fill();
    } else g.fillRect(i * band, 0, band + 1, h);
  }
  const t = canvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// in-world card for "your storefront" (the commerce window)
export function yourCardTexture({ w = 1024, h = 640 } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#0C1A30'); grd.addColorStop(1, '#050B16');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#E3A02A'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(w * 0.62, h * 0.08); g.lineTo(w * 0.62 - h * 0.84 * 0.52, h * 0.92); g.stroke();
  g.fillStyle = '#F2EFE8'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = '800 92px Overpass';
  g.fillText('Your storefront', 70, 250);
  g.fillText("is next.", 70, 350);
  g.fillStyle = '#E3A02A'; g.font = '700 50px Overpass';
  g.fillText('Book a Call · 313-300-6898', 70, 480);
  g.fillStyle = 'rgba(242,239,232,.7)'; g.font = '500 30px "Overpass Mono"';
  g.fillText('ELASYSTEMS · WEBSITES · APPS · ADVERTISING', 70, 560);
  return canvasTexture(cv);
}
