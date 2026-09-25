// Storefront builders — one architecture type per real client (WORLD_BIBLE.md "World distinctness check").
// Illustrated, not photographic. The window content is the client's REAL website (assets/work/*).
// Local frame: origin = facade front at ground, +Z toward the road, +X = viewer's right when facing it.
import * as THREE from 'three';
import { signTexture, stripeTexture, radialTexture, yourCardTexture } from './canvas.js';
import { glowMaterial } from './materials.js';
import { clamp, smoothstep } from './motion.js';

const yawOf = (dir) => Math.atan2(dir.x, dir.z);
const lambert = (color) => new THREE.MeshLambertMaterial({ color });
const std = (color, roughness = 0.9, map = null) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, map });
const basicHDR = (color, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false, fog: true });

function brickTexture(base = '#4A2A20', mortar = '#20120E') {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = mortar; g.fillRect(0, 0, 256, 256);
  const bh = 16, bw = 48;
  for (let y = 0; y < 256; y += bh) {
    for (let x = -bw; x < 256 + bw; x += bw) {
      const o = (y / bh) % 2 ? bw / 2 : 0;
      const soot = 1 - (1 - y / 256) * 0.35; // darker toward the cornice
      const c = new THREE.Color(base).offsetHSL((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.12).multiplyScalar(soot);
      g.fillStyle = `#${c.getHexString()}`;
      g.fillRect(x + o + 1, y + 1, bw - 2, bh - 2);
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// a window that shows a website: emissive, slow ambient pan through the site, switch-on scalar
class SiteWindow {
  constructor(w, h, lightColor) {
    this.w = w; this.h = h;
    this.mat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false, fog: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
    this.tint = new THREE.Color(lightColor);
    this.alt = null; // optional second site (EN/AR)
    this.pan = Math.random() * 6;
    // faint glass reflection streak on top
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
      map: glassStreak(), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, fog: true, toneMapped: false,
    }));
    glass.position.z = 0.015;
    this.mesh.add(glass);
  }
  setTexture(tex, which = 0) {
    tex.wrapT = THREE.ClampToEdgeWrapping;
    const imgAspect = tex.image.width / tex.image.height;
    const frac = clamp((this.w / this.h) / imgAspect > 0 ? imgAspect / (this.w / this.h) : 1, 0.05, 1);
    tex.repeat.set(1, frac);
    tex.offset.set(0, 1 - frac);
    tex.userData.frac = frac;
    if (which === 0) { this.mat.map = tex; this.mat.needsUpdate = true; this.tex = tex; }
    else {
      this.altMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, toneMapped: false, fog: true, depthWrite: false });
      this.alt = new THREE.Mesh(this.mesh.geometry, this.altMat);
      this.alt.position.z = 0.005;
      this.mesh.add(this.alt);
      this.altTex = tex;
    }
  }
  update(on, time, swapEvery = 0) {
    const k = on * 0.82; // below the bloom threshold: the site stays legible, it glows by contrast
    if (this.tex) this.mat.color.setScalar(k); else this.mat.color.copy(this.tint).multiplyScalar(on * 0.6);
    // the site scrolls slowly inside the window (ambient life, ~9 px/s at 1024 w)
    const s = 0.5 - 0.5 * Math.cos((time + this.pan) * 0.11);
    for (const t of [this.tex, this.altTex]) {
      if (!t) continue;
      const frac = t.userData.frac;
      t.offset.y = (1 - frac) * (1 - s * 0.55);
    }
    if (this.alt) {
      const phase = swapEvery ? (time % (swapEvery * 2)) / swapEvery : 0; // 0..2
      const a = phase < 1 ? smoothstep(0.85, 1, phase) : 1 - smoothstep(1.85, 2, phase);
      this.altMat.opacity = a * on;
      this.altMat.color.setScalar(0.82);
    }
  }
}

let _streak;
function glassStreak() {
  if (_streak) return _streak;
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 256, 256, 0);
  grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(0.42, 'rgba(255,255,255,0)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.9)'); grd.addColorStop(0.56, 'rgba(255,255,255,0)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  _streak = new THREE.CanvasTexture(cv);
  return _streak;
}

class Sign {
  constructor(spec, w, h) {
    this.tex = signTexture({ ...spec, w: 1024, h: Math.round(1024 * (h / w)) });
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false, fog: true, color: 0x000000 });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
    this.gain = spec.gain || 1.25;
    this.base = spec.base ?? 0.06; // an unlit sign still catches a little street light
  }
  update(on) { this.mat.color.setScalar(this.base + on * this.gain); }
}

function frame(group, w, h, depth = 0.12, color = '#101218', thick = 0.12) {
  const m = lambert(color);
  const parts = [
    [w + thick * 2, thick, 0, h / 2 + thick / 2], [w + thick * 2, thick, 0, -h / 2 - thick / 2],
    [thick, h, -w / 2 - thick / 2, 0], [thick, h, w / 2 + thick / 2, 0],
  ];
  for (const [bw, bh, x, y] of parts) { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, depth), m); b.position.set(x, y, 0); group.add(b); }
}

function pool(color, size, opacity = 0.5) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.6), glowMaterial(radialTexture(), color, opacity));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 3;
  return m;
}

// ───────── builders ─────────
const BUILDERS = {
  brickAwning(w, ctx) {
    const g = new THREE.Group();
    const W = 14, H = 8.4, D = 10;
    const brick = brickTexture('#3E2119', '#150B08'); brick.repeat.set(W / 3.2, H / 3.2);
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), std('#FFFFFF', 0.95, brick));
    body.position.set(0, H / 2, -D / 2); g.add(body);
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.35, 0.6), lambert('#1C120E')); cornice.position.set(0, H + 0.1, 0.1); g.add(cornice);
    const win = new SiteWindow(7.4, 3.2, w.light.window); win.mesh.position.set(-1.4, 0.5 + 1.6, 0.03); g.add(win.mesh);
    const fr = new THREE.Group(); fr.position.copy(win.mesh.position); frame(fr, 7.4, 3.2, 0.14, '#1A0F0B'); g.add(fr);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.6), basicHDR('#C9783C', 0.0)); door.position.set(4.6, 1.3, 0.03); g.add(door);
    const dfr = new THREE.Group(); dfr.position.copy(door.position); frame(dfr, 1.3, 2.6, 0.12, '#1A0F0B', 0.1); g.add(dfr);
    const sign = new Sign(w.sign, 9.2, 1.3); sign.mesh.position.set(-0.3, 4.55, 0.07); g.add(sign.mesh);
    const stripes = stripeTexture([w.palette.stripeA, w.palette.stripeB]); stripes.repeat.set(3, 1);
    const awning = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 1.9), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.9, side: THREE.DoubleSide }));
    awning.position.set(-1.4, 3.72, 0.86); awning.rotation.x = -1.02; g.add(awning);
    const valance = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 0.32), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.9 }));
    valance.position.set(-1.4, 3.18, 1.66); g.add(valance);
    // upstairs: someone's home, two warm windows
    const up = [];
    for (const x of [-4.2, -0.6, 3.0]) { const u = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.7), basicHDR('#E89A55', 0.0)); u.position.set(x, 6.4, 0.03); g.add(u); up.push(u); const uf = new THREE.Group(); uf.position.copy(u.position); frame(uf, 1.4, 1.7, 0.1, '#1A0F0B', 0.09); g.add(uf); }
    const sp = pool(w.light.key, 10, 0.55); sp.position.set(-1.4, 0.19, 2.6); g.add(sp);
    return {
      group: g, windows: [win], sign, pools: [sp], lightAt: new THREE.Vector3(-1.4, 1.4, 5.2), target: new THREE.Vector3(-1.4, 2.1, 0),
      update(on, t) {
        const breathe = 1 + Math.sin(t * 1.25) * 0.06; // oven-warm glow breathing
        win.update(on * breathe, t, w.swapEvery); sign.update(on);
        door.material.color.set('#C9783C').multiplyScalar(on * 0.32 * breathe);
        up.forEach((u, i) => u.material.color.set('#E89A55').multiplyScalar(on * (i === 1 ? 0.06 : 0.24)));
        sp.material.opacity = on * 0.55;
      },
    };
  },

  glassBox(w) {
    const g = new THREE.Group();
    const W = 10.5, H = 4.8, D = 10;
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), std('#1C2522', 0.8)); body.position.set(0, H / 2, -D / 2); g.add(body);
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.6, 0.5), lambert('#101614')); parapet.position.set(0, H + 0.3, 0); g.add(parapet);
    const win = new SiteWindow(7.8, 3.1, w.light.window); win.mesh.position.set(-0.9, 0.35 + 1.55, 0.03); g.add(win.mesh);
    const fr = new THREE.Group(); fr.position.copy(win.mesh.position); frame(fr, 7.8, 3.1, 0.1, '#C8D2CC', 0.07); g.add(fr);
    const sign = new Sign(w.sign, 8.6, 1.0); sign.mesh.position.set(0, 4.25, 0.07); g.add(sign.mesh);
    // barber pole
    const poleTex = stripeTexture(['#C8102E', '#F4F4F4', '#1F3A93', '#F4F4F4'], { diagonal: true }); poleTex.repeat.set(1, 1.6);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.25, 20, 1, true), new THREE.MeshBasicMaterial({ map: poleTex, toneMapped: false, fog: true, color: 0x000000 }));
    pole.position.set(4.35, 2.05, 0.34); g.add(pole);
    const capM = std('#D9DDE0', 0.3);
    for (const y of [2.72, 1.38]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 10), capM); c.position.set(4.35, y, 0.34); g.add(c); }
    const sp = pool(w.light.key, 11, 0.5); sp.position.set(-0.9, 0.19, 2.4); g.add(sp);
    return {
      group: g, windows: [win], sign, pools: [sp], lightAt: new THREE.Vector3(-0.9, 2.2, 2.6), target: new THREE.Vector3(-0.4, 1.95, 0),
      update(on, t) {
        win.update(on, t); sign.update(on); sp.material.opacity = on * 0.5;
        pole.material.color.setScalar(0.05 + on * 1.25);
        poleTex.offset.y = -t * 0.5; // 0.5 rev/s — the barbershop's ambient signature
      },
    };
  },

  canopy(w) {
    const g = new THREE.Group();
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(22, 14), lambert('#0E1115')); lot.rotation.x = -Math.PI / 2; lot.position.set(0, 0.02, -2); g.add(lot);
    const cz = 0.8, cw = 6.4, cd = 4.4, ch = 2.7;
    const legM = lambert('#5C6066');
    for (const [x, z] of [[-cw / 2, cz - cd / 2], [cw / 2, cz - cd / 2], [-cw / 2, cz + cd / 2], [cw / 2, cz + cd / 2]]) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, ch, 6), legM); l.position.set(x, ch / 2, z); g.add(l);
    }
    const roofM = std(w.palette.canopy, 0.9);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(cw, cd) / 2, 0.9, 4, 1), roofM); roof.rotation.y = Math.PI / 4; roof.scale.set(cw / Math.hypot(cw, cd) * 1.41, 1, cd / Math.hypot(cw, cd) * 1.41); roof.position.set(0, ch + 0.45, cz); g.add(roof);
    const sign = new Sign(w.sign, cw, 0.55); sign.mesh.position.set(0, ch - 0.1, cz + cd / 2 + 0.02); g.add(sign.mesh);
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.9), std('#E8E6E0', 0.6)); table.position.set(-1.1, 0.9, cz + 0.9); g.add(table);
    const cups = [];
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.26, 14), basicHDR(w.palette.accent, 0)); c.position.set(-1.8 + i * 0.5, 1.07, cz + 1.0); g.add(c); cups.push(c);
    }
    // easel display board with the site
    const win = new SiteWindow(2.5, 1.56, w.light.window); win.mesh.position.set(1.9, 1.55, cz + 1.4); win.mesh.rotation.y = 0.45; g.add(win.mesh);
    const fr = new THREE.Group(); fr.position.copy(win.mesh.position); fr.rotation.copy(win.mesh.rotation); frame(fr, 2.5, 1.56, 0.06, '#2A2A2A', 0.06); g.add(fr);
    for (const x of [-0.8, 0.8]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.7, 0.05), lambert('#3A2A1C')); leg.position.set(1.9 + x * Math.cos(0.45), 0.85, cz + 1.4 - x * Math.sin(0.45)); g.add(leg); }
    // string lights: catenaries from the canopy to two posts, instanced bulbs
    const posts = [[-7.5, 3.2], [8.0, 3.6]];
    const pm = lambert('#15181D');
    posts.forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 6), pm); p.position.set(x, 2.1, z); g.add(p); });
    const strands = [
      [new THREE.Vector3(-cw / 2, ch + 0.05, cz + cd / 2), new THREE.Vector3(-7.5, 4.1, 3.2)],
      [new THREE.Vector3(cw / 2, ch + 0.05, cz + cd / 2), new THREE.Vector3(8.0, 4.1, 3.6)],
      [new THREE.Vector3(-cw / 2, ch + 0.05, cz - cd / 2), new THREE.Vector3(cw / 2, ch + 0.05, cz - cd / 2)],
      [new THREE.Vector3(-7.5, 4.1, 3.2), new THREE.Vector3(-7.5, 4.1, -5)],
    ];
    const bulbs = [];
    strands.forEach(([a, b]) => { for (let i = 1; i < 14; i++) { const t = i / 14; const p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * 0.9; bulbs.push({ p, t }); } });
    const bulbMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 8, 6), basicHDR('#FFD9A0', 0), bulbs.length);
    const m4 = new THREE.Matrix4();
    bulbs.forEach((b, i) => { m4.makeTranslation(b.p.x, b.p.y, b.p.z); bulbMesh.setMatrixAt(i, m4); });
    g.add(bulbMesh);
    const sp = pool(w.light.key, 12, 0.45); sp.position.set(0, 0.05, cz + 2.2); g.add(sp);
    return {
      group: g, windows: [win], sign, pools: [sp], lightAt: new THREE.Vector3(0, 2.3, cz + 2.8), target: new THREE.Vector3(0.4, 1.5, cz + 0.8),
      update(on, t) {
        win.update(on, t); sign.update(on); sp.material.opacity = on * 0.45;
        cups.forEach((c) => c.material.color.set(w.palette.accent).multiplyScalar(on * 1.6));
        bulbMesh.material.color.set('#FFD9A0').multiplyScalar(on * 2.4);
        bulbMesh.rotation.z = Math.sin(t * 1.96) * 0.01 * on; // gentle sway
      },
    };
  },

  corner(w) {
    const g = new THREE.Group();
    const W = 12, H = 6.2, D = 12;
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), std(w.palette.facade, 0.9)); body.position.set(0, H / 2, -D / 2); g.add(body);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.5, D + 0.3), lambert('#140C08')); trim.position.set(0, H + 0.25, -D / 2); g.add(trim);
    const win = new SiteWindow(6.6, 2.9, w.light.window); win.mesh.position.set(-2.2, 0.45 + 1.45, 0.03); g.add(win.mesh);
    const fr = new THREE.Group(); fr.position.copy(win.mesh.position); frame(fr, 6.6, 2.9, 0.12, '#140C08'); g.add(fr);
    // the corner: a second window on the side facing the approaching driver
    const side = new SiteWindow(5.2, 2.9, w.light.window); side.mesh.position.set(W / 2 + 0.03, 0.45 + 1.45, -4.2); side.mesh.rotation.y = Math.PI / 2; g.add(side.mesh);
    const sign = new Sign(w.sign, 8.4, 1.2); sign.mesh.position.set(-0.6, 4.4, 0.07); g.add(sign.mesh);
    const sign2 = new Sign(w.sign, 6.0, 1.0); sign2.mesh.position.set(W / 2 + 0.07, 4.4, -4.6); sign2.mesh.rotation.y = Math.PI / 2; g.add(sign2.mesh);
    // steam from the roof vent, lit by the sign
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 10), lambert('#2A2522')); vent.position.set(3.6, H + 0.6, -2.5); g.add(vent);
    const steamMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      uniforms: { uTime: { value: 0 }, uOn: { value: 0 }, uColor: { value: new THREE.Color(w.light.key) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uTime, uOn; uniform vec3 uColor; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        void main(){ vec2 uv = vUv; float y = uv.y; float x = uv.x - 0.5 + sin(y * 6.0 + uTime * 0.8) * 0.12 * y;
          float plume = smoothstep(0.32, 0.0, abs(x) - y * 0.12) * smoothstep(0.0, 0.12, y) * (1.0 - smoothstep(0.55, 1.0, y));
          float t = n(vec2(uv.x * 4.0, y * 3.0 - uTime * 0.35)) * 0.6 + n(vec2(uv.x * 9.0, y * 7.0 - uTime * 0.6)) * 0.4;
          float a = plume * smoothstep(0.3, 0.8, t) * 0.5 * uOn;
          gl_FragColor = vec4(mix(vec3(0.75), uColor, 0.45) * a, a); }`,
    });
    const steam = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.2), steamMat); steam.position.set(3.6, H + 3.0, -2.5); g.add(steam);
    const sp = pool(w.light.key, 11, 0.5); sp.position.set(-2.2, 0.19, 2.4); g.add(sp);
    return {
      group: g, windows: [win, side], sign, pools: [sp], lightAt: new THREE.Vector3(-1.5, 1.8, 5.0), target: new THREE.Vector3(-0.4, 2.6, -0.4), steam,
      update(on, t, cam) {
        win.update(on, t); side.update(on, t + 3); sign.update(on); sign2.update(on); sp.material.opacity = on * 0.5;
        steamMat.uniforms.uTime.value = t; steamMat.uniforms.uOn.value = on;
        if (cam) steam.quaternion.copy(cam.quaternion);
      },
    };
  },

  bigBox(w) {
    const g = new THREE.Group();
    const W = 44, H = 11, D = 28;
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), std(w.palette.facade, 0.85)); body.position.set(0, H / 2, -D / 2); g.add(body);
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(W, 16), lambert('#0C1016')); apron.rotation.x = -Math.PI / 2; apron.position.set(0, 0.015, 8); g.add(apron);
    // parking stripes
    const stripeM = new THREE.MeshBasicMaterial({ color: '#5E5D58', fog: true });
    for (let x = -20; x <= 20; x += 3) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 5), stripeM); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.03, 11); g.add(s); }
    const win = new SiteWindow(10.5, 4.9, w.light.window); win.mesh.position.set(-5, 0.2 + 2.45, 0.03); g.add(win.mesh);
    const fr = new THREE.Group(); fr.position.copy(win.mesh.position); frame(fr, 10.5, 4.9, 0.2, '#0A0F18', 0.18); g.add(fr);
    const sign = new Sign({ ...w.sign, bg: '#06172E' }, 17, 3.0); sign.mesh.position.set(-5, 8.1, 0.08); g.add(sign.mesh);
    // neon: roofline + entrance outline, three hues cycling one step every 1.6 s
    const neonMats = w.light.neon.map((c) => basicHDR(c, 0));
    const tube = (pts, mat) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 8, 0.09, 6, false), mat); g.add(m); return m; };
    const roofY = H - 0.4;
    tube([new THREE.Vector3(-W / 2 + 0.4, roofY, 0.1), new THREE.Vector3(-W / 6, roofY, 0.1)], neonMats[0]);
    tube([new THREE.Vector3(-W / 6, roofY, 0.1), new THREE.Vector3(W / 6, roofY, 0.1)], neonMats[1]);
    tube([new THREE.Vector3(W / 6, roofY, 0.1), new THREE.Vector3(W / 2 - 0.4, roofY, 0.1)], neonMats[2]);
    const ex = -5, eh = 5.4, ew = 11.3;
    tube([new THREE.Vector3(ex - ew / 2, 0.2, 0.12), new THREE.Vector3(ex - ew / 2, eh, 0.12), new THREE.Vector3(ex + ew / 2, eh, 0.12), new THREE.Vector3(ex + ew / 2, 0.2, 0.12)].flatMap((p, i, a) => (i ? [a[i - 1].clone().lerp(p, 0.5), p] : [p])), neonMats[0]);
    // inflatable arch at the entrance
    const archTex = stripeTexture(['#FF7A00', '#FFD400']); archTex.repeat.set(10, 1);
    const archPts = []; for (let i = 0; i <= 24; i++) { const a = Math.PI * (i / 24); archPts.push(new THREE.Vector3(ex + Math.cos(a) * 4.6, Math.sin(a) * 4.9, 3.6)); }
    const arch = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPts), 64, 0.6, 12, false), new THREE.MeshBasicMaterial({ map: archTex, toneMapped: false, fog: true, color: 0x000000 }));
    g.add(arch);
    const sp = pool(w.light.key, 26, 0.35); sp.position.set(ex, 0.05, 7); g.add(sp);
    return {
      group: g, windows: [win], sign, pools: [sp], lightAt: new THREE.Vector3(ex, 5.5, 8), target: new THREE.Vector3(ex + 2, 4.0, 0),
      update(on, t) {
        win.update(on, t); sign.update(on); sp.material.opacity = on * 0.35;
        const step = Math.floor(t / 1.6);
        neonMats.forEach((m, i) => m.color.set(w.light.neon[(i + step) % 3]).multiplyScalar(on * 2.6));
        sp.material.color.set(w.light.neon[step % 3]);
        arch.material.color.setScalar(0.04 + on * 1.05);
      },
    };
  },

  billboard(w) {
    const g = new THREE.Group();
    const steel = std('#2A2E35', 0.6);
    for (const x of [-4.2, 4.2]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 9.2, 10), steel); l.position.set(x, 4.6, -1); g.add(l); }
    const catwalk = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.12, 1.4), steel); catwalk.position.set(0, 8.7, 0.1); g.add(catwalk);
    const back = new THREE.Mesh(new THREE.BoxGeometry(15.6, 7.8, 0.5), std('#15171B', 0.8)); back.position.set(0, 12.8, -0.5); g.add(back);
    const win = new SiteWindow(15, 7.2, w.light.window); win.mesh.position.set(0, 12.8, -0.22); g.add(win.mesh);
    const sign = new Sign(w.sign, 15, 0.9); sign.mesh.position.set(0, 8.25, 0.02); g.add(sign.mesh);
    const floods = [];
    for (const x of [-4.5, 4.5]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.5), basicHDR('#FFF2DA', 0)); f.position.set(x, 8.95, 0.6); g.add(f); floods.push(f);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(3.6, 4.2, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#FFF1D6', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true }));
      cone.position.set(x, 11.1, 0.35); cone.rotation.x = Math.PI; g.add(cone); floods.push(cone);
    }
    return {
      group: g, windows: [win], sign, pools: [], lightAt: new THREE.Vector3(0, 10, 3), target: new THREE.Vector3(0, 12.4, 0),
      update(on, t) {
        win.update(on, t); sign.update(on);
        floods.forEach((f) => (f.material.type === 'MeshBasicMaterial' && f.material.transparent ? (f.material.opacity = on * 0.05) : f.material.color.set('#FFF2DA').multiplyScalar(on * 3)));
      },
    };
  },

  mall(w) {
    const g = new THREE.Group();
    const W = 32, H = 12, D = 24;
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), std('#1A1C21', 0.7)); body.position.set(0, H / 2, -D / 2); g.add(body);
    // curtain wall: dark glass with faint interior light + mullions
    const glassMat = new THREE.MeshStandardMaterial({ color: '#0D1117', roughness: 0.62, metalness: 0.15 }); // matte enough that the spill light doesn't hotspot
    for (const x of [-10, 10]) {
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 9.5), glassMat); gl.position.set(x, 5.4, 0.02); g.add(gl);
      for (let i = -2; i <= 2; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 9.5, 0.12), lambert('#2B2F37')); m.position.set(x + i * 2.1, 5.4, 0.05); g.add(m); }
    }
    const win = new SiteWindow(9.4, 4.7, w.light.window); win.mesh.position.set(0, 0.3 + 2.35, 0.03); g.add(win.mesh);
    const fr = new THREE.Group(); fr.position.copy(win.mesh.position); frame(fr, 9.4, 4.7, 0.2, '#0B0B0B', 0.2); g.add(fr);
    const sign = new Sign(w.sign, 10.2, 1.25); sign.mesh.position.set(0, 5.75, 0.08); g.add(sign.mesh);
    const mallName = new Sign({ text: 'FRANKLIN PARK MALL', font: 'Overpass', weight: 800, fg: '#E9E6DF', bg: '#1A1C21', size: 0.5, gain: 0.9 }, 12, 1.2);
    mallName.mesh.position.set(0, 10.6, 0.06); g.add(mallName.mesh);
    const reds = [];
    for (const x of [-6.6, 6.6]) {
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.15, 0.8), std('#3A3936', 0.95)); plinth.position.set(x, 0.58, 2.2); g.add(plinth);
      const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 20), basicHDR(w.light.accent, 0)); glow.position.set(x, 1.19, 2.2); g.add(glow); reds.push(glow);
      const rp = pool(w.light.accent, 5, 0.6); rp.position.set(x, 0.05, 2.6); g.add(rp); reds.push(rp);
    }
    const sp = pool('#FFF4E8', 14, 0.16); sp.position.set(0, 0.05, 3.2); g.add(sp);
    return {
      group: g, windows: [win], sign, pools: [sp], lightAt: new THREE.Vector3(0, 3.2, 4.5), target: new THREE.Vector3(0, 2.8, 0),
      update(on, t) {
        win.update(on, t); sign.update(on); mallName.update(on * 0.8); sp.material.opacity = on * 0.16;
        const sweep = 0.85 + 0.15 * Math.sin(t * 0.7);
        reds.forEach((r) => (r.material.blending === THREE.AdditiveBlending ? (r.material.opacity = on * 0.6) : r.material.color.set(w.light.accent).multiplyScalar(on * 2.2 * sweep)));
      },
    };
  },

  yours(w) {
    const g = new THREE.Group();
    const W = 11, H = 5.3, D = 10;
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), std(w.palette.facade, 0.9)); body.position.set(0, H / 2, -D / 2); g.add(body);
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.7, 0.5), lambert('#0F131A')); parapet.position.set(0, H + 0.35, 0); g.add(parapet);
    const win = new SiteWindow(6.8, 3.0, w.light.window); win.mesh.position.set(-1.4, 0.45 + 1.5, 0.03); g.add(win.mesh);
    const fr = new THREE.Group(); fr.position.copy(win.mesh.position); frame(fr, 6.8, 3.0, 0.12, '#0B0E13'); g.add(fr);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.6), basicHDR('#FFE3A6', 0)); door.position.set(3.6, 1.3, 0.03); g.add(door);
    const ydf = new THREE.Group(); ydf.position.copy(door.position); frame(ydf, 1.3, 2.6, 0.12, '#0B0E13', 0.1); g.add(ydf);
    const sign = new Sign({ ...w.sign, gain: 1.3, base: 0 }, 8.4, 1.15); sign.mesh.position.set(-0.4, 4.45, 0.07); g.add(sign.mesh);
    // the mark's gold slash as a neon tube beside the door
    const slash = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 8), basicHDR('#F4CD72', 0));
    slash.position.set(2.4, 2.1, 0.12); slash.rotation.z = -Math.atan(0.52); g.add(slash);
    const sweepMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      uniforms: { uTime: { value: 0 }, uDark: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uTime, uDark; varying vec2 vUv;
        void main(){ float a = 0.0;
          for (int i = 0; i < 3; i++) { float fi = float(i); float x = fract(uTime * (0.23 + fi * 0.07) + fi * 0.37) * 1.6 - 0.3;
            float band = exp(-pow((vUv.x - x) * 9.0, 2.0)) * smoothstep(0.15, 0.4, vUv.y) * smoothstep(0.75, 0.45, vUv.y);
            a += band * (i == 1 ? 0.55 : 0.35); }
          vec3 col = mix(vec3(1.0, 0.72, 0.28), vec3(0.8, 0.88, 1.0), step(0.5, fract(uTime * 0.11)));
          gl_FragColor = vec4(col * a * 0.35 * uDark, 1.0); }`,
    });
    const sweep = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.0), sweepMat); sweep.position.set(-1.4, 1.95, 0.05); g.add(sweep);
    const card = yourCardTexture(); card.userData.frac = 1;
    win.mat.map = card; win.tex = card; card.repeat.set(1, 1); card.offset.set(0, 0);
    const sp = pool(w.light.key, 11, 0.55); sp.position.set(-1.4, 0.19, 2.5); g.add(sp);
    return {
      group: g, windows: [win], sign, pools: [sp], lightAt: new THREE.Vector3(-1.2, 1.6, 5.0), target: new THREE.Vector3(-0.6, 2.4, 0),
      update(on, t) {
        win.mat.color.setScalar(on * 0.85); sign.update(on); sp.material.opacity = on * 0.55;
        sweepMat.uniforms.uTime.value = t; sweepMat.uniforms.uDark.value = 1 - on;
        door.material.color.set('#E0B060').multiplyScalar(on * 0.28);
        slash.material.color.set('#F4CD72').multiplyScalar(on * 3.2);
      },
    };
  },
};

// place a storefront at its route anchor, facing the road
export function buildStorefront(scene, route, w, ctx = {}) {
  const b = BUILDERS[w.type](w, ctx);
  const seg = route.segment(w.segment);
  const d = seg.d0 + w.along;
  const f = route.frame(d, {});
  const origin = f.p.clone().addScaledVector(f.r, w.setback);
  b.group.position.copy(origin);
  b.group.rotation.y = yawOf(f.r.clone().multiplyScalar(-1));
  b.group.updateMatrixWorld(true);
  scene.add(b.group);
  b.id = w.id; b.world = w; b.d = d;
  b.targetWorld = b.group.localToWorld(b.target.clone());
  b.lightWorld = b.group.localToWorld(b.lightAt.clone());
  return b;
}

export { SiteWindow };
