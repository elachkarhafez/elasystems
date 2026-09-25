// Route 313 — boot + ExperienceDirector loop. Architecture: docs/creative/EXPERIENCE_ARCHITECTURE.md.
import * as THREE from 'three';
import { Route, ROAD } from './route.js';
import { WORLDS, YOUR_SHOP } from './worlds.js';
import { buildTimeline, pose, switchOn } from './timeline.js';
import { buildCity } from './city.js';
import { buildStorefront } from './storefronts.js';
import { buildTrails } from './trails.js';
import { buildRain } from './rain.js';
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
  const rain = buildRain(scene, { tier });
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

  // Cinematography layer. Everything here is ambient: it comes from how the camera is moving (speed, braking,
  // turning) or from time, never from scroll position, so the scroll pose stays pure and reverse scroll still
  // lands on identical compositions.
  const C = {
    intro: tier !== 'low' && dom.progress() < 0.02 && !params.has('nointro') ? 1 : 0, // opening crane shot
    vel: new THREE.Vector3(), speedN: 0, prevPos: cam.pos.clone(), prevSpeed: 0,
    prevYaw: NaN, roll: 0, dip: 0, lb: -1, flash: 0,
    exposure: tier === 'low' ? 1.05 : 0.35,
  };
  const crane = new THREE.Vector3(), craneT = new THREE.Vector3(), tmp = new THREE.Vector3(), fwd = new THREE.Vector3(), aim = new THREE.Vector3();
  const flick = new Map(); // storefront id → { was, t0 }: the neon stutter when a system switches on
  const FLICK = [[0.05, 0.9], [0.1, 0.08], [0.16, 0.75], [0.2, 0.05], [0.34, 0.05], [0.4, 1.0], [0.46, 0.35], [0.52, 1.0]];
  const flickAt = (tt) => { for (const [e, v] of FLICK) if (tt < e) return v; return 1; };
  const endIntro = () => { C.intro = Math.min(C.intro, 0.35); };
  addEventListener('wheel', endIntro, { passive: true, once: true });
  addEventListener('touchstart', endIntro, { passive: true, once: true });
  addEventListener('keydown', endIntro, { once: true });
  if (C.intro) root.classList.add('is-rolling');

  const LENS = { x: -0.1, y: 0.13 }, lens = { x: NaN, y: NaN, fov: NaN };
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
    const aer = P.aerial || 0;

    // measured motion of the (damped) car: speed, acceleration, turn rate
    if (dt > 0) C.vel.lerp(tmp.subVectors(cam.pos, C.prevPos).divideScalar(dt), 1 - Math.exp(-8 * dt));
    C.prevPos.copy(cam.pos);
    const spd = Math.hypot(C.vel.x, C.vel.z) * (1 - aer) * (1 - smoothstep(6, 28, cam.pos.y)); // speed effects belong to street level
    const accel = (spd - C.prevSpeed) / Math.max(dt, 1e-3);
    C.prevSpeed = spd;
    C.speedN = lerp(C.speedN, clamp(spd / 38), 1 - Math.exp(-4 * dt));
    fwd.subVectors(cam.target, cam.pos);
    const yaw = Math.atan2(fwd.x, fwd.z);
    let dYaw = Number.isNaN(C.prevYaw) ? 0 : yaw - C.prevYaw;
    if (dYaw > Math.PI) dYaw -= Math.PI * 2; else if (dYaw < -Math.PI) dYaw += Math.PI * 2;
    C.prevYaw = yaw;
    const yawRate = dYaw / Math.max(dt, 1e-3);
    // bank into corners and dip the nose under braking (a heavy, well-tuned car)
    C.roll = lerp(C.roll, clamp(yawRate * 0.05 * clamp(spd / 12), -0.07, 0.07) * (1 - aer), 1 - Math.exp(-3 * dt));
    C.dip = lerp(C.dip, clamp(-accel * 0.0022, -0.02, 0.012) * (1 - aer), 1 - Math.exp(-5 * dt));

    // opening crane: 4.4 s from high and wide down onto the dark storefront (scrolling hurries it along)
    let introE = 0;
    if (C.intro > 0) {
      C.intro = Math.max(0, C.intro - (dt / 4.4) * (p > 0.004 ? 3 : 1));
      introE = C.intro * C.intro * (3 - 2 * C.intro);
      // high over the road, 46 m back along the route, looking down the street at the dark storefront
      route.at(P.d - 46, 1.2, 26, crane);
      craneT.copy(cam.target);
      craneT.y -= 4;
      if (C.intro <= 0) root.classList.remove('is-rolling');
    }
    camera.position.copy(cam.pos).lerp(crane, introE);
    camera.lookAt(aim.copy(cam.target).lerp(craneT, introE));

    const lookGain = 1 - aer;
    camera.rotateY(THREE.MathUtils.degToRad(-look.x * MOTION.lookYaw * lookGain));
    camera.rotateX(THREE.MathUtils.degToRad(-look.y * MOTION.lookPitch * lookGain));
    // handheld: a camera operator breathing; calmer at speed, where the car carries the shot
    const hh = (1 - aer) * (1 - C.speedN * 0.6) * (coarse ? 0.6 : 1);
    camera.rotateY(THREE.MathUtils.degToRad((Math.sin(t * 0.83) * 0.6 + Math.sin(t * 1.91) * 0.3) * 0.22 * hh));
    camera.rotateX(THREE.MathUtils.degToRad((Math.sin(t * 0.67 + 1.3) * 0.6 + Math.sin(t * 2.3) * 0.25) * 0.16 * hh) + C.dip);
    camera.rotateZ(C.roll + Math.sin(t * 0.51) * 0.0025 * hh);

    // lens: shift (not tilt) keeps the subject clear of the copy; speed widens the lens so the road stretches
    const sx = (mobile ? 0 : LENS.x) * (1 - aer), sy = (mobile ? LENS.y : 0) * (1 - aer);
    const fov = cam.fov + C.speedN * (mobile ? 5 : 7) + introE * 8;
    if (Math.abs(fov - lens.fov) > 0.01 || sx !== lens.x || sy !== lens.y) {
      camera.fov = lens.fov = fov; lens.x = sx; lens.y = sy;
      camera.setViewOffset(innerWidth, innerHeight, sx * innerWidth, sy * innerHeight, innerWidth, innerHeight);
      camera.updateProjectionMatrix();
    }

    // storefronts switch on as the car brakes, with a neon stutter and a flash; they stay lit once on
    const lit = [];
    let flash = 0;
    for (const s of shops) {
      const on = switchOn(tl, s.id, p, MOTION.switchRamp);
      let f = flick.get(s.id);
      if (!f) flick.set(s.id, (f = { was: on > 0.5, t0: -9 }));
      if (on > 0.5 && !f.was) f.t0 = t;
      f.was = on > 0.5;
      const tt = t - f.t0;
      const stutter = tt < 0.6 ? flickAt(tt) : 1;
      if (tt < 0.9) flash = Math.max(flash, (1 - tt / 0.9) * (s.id === 'yours' ? 1 : 0.55) * (tt > 0.34 ? 1 : 0.3));
      s.update(on * stutter, t, camera);
      if (on > 0.01) lit.push({ s, on: on * stutter, dist: Math.abs(s.d - P.d) });
    }
    C.flash = lerp(C.flash, flash, 1 - Math.exp(-18 * dt));
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
    const air = Math.max(smoothstep(0.2, 1, aer), smoothstep(18, 240, camera.position.y));
    rain.update(t, camera.position, tmp.set(C.vel.x, 0, C.vel.z), 1 - smoothstep(34, 70, camera.position.y));
    scene.fog.density = lerp(fogBase, 0.0009, air);
    routeLine.visible = air > 0.001;
    routeLine.material.opacity = air * 0.85;
    beacons.forEach((b, i) => { b.visible = air > 0.001; b.material.opacity = air * (shops[i].id === 'yours' ? 0.25 : 0.9); });

    // exposure: the iris settles on the first frames
    C.exposure = lerp(C.exposure, 1.05, 1 - Math.exp(-1.6 * dt));
    renderer.toneMappingExposure = C.exposure;
    // letterbox: scope bars close in while the car travels and open when it stops
    const lb = Math.round(clamp(Math.max(C.speedN * 1.6, introE)) * (1 - air) * 100) / 100;
    if (lb !== C.lb) { C.lb = lb; root.style.setProperty('--lb', lb); }

    const past = dom.update(p, P.d, titleCase(seg.name));
    const covered = past > innerHeight * 1.4;
    if (!covered) {
      if (post) {
        // vanishing point on screen (where the car is heading) for the speed blur
        tmp.copy(cam.pos).addScaledVector(fwd.set(C.vel.x, 0, C.vel.z).normalize(), 60).project(camera);
        const vx = clamp(tmp.x * 0.5 + 0.5, 0.2, 0.8), vy = clamp(tmp.y * 0.5 + 0.5, 0.25, 0.75);
        post.frame(t, { speed: C.speedN * (1 - introE), flash: C.flash, focusX: Number.isFinite(vx) ? vx : 0.5, focusY: Number.isFinite(vy) ? vy : 0.5 });
        post.render();
      } else renderer.render(scene, camera);
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
