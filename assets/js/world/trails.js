// Traffic as long-exposure light: three gold streaks travelling with us (the mark's speed stripes),
// cool-white oncoming streaks on the other side. They run the whole route (continuity: WORLD_BIBLE.md).
import * as THREE from 'three';
import { trailMaterial } from './materials.js';

const OURS = [ // [lateral, height, spacing, carLen] — the left lane, overtaking us
  [0.95, 0.64, 52, 20],
  [2.65, 0.64, 52, 20],
  [1.8, 1.02, 71, 14],
];
const ONCOMING = [[-2.1, 0.7, 64, 16], [-3.6, 0.7, 64, 16], [-4.9, 0.72, 83, 18]];

export function buildTrails(scene, route, { tier }) {
  const group = new THREE.Group();
  group.name = 'trails';
  scene.add(group);
  const r = tier === 'low' ? 0.06 : 0.045;
  const make = (lat, h, spacing, carLen, color, intensity, reverse) => {
    const pts = route.sample(lat, h, 4);
    if (reverse) pts.reverse();
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const len = curve.getLength();
    const geo = new THREE.TubeGeometry(curve, Math.round(len / 3), r, 4, false);
    const mat = trailMaterial({ color, intensity, length: len, spacing, carLen, base: 0.26 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    group.add(mesh);
    return { mesh, mat, len };
  };
  const ours = OURS.map(([l, h, s, c]) => make(l, h, s, c, '#E3A02A', tier === 'low' ? 2.6 : 2.2, false));
  const oncoming = ONCOMING.map(([l, h, s, c]) => make(l, h, s, c, '#CFE0FF', tier === 'low' ? 1.1 : 0.9, true));
  let phaseOurs = 0, phaseOn = 0;
  return {
    group,
    // speedMul: 0.35 near stops, 2.2 on I-75 (MOTION_LANGUAGE.md)
    update(dt, speedMul, fade = 1) {
      phaseOurs += dt * 14 * speedMul;
      phaseOn += dt * 16 * Math.max(0.8, speedMul);
      for (const t of ours) { t.mat.uniforms.uPhase.value = phaseOurs; t.mat.uniforms.uFade.value = fade; }
      for (const t of oncoming) { t.mat.uniforms.uPhase.value = phaseOn; t.mat.uniforms.uFade.value = fade; }
    },
  };
}
