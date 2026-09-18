// The city: ground, sidewalks, lane markings, background buildings, streetlights, intersections, road-name type.
// Everything is procedural and instanced where repeated (draw-call budget: EXPERIENCE_ARCHITECTURE.md).
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { ROAD } from './route.js';
import { buildingMaterial, asphaltMaterial, WetReflectorShader, glowMaterial, billboardGlowMaterial } from './materials.js';
import { bladeTexture, roadMarkTexture, radialTexture, signTexture } from './canvas.js';

// deterministic PRNG so the city is identical on every load (and in QA captures)
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const yawOf = (dir) => Math.atan2(dir.x, dir.z);

export async function buildCity(scene, route, { tier, reserved = [], camera, renderer, yieldToMain = async () => {} }) {
  const group = new THREE.Group();
  group.name = 'city';
  scene.add(group);
  const rand = rng(313);
  const out = { group, streetHeads: [], updaters: [] };

  // ── ground ──
  const size = 2600, cx = 450, cz = -430;
  let ground;
  if (tier === 'high') {
    const px = Math.min(renderer.getPixelRatio(), 1.5);
    ground = new Reflector(new THREE.PlaneGeometry(size, size), {
      clipBias: 0.003,
      textureWidth: Math.round(innerWidth * px * 0.38),
      textureHeight: Math.round(innerHeight * px * 0.38),
      color: new THREE.Color('#0A0E15'),
      shader: WetReflectorShader,
    });
    ground.material.fog = true;
    ground.material.uniforms.color.value = new THREE.Color('#0A0E15');
    out.reflector = ground;
  } else {
    ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), asphaltMaterial('#0B0F16'));
  }
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(cx, 0, cz);
  group.add(ground);

  // ── sidewalks & barriers ──
  const walkMat = new THREE.MeshLambertMaterial({ color: '#141922' });
  const curbMat = new THREE.MeshLambertMaterial({ color: '#232a35' });
  const barrierMat = new THREE.MeshLambertMaterial({ color: '#1b212b' });
  for (const s of route.segments) {
    const yaw = yawOf(s.dir);
    const mid = s.a.clone().add(s.b).multiplyScalar(0.5);
    const right = new THREE.Vector3(-s.dir.z, 0, s.dir.x);
    if (s.kind === 'town') {
      for (const side of [1, -1]) {
        const lat = side * (ROAD.half + ROAD.sidewalk / 2);
        const walk = new THREE.Mesh(new THREE.BoxGeometry(ROAD.sidewalk, 0.16, s.len - 18), walkMat);
        walk.position.copy(mid).addScaledVector(right, lat).setY(0.08);
        walk.rotation.y = yaw;
        group.add(walk);
        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, s.len - 18), curbMat);
        curb.position.copy(mid).addScaledVector(right, side * (ROAD.half + 0.11)).setY(0.1);
        curb.rotation.y = yaw;
        group.add(curb);
      }
    } else {
      for (const lat of [-0.9, 9.2, -10.5]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, s.len - 10), barrierMat);
        b.position.copy(mid).addScaledVector(right, lat).setY(0.42);
        b.rotation.y = yaw;
        group.add(b);
      }
    }
  }

  performance.mark('r313:c-ground');
  await yieldToMain();
  // ── lane markings (one merged geometry for dashes, one for solid lines) ──
  const dashPos = [], solidPos = [], yellowPos = [];
  const quad = (arr, p0, p1, lat0, lat1, y = 0.02) => {
    const a = route.at(p0, lat0, y), b = route.at(p0, lat1, y), c = route.at(p1, lat1, y), d = route.at(p1, lat0, y);
    arr.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
  };
  for (let d = 0; d < route.length - 4; d += 12) {
    const seg = route.segmentAt(d);
    const lanes = seg.kind === 'highway' ? [3.6, 7.2 - 1.8] : [3.4, -3.4];
    for (const lat of lanes) quad(dashPos, d, d + 3.2, lat - 0.07, lat + 0.07);
  }
  for (let d = 0; d < route.length - 2; d += 2) {
    const seg = route.segmentAt(d);
    if (seg.kind === 'town') {
      quad(solidPos, d, d + 2, 6.0, 6.14); quad(solidPos, d, d + 2, -6.14, -6.0);
      quad(yellowPos, d, d + 2, 0.08, 0.2); quad(yellowPos, d, d + 2, -0.2, -0.08);
    } else {
      quad(solidPos, d, d + 2, 8.4, 8.54);
    }
  }
  const lineMesh = (arr, color) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, fog: true, polygonOffset: true, polygonOffsetFactor: -2 }));
    group.add(m);
    return m;
  };
  lineMesh(dashPos, '#8D8B86');
  lineMesh(solidPos, '#77756F');
  lineMesh(yellowPos, '#3A3421');

  performance.mark('r313:c-markings');
  await yieldToMain();
  // ── background buildings (instanced) ──
  const boxes = [];
  const isReserved = (segId, along, side) => reserved.some((r) => r.segment === segId && side === 1 && along > r.from && along < r.to);
  for (const s of route.segments) {
    const right = new THREE.Vector3(-s.dir.z, 0, s.dir.x);
    for (const side of [1, -1]) {
      let along = 14;
      while (along < s.len - 14) {
        const w = 8 + rand() * 13;
        const center = along + w / 2;
        if (!isReserved(s.id, center, side)) {
          const town = s.kind === 'town';
          const depth = 10 + rand() * 8;
          const tall = rand() < 0.14;
          const h = town ? (tall ? 12 + rand() * 12 : 4.5 + rand() * 6) : 8 + rand() * 26;
          const lat = side * (town ? ROAD.half + ROAD.sidewalk + depth / 2 + rand() * 1.2 : 40 + rand() * 40);
          const p = s.a.clone().addScaledVector(s.dir, center).addScaledVector(right, lat);
          boxes.push({ p, w, h, depth, yaw: yawOf(s.dir), seed: rand() });
          // a taller back row gives the skyline depth
          if (town && rand() < 0.5) {
            const h2 = 10 + rand() * 22;
            const p2 = s.a.clone().addScaledVector(s.dir, center + (rand() - 0.5) * 6).addScaledVector(right, side * (ROAD.half + ROAD.sidewalk + 26 + rand() * 18));
            boxes.push({ p: p2, w: w * (0.8 + rand() * 0.6), h: h2, depth: 14, yaw: yawOf(s.dir), seed: rand() });
          }
        }
        along += w + (rand() < 0.2 ? 6 + rand() * 8 : rand() * 1.6);
      }
    }
  }
  if (tier === 'low') boxes.splice(0, boxes.length, ...boxes.filter((_, i) => i % 5 !== 0));
  const bGeo = new THREE.BoxGeometry(1, 1, 1);
  bGeo.translate(0, 0.5, 0);
  const seeds = new Float32Array(boxes.length);
  const bMesh = new THREE.InstancedMesh(bGeo, buildingMaterial(), boxes.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  boxes.forEach((b, i) => {
    q.setFromAxisAngle(up, b.yaw);
    sc.set(b.depth, b.h, b.w); // local z = along the road
    m4.compose(b.p, q, sc);
    bMesh.setMatrixAt(i, m4);
    seeds[i] = b.seed;
  });
  bGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  bMesh.frustumCulled = false;
  group.add(bMesh);
  out.buildings = bMesh;

  performance.mark('r313:c-buildings');
  await yieldToMain();
  // ── streetlights: poles, arms, heads (instanced), pools + glow ──
  const lamps = [];
  for (const s of route.segments) {
    const right = new THREE.Vector3(-s.dir.z, 0, s.dir.x);
    const town = s.kind === 'town';
    const step = town ? 34 : 58;
    for (let along = 10; along < s.len - 6; along += step) {
      const sides = town ? [1, -1] : [-0.9];
      for (const side of sides) {
        const lat = town ? side * (ROAD.half + 0.7) : side;
        const base = s.a.clone().addScaledVector(s.dir, along + (side < 0 ? step / 2 : 0)).addScaledVector(right, lat);
        const armDir = town ? right.clone().multiplyScalar(-Math.sign(side)) : right.clone();
        lamps.push({ base, armDir, yaw: yawOf(s.dir), h: town ? 7.6 : 10.5, double: !town });
      }
    }
  }
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.1, 1, 6); poleGeo.translate(0, 0.5, 0);
  const headGeo = new THREE.BoxGeometry(0.34, 0.1, 0.62);
  const poleMat = new THREE.MeshLambertMaterial({ color: '#1A1F27' });
  const headMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFD9A8').multiplyScalar(3.2), toneMapped: false, fog: true });
  const heads = [];
  lamps.forEach((l) => {
    heads.push(l.base.clone().addScaledVector(l.armDir, 1.9).setY(l.h));
    if (l.double) heads.push(l.base.clone().addScaledVector(l.armDir, -1.9).setY(l.h));
  });
  const poles = new THREE.InstancedMesh(poleGeo, poleMat, lamps.length);
  const headMesh = new THREE.InstancedMesh(headGeo, headMat, heads.length);
  lamps.forEach((l, i) => { q.setFromAxisAngle(up, l.yaw); m4.compose(l.base, q, sc.set(1, l.h, 1)); poles.setMatrixAt(i, m4); });
  heads.forEach((h, i) => { q.identity(); m4.compose(h, q, sc.set(1, 1, 1)); headMesh.setMatrixAt(i, m4); });
  const armGeo = new THREE.BoxGeometry(0.07, 0.07, 1);
  const arms = new THREE.InstancedMesh(armGeo, poleMat, lamps.length * 2);
  let ai = 0;
  lamps.forEach((l) => {
    for (const k of l.double ? [1, -1] : [1]) {
      const c = l.base.clone().addScaledVector(l.armDir, 0.95 * k).setY(l.h + 0.05);
      q.setFromAxisAngle(up, yawOf(l.armDir));
      m4.compose(c, q, sc.set(1, 1, 1.9));
      arms.setMatrixAt(ai++, m4);
    }
  });
  arms.count = ai;
  poles.frustumCulled = headMesh.frustumCulled = arms.frustumCulled = false;
  group.add(poles, headMesh, arms);
  out.streetHeads = heads;

  // light pools on the ground (sodium), one instanced additive plane
  const poolGeo = new THREE.PlaneGeometry(1, 1); poolGeo.rotateX(-Math.PI / 2);
  const pools = new THREE.InstancedMesh(poolGeo, glowMaterial(radialTexture(), '#FF9F4A', tier === 'high' ? 0.2 : 0.3), heads.length);
  heads.forEach((h, i) => { q.identity(); m4.compose(new THREE.Vector3(h.x, 0.04, h.z), q, sc.set(11, 1, 11)); pools.setMatrixAt(i, m4); });
  pools.frustumCulled = false; pools.renderOrder = 2;
  group.add(pools);
  // halos around lamp heads (carry the glow when there's no bloom)
  const haloGeo = new THREE.PlaneGeometry(1, 1);
  const halos = new THREE.InstancedMesh(haloGeo, billboardGlowMaterial(radialTexture(), '#FFC98A', tier === 'high' ? 0.22 : 0.3), heads.length);
  heads.forEach((h, i) => { const hs = tier === 'high' ? 1.1 : 2.2;
    m4.compose(h.clone().setY(h.y - 0.1), q.identity(), sc.set(hs, hs, hs)); halos.setMatrixAt(i, m4); });
  halos.frustumCulled = false;
  group.add(halos);
  out.halos = halos;
  out.haloPositions = heads;

  performance.mark('r313:c-lights');
  await yieldToMain();
  // ── intersections: traffic signal + green blade with the road you're turning onto ──
  const sigMat = new THREE.MeshLambertMaterial({ color: '#171B22' });
  const green = new THREE.MeshBasicMaterial({ color: new THREE.Color('#39E08A').multiplyScalar(2.2), toneMapped: false, fog: true });
  const dim = new THREE.MeshBasicMaterial({ color: '#1C2A22', fog: true });
  route.segments.forEach((s, i) => {
    if (!s.corner) return;
    const next = route.segments[i + 1];
    const right = new THREE.Vector3(-s.dir.z, 0, s.dir.x);
    const turn = s.corner.turn; // +1 right, -1 left
    const corner = s.corner.at.clone().addScaledVector(s.dir, -ROAD.cornerR - 2).addScaledVector(right, ROAD.half + 1.2);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 7, 8), sigMat);
    pole.position.copy(corner).setY(3.5);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 7.5), sigMat);
    arm.position.copy(corner).addScaledVector(right, -3.7).setY(6.6);
    arm.rotation.y = yawOf(right);
    const head = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.25, 0.34), sigMat);
    head.add(box);
    [[0.4, dim], [0, dim], [-0.4, green]].forEach(([y, mat]) => { const l = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), mat); l.position.set(0, y, 0.18); head.add(l); });
    head.position.copy(corner).addScaledVector(right, -5.2).setY(5.8);
    head.rotation.y = yawOf(s.dir.clone().multiplyScalar(-1));
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.57), new THREE.MeshBasicMaterial({ map: bladeTexture(titleCase(next.name)), fog: true, side: THREE.DoubleSide }));
    blade.position.copy(corner).setY(6.1).addScaledVector(right, -0.2);
    blade.rotation.y = yawOf(s.dir.clone().multiplyScalar(-1));
    blade.position.addScaledVector(s.dir, -0.18);
    group.add(pole, arm, head, blade);
    void turn;
  });

  performance.mark('r313:c-intersections');
  await yieldToMain();
  // ── road-name type painted on the asphalt, just after each turn ──
  for (const s of route.segments) {
    const tex = roadMarkTexture(s.mark);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 9.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: true, polygonOffset: true, polygonOffsetFactor: -3, color: '#B9B6AE' }));
    const d = s.d0 + (s.id === 'warren' ? 118 : 34); // W Warren: past your storefront, never behind the hero/finale copy
    const p = route.at(d, ROAD.laneOurs, 0.03);
    m.rotation.set(-Math.PI / 2, 0, 0);
    const holder = new THREE.Group();
    holder.position.copy(p);
    holder.rotation.y = yawOf(s.dir) + Math.PI; // canvas top points away from the approaching driver
    holder.add(m);
    group.add(holder);
  }

  performance.mark('r313:c-roadtype');
  // ── Dearborn city-limit sign, I-75 gantry ──
  const cSeg = route.segment('dearborn');
  if (cSeg) {
    const right = new THREE.Vector3(-cSeg.dir.z, 0, cSeg.dir.x);
    const p = cSeg.a.clone().addScaledVector(cSeg.dir, 22).addScaledVector(right, ROAD.half + 1.8);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.5), new THREE.MeshBasicMaterial({ map: signTexture({ text: 'DEARBORN', font: 'Overpass', weight: 800, fg: '#F2EFE8', bg: '#0E5B3A', size: 0.5, w: 768, h: 336, border: '#F2EFE8' }), fog: true }));
    panel.position.copy(p).setY(2.6);
    panel.rotation.y = yawOf(cSeg.dir.clone().multiplyScalar(-1));
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6), sigMat);
    post.position.copy(p).setY(1.0);
    group.add(panel, post);
  }
  const hSeg = route.segment('i75');
  if (hSeg) {
    const right = new THREE.Vector3(-hSeg.dir.z, 0, hSeg.dir.x);
    const at = hSeg.a.clone().addScaledVector(hSeg.dir, 330);
    const gantry = new THREE.Group();
    for (const lat of [-11, 10]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 0.4), sigMat); leg.position.copy(at).addScaledVector(right, lat).setY(4); gantry.add(leg); }
    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 21), sigMat);
    truss.position.copy(at).addScaledVector(right, -0.5).setY(7.6); truss.rotation.y = yawOf(right);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 3.0), new THREE.MeshBasicMaterial({ map: signTexture({ text: 'I-75 SOUTH · TOLEDO', font: 'Overpass', weight: 800, fg: '#F2EFE8', bg: '#0E5B3A', size: 0.36, w: 1024, h: 362, border: '#F2EFE8' }), fog: true }));
    sign.position.copy(at).addScaledVector(right, 4).setY(7.4).addScaledVector(hSeg.dir, -0.3);
    sign.rotation.y = yawOf(hSeg.dir.clone().multiplyScalar(-1));
    gantry.add(truss, sign);
    group.add(gantry);
  }

  // ── sky: horizon glow of a city at night ──
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTop: { value: new THREE.Color('#02050B') }, uHorizon: { value: new THREE.Color('#122036') }, uGlow: { value: new THREE.Color('#2A2A3A') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uTop, uHorizon, uGlow; varying vec3 vP;
      void main(){ float h = clamp(vP.y, -0.2, 1.0); vec3 c = mix(uHorizon, uTop, smoothstep(0.0, 0.35, h)); c += uGlow * exp(-abs(h) * 22.0) * 0.6;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  }));
  sky.position.set(cx, 0, cz);
  group.add(sky);
  out.sky = sky;

  return out;
}

function titleCase(name) {
  return name.split(' ').map((w) => (/^(I-\d+|[NSEW])$/.test(w) ? w : w[0] + w.slice(1).toLowerCase())).join(' ');
}
