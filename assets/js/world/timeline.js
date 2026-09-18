// Scroll = film edit. Builds the master chronology from the world records and returns a PURE pose(p):
// the same progress always gives the same camera, so reverse scroll is exact (STORYBOARD.md).
import * as THREE from 'three';
import { ROAD } from './route.js';
import { clamp, lerp, smoothstep, drive } from './motion.js';

const W_ENTRY = 0.55, W_SYSTEM = 0.6, W_COLLECTION = 1.0, W_COMMERCE = 1.0;

export function buildTimeline(route, worlds, yours, { mobile = false, includeFinale = true } = {}) {
  const key = mobile ? 'mobile' : 'desktop';
  const dOf = (w) => route.segment(w.segment).d0 + w.along;
  const dShop = dOf(yours);

  // scene weights → progress ranges
  const scenes = [{ id: 'entry', w: W_ENTRY }, { id: 'system', w: W_SYSTEM }, ...worlds.map((w) => ({ id: w.id, w: w.weight, world: w }))];
  if (includeFinale) scenes.push({ id: 'collection', w: W_COLLECTION }, { id: 'commerce', w: W_COMMERCE });
  const total = scenes.reduce((s, x) => s + x.w, 0);
  let acc = 0;
  for (const s of scenes) { s.p0 = acc / total; acc += s.w; s.p1 = acc / total; }

  // stations: {p, d, lane, h, fov, face, target, lookUp}
  const st = [];
  const hero = { d: dShop - (mobile ? 15 : 17), lane: ROAD.curb, h: mobile ? 1.65 : 1.62, fov: mobile ? 56 : 40, face: mobile ? 0.97 : 0.8, target: 'yours', lookUp: 0 };
  const entry = scenes[0], system = scenes[1];
  st.push({ p: entry.p0, ...hero }, { p: entry.p1, ...hero });
  let prevOut = { d: dShop + 14, lane: ROAD.laneOurs, h: 1.35, fov: 42, face: 0, target: null, lookUp: 0 };
  // system: pull away from the curb and drive past your (still dark) storefront
  st.push({ p: system.p1, ...prevOut });

  for (const s of scenes.slice(2)) {
    const w = s.world;
    if (!w) continue;
    const c = w.cam[key];
    const d = dOf(w);
    const r = s.p1 - s.p0;
    const stop = { d: d - c.before, lane: c.lane, h: c.h, fov: c.fov, face: c.face ?? (w.passBy ? 0.62 : 0.8), target: w.id, lookUp: c.lookUp || 0 };
    s.brakeP = s.p0 + r * 0.45;
    s.holdP = s.p0 + r * 0.82;
    st.push({ p: s.brakeP, ...stop });
    st.push({ p: s.holdP, ...stop, d: stop.d + (w.passBy ? 16 : 1.5) });
    prevOut = { d: d + (w.passBy ? 70 : 30), lane: ROAD.laneOurs, h: mobile ? 1.5 : 1.35, fov: w.passBy ? c.fov : (mobile ? 56 : 42), face: 0, target: null, lookUp: 0 };
    st.push({ p: s.p1, ...prevOut });
  }

  const tl = { scenes, stations: st, total, dShop, dOf, mobile, includeFinale };
  const collection = scenes.find((s) => s.id === 'collection');
  const commerce = scenes.find((s) => s.id === 'commerce');
  if (collection) {
    // aerial: rise over the route, glide back, descend to your storefront (a blend layer over the route pose)
    const mid = route.at(route.length * 0.45, 0, 0);
    // frame the whole route: bbox center, high and steep (collection = top-down reveal)
    tl.aerial = {
      pos: new THREE.Vector3(430, mobile ? 900 : 560, mobile ? -250 : -40),
      target: new THREE.Vector3(470, 0, -470),
      fov: mobile ? 62 : 46,
    };
    void mid;
    // during the aerial hold the ground pose teleports (hidden) from the last world to your storefront
    st.push({ p: lerp(collection.p0, collection.p1, 0.5), ...prevOut, d: prevOut.d + 20 });
    st.push({ p: lerp(collection.p0, collection.p1, 0.52), d: dShop - (mobile ? 40 : 36), lane: ROAD.laneOurs, h: 1.35, fov: 42, face: 0.3, target: 'yours', lookUp: 0 });
    const cf = { d: dShop - (mobile ? 9 : 14), lane: mobile ? 4.4 : 4.6, h: mobile ? 1.6 : 1.4, fov: mobile ? 58 : 40, face: mobile ? 0.9 : 0.8, target: 'yours', lookUp: 0 };
    st.push({ p: commerce.p0 + (commerce.p1 - commerce.p0) * 0.45, ...cf });
    st.push({ p: commerce.p1, ...cf, d: cf.d + 1 });
  }
  st.sort((a, b) => a.p - b.p);
  return tl;
}

const _fwd = new THREE.Vector3(), _face = new THREE.Vector3(), _faceB = new THREE.Vector3();

// targets: map worldId → Vector3 (window centers, filled by the storefront builder)
export function pose(tl, route, targets, p, out) {
  const st = tl.stations;
  p = clamp(p);
  let i = 0;
  while (i < st.length - 2 && p > st[i + 1].p) i++;
  const A = st[i], B = st[i + 1];
  const t = B.p > A.p ? clamp((p - A.p) / (B.p - A.p)) : 1;
  const td = A.d === B.d ? t : drive(t);
  const d = lerp(A.d, B.d, td);
  const ts = smoothstep(0, 1, t);
  const lane = lerp(A.lane, B.lane, ts);
  const h = lerp(A.h, B.h, ts);
  const fov = lerp(A.fov, B.fov, ts);
  // turn late when arriving, early when leaving
  const face = B.face > A.face ? lerp(A.face, B.face, smoothstep(0.5, 1, t)) : lerp(A.face, B.face, smoothstep(0, 0.5, t));
  const lookUp = lerp(A.lookUp, B.lookUp, ts);

  out.d = d;
  route.at(d, lane, h, out.pos);
  route.at(d + 34, lane * 0.55, h + 0.25, _fwd);
  const ta = A.target && targets[A.target], tb = B.target && targets[B.target];
  if (ta || tb) {
    _face.copy(ta || tb);
    if (ta && tb && ta !== tb) _faceB.copy(tb), _face.lerp(_faceB, ts);
    out.target.copy(_fwd).lerp(_face, face);
  } else out.target.copy(_fwd);
  out.target.y += Math.tan(THREE.MathUtils.degToRad(lookUp)) * out.pos.distanceTo(out.target);
  out.fov = fov;
  out.face = face;
  out.speed = Math.abs(B.d - A.d) / Math.max(1e-4, B.p - A.p); // route meters per unit progress (for trail pacing)

  // aerial blend (collection)
  const c = tl.scenes.find((s) => s.id === 'collection');
  out.aerial = 0;
  if (c && tl.aerial) {
    const r = c.p1 - c.p0;
    const up = smoothstep(c.p0, c.p0 + r * 0.38, p);
    const down = 1 - smoothstep(c.p0 + r * 0.62, c.p1, p);
    const a = Math.min(up, down);
    out.aerial = a;
    if (a > 0) {
      const e = smoothstep(0, 1, a);
      out.pos.lerp(tl.aerial.pos, e);
      out.target.lerp(tl.aerial.target, e);
      out.fov = lerp(out.fov, tl.aerial.fov, e);
    }
  }
  return out;
}

// which scene is active, and a 0..1 visibility for each world's DOM panel / switch-on
export function sceneAt(tl, p) {
  return tl.scenes.find((s) => p >= s.p0 && p < s.p1) || tl.scenes[tl.scenes.length - 1];
}

export function switchOn(tl, worldId, p, ramp = 0.012) {
  if (worldId === 'yours') {
    const c = tl.scenes.find((s) => s.id === 'commerce');
    if (!c) return 0;
    const at = c.p0 + (c.p1 - c.p0) * 0.3;
    return smoothstep(at - ramp, at, p);
  }
  const s = tl.scenes.find((x) => x.id === worldId);
  if (!s) return 0;
  const at = s.brakeP - (s.p1 - s.p0) * 0.1;
  return smoothstep(at - ramp, at, p);
}
