// Route 313 — boot + ExperienceDirector loop. Architecture: docs/creative/EXPERIENCE_ARCHITECTURE.md.
import * as THREE from 'three';
import { Route, ROAD } from './route.js';
import { WORLDS, YOUR_SHOP } from './worlds.js';
import { buildTimeline, pose, switchOn } from './timeline.js';
import { buildCity } from './city.js';
import { buildStorefront } from './storefronts.js';
import { buildTrails } from './trails.js';
import { loadClientFonts } from './canvas.js';
import { DomDirector } from './dom.js';
import { MOTION, clamp, lerp, smoothstep } from './motion.js';

const root = document.documentElement;
const params = new URLSearchParams(location.search);

// Vertical slice gate: build only these worlds until the slice has passed visual QA (docs/creative/VISUAL_QA.md).
const SLICE = params.has('slice') ? params.get('slice').split(',') : null;
const ACTIVE = SLICE ? WORLDS.filter((w) => SLICE.includes(w.id)) : WORLDS;
const FINALE = !SLICE || SLICE.includes('finale');

const narrow = innerWidth < 900;
const coarse = matchMedia('(pointer: coarse)').matches;
const mobile = narrow;
let tier = params.get('tier') || (narrow || coarse ? 'low' : 'high');

const route = new Route();
const tl = buildTimeline(route, ACTIVE, YOUR_SHOP, { mobile, includeFinale: FINALE });
const dom = new DomDirector(tl, { mobile });
window.__route313 = { tl, route }; // QA hook (read-only use)

// boot after first paint: the poster + headline are the LCP; the world takes over when ready
const whenIdle = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 1200 }) : setTimeout(r, 200)));
const yieldToMain = () => new Promise((r) => setTimeout(r, 0));
if (root.classList.contains('is-world')) {
  const go = () => whenIdle().then(start).catch((e) => {
    console.error('[route313] world failed, falling back to static', e);
    root.classList.replace('is-world', 'is-static');
  });
  // phones: the poster (rendered from the world) already shows the first frame, so the world boots on the first
  // interaction or after 4 s of idle, keeping the load window for the headline and the CTA
  const onLoad = () => {
    if (tier !== 'low') return go();
    let started = false;
    const once = () => { if (started) return; started = true; evts.forEach((e) => removeEventListener(e, once)); go(); };
    const evts = ['pointerdown', 'touchstart', 'wheel', 'scroll', 'keydown'];
    evts.forEach((e) => addEventListener(e, once, { passive: true, once: true }));
    setTimeout(once, 4000);
  };
  if (document.readyState === 'complete') onLoad(); else addEventListener('load', onLoad, { once: true });
}

async function start() {
  const T = (l) => performance.mark('r313:' + l);
  T('start');
  await loadClientFonts();
  T('fonts');
  const canvas = document.getElementById('world');
  const stage = document.querySelector('.stage');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: tier === 'low', powerPreference: 'high-performance' });
  const dprCap = tier === 'high' ? 1.75 : tier === 'medium' ? 1.4 : 1.5;
  renderer.setPixelRatio(Math.min(devicePixelRatio, dprCap));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.info.autoReset = false;

  const scene = new THREE.Scene();
  const fogBase = mobile ? 0.0125 : 0.0105;
  scene.fog = new THREE.FogExp2('#050B16', fogBase);
  scene.background = new THREE.Color('#050B16');
  scene.add(new THREE.HemisphereLight('#2A3E62', '#07090D', 0.55));
  const moon = new THREE.DirectionalLight('#6F8FB8', 0.18);
  moon.position.set(-40, 80, 30);
  scene.add(moon);

  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 2600);

  // storefront sites reserved from background buildings (right side of their segment)
  const reserved = [...ACTIVE, YOUR_SHOP].map((w) => ({ segment: w.segment, from: w.along - (w.type === 'bigBox' ? 34 : w.type === 'mall' ? 26 : w.type === 'canopy' ? 18 : 12), to: w.along + (w.type === 'bigBox' ? 34 : w.type === 'mall' ? 26 : w.type === 'canopy' ? 18 : 12) }));
  T('renderer');
  await yieldToMain();
  const city = await buildCity(scene, route, { tier, reserved, camera, renderer, yieldToMain });
  T('city');
  await yieldToMain();
  const shops = [buildStorefront(scene, route, YOUR_SHOP)];
  for (const w of ACTIVE) { shops.push(buildStorefront(scene, route, w)); await yieldToMain(); }
  const targets = Object.fromEntries(shops.map((s) => [s.id, s.targetWorld]));
  T('shops');
  const trails = buildTrails(scene, route, { tier });
  T('trails');
  await yieldToMain();

  // collection layer (visible only from the air): one gold line tracing the route + a warm beacon over each lit storefront
  const routeLine = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(route.sample(2.0, 0.4, 6)), 600, 1.6, 6, false),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#E3A02A').multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }),
  );
  routeLine.visible = false;
  scene.add(routeLine);
  const beaconTex = (await import('./canvas.js')).radialTexture();
  const beacons = shops.map((s) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: beaconTex, color: new THREE.Color(s.world.light.key), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
    sp.position.copy(s.targetWorld).setY(16);
    sp.scale.setScalar(70);
    sp.visible = false;
    scene.add(sp);
    return sp;
  });

  // the streetlight in front of your (dark) storefront: it's how the hero and the finale read in the dark
  const lamp = new THREE.PointLight('#FFB070', 260, 30, 2);
  lamp.position.copy(shops[0].group.localToWorld(new THREE.Vector3(1.0, 5.8, 5.2)));
  scene.add(lamp);

  // light rig: two spill lights travel with the nearest storefronts (active ±1 rule)
  const rig = [0, 1].map(() => { const l = new THREE.PointLight('#ffffff', 0, 26, 2); scene.add(l); return l; });

  let post = null;
  if (tier !== 'low') {
    const { buildPost } = await import('./post.js');
    post = buildPost(renderer, scene, camera, { tier });
  }

  // window textures stream in route order (bakery first)
  const loader = new THREE.TextureLoader();
  const suffix = tier === 'low' ? '-win-512.webp' : '-win.webp';
  const loadTex = (name) => new Promise((res) => loader.load(`assets/work/${name}${suffix}`, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t); }, undefined, () => res(null)));
  (async () => {
    for (const shop of shops) {
      const w = shop.world;
      if (!w.textures) continue;
      const [main, alt] = await Promise.all(w.textures.map(loadTex));
      if (main) shop.windows.forEach((win) => win.setTexture(main, 0));
      if (alt) shop.windows[0].setTexture(alt, 1);
    }
  })();

  // compile every shader off the main thread where supported (KHR_parallel_shader_compile) before the first frame
  await yieldToMain();
  T('pre-compile');
  try { await renderer.compileAsync(scene, camera); } catch (e) { /* older drivers: compiles on first render */ }
  T('compiled');

  // pose state (damped toward the pure scroll pose)
  const P = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 40 };
  const cam = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 40 };
  pose(tl, route, targets, dom.progress(), P);
  cam.pos.copy(P.pos); cam.target.copy(P.target); cam.fov = P.fov;
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!coarse) addEventListener('pointermove', (e) => { look.tx = (e.clientX / innerWidth - 0.5) * 2; look.ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });

  const LENS = { x: -0.1, y: 0.13 }, lens = { x: NaN, y: NaN };
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight, false);
    lens.x = NaN;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    post?.setSize(innerWidth, innerHeight);
  });

  // runtime quality monitor: HIGH steps down to MEDIUM once if frames stay slow
  let slow = 0, stepped = false;
  const debug = params.has('debugExperience') ? debugOverlay() : null;
  let t = 0, live = false, last = performance.now();

  function frame() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    renderer.info.reset();
    t += dt;
    const p = dom.progress();
    pose(tl, route, targets, p, P);
    const k = 1 - Math.exp(-MOTION.camDamp * dt);
    cam.pos.lerp(P.pos, k);
    cam.target.lerp(P.target, k);
    cam.fov = lerp(cam.fov, P.fov, 1 - Math.exp(-MOTION.fovDamp * dt));
    look.x = lerp(look.x, look.tx, 1 - Math.exp(-MOTION.lookDamp * dt));
    look.y = lerp(look.y, look.ty, 1 - Math.exp(-MOTION.lookDamp * dt));
    camera.position.copy(cam.pos);
    camera.lookAt(cam.target);
    const lookGain = 1 - (P.aerial || 0);
    camera.rotateY(THREE.MathUtils.degToRad(-look.x * MOTION.lookYaw * lookGain));
    camera.rotateX(THREE.MathUtils.degToRad(-look.y * MOTION.lookPitch * lookGain));
    // lens shift (not tilt): the subject sits right of the copy on desktop, above the copy on phones
    const aer = P.aerial || 0;
    const sx = (mobile ? 0 : LENS.x) * (1 - aer), sy = (mobile ? LENS.y : 0) * (1 - aer);
    if (Math.abs(camera.fov - cam.fov) > 0.01 || sx !== lens.x || sy !== lens.y) {
      camera.fov = cam.fov; lens.x = sx; lens.y = sy;
      camera.setViewOffset(innerWidth, innerHeight, sx * innerWidth, sy * innerHeight, innerWidth, innerHeight);
      camera.updateProjectionMatrix();
    }

    // storefronts switch on as the car brakes; they stay lit once their system is on
    const lit = [];
    for (const s of shops) {
      const on = switchOn(tl, s.id, p, MOTION.switchRamp);
      s.update(on, t, camera);
      if (on > 0.01) lit.push({ s, on, dist: Math.abs(s.d - P.d) });
    }
    lit.sort((a, b) => a.dist - b.dist);
    rig.forEach((l, i) => {
      const e = lit[i];
      if (!e || e.dist > 90) { l.intensity = 0; return; }
      l.position.copy(e.s.lightWorld);
      l.color.set(e.s.world.light.key);
      l.intensity = e.on * e.s.world.light.intensity * 14 * (1 - smoothstep(40, 90, e.dist)); // physical units (candela)
    });

    // traffic pace: slower at stops, faster on I-75
    const seg = route.segmentAt(P.d);
    const pace = seg.kind === 'highway' ? MOTION.trailHighway : lerp(1, MOTION.trailStop, P.face || 0);
    trails.update(dt, pace);
    const air = smoothstep(0.2, 1, P.aerial || 0);
    scene.fog.density = lerp(fogBase, 0.0009, air);
    routeLine.visible = air > 0.001;
    routeLine.material.opacity = air * 0.85;
    beacons.forEach((b, i) => { b.visible = air > 0.001; b.material.opacity = air * (shops[i].id === 'yours' ? 0.25 : 0.9); });

    const past = dom.update(p, P.d, titleCase(seg.name));
    const covered = past > innerHeight * 1.4;
    if (!covered) {
      if (post) post.render(); else renderer.render(scene, camera);
      if (!live) { live = true; stage.classList.add('is-live'); T('first-frame'); }
    }

    // quality monitor (after warm-up)
    if (tier === 'high' && !stepped && t > 3) {
      slow = dt > 0.022 ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 45) { stepped = true; renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25)); post?.setSize(innerWidth, innerHeight); }
    }
    if (debug) debug(p, P, camera, renderer, tier, seg);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); root.classList.replace('is-world', 'is-static'); });
}

function titleCase(name) {
  return name.split(' ').map((w) => (/^(I-\d+|[NSEW])$/.test(w) ? w : w[0] + w.slice(1).toLowerCase())).join(' ');
}

function debugOverlay() {
  const d = document.createElement('pre');
  d.style.cssText = 'position:fixed;right:8px;top:84px;z-index:999;margin:0;background:#000c;color:#7f7;font:11px/1.35 monospace;padding:8px 10px;pointer-events:none;white-space:pre';
  document.body.appendChild(d);
  let frames = 0, last = performance.now(), fps = 0;
  return (p, P, camera, renderer, tier, seg) => {
    frames++;
    const now = performance.now();
    if (now - last > 500) { fps = (frames * 1000) / (now - last); frames = 0; last = now; }
    const s = tl.scenes.find((x) => p >= x.p0 && p < x.p1) || tl.scenes[tl.scenes.length - 1];
    const i = renderer.info.render;
    d.textContent = `p ${p.toFixed(4)}  scene ${s.id}\nd ${P.d.toFixed(1)} / ${route.length.toFixed(0)}  road ${seg.name}\ncam ${camera.position.toArray().map((v) => v.toFixed(1)).join(', ')}\nfov ${camera.fov.toFixed(1)}  face ${(P.face || 0).toFixed(2)}  aerial ${(P.aerial || 0).toFixed(2)}\ntier ${tier}  dpr ${renderer.getPixelRatio().toFixed(2)}  fps ${fps.toFixed(0)}\ncalls ${i.calls}  tris ${i.triangles}`;
  };
}

void ROAD; void clamp;
