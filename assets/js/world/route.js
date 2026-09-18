// The road network: one continuous route with rounded corners (WORLD_BIBLE.md → Route).
// Stylized, not to scale. Every road name comes from a client's published address (BRAND.md),
// except I-75 S (the real interstate to Toledo) and DEARBORN (the pop-up publishes a city, not a street).
import * as THREE from 'three';

export const ROAD = {
  half: 6.5,          // centerline → curb
  sidewalk: 3.2,      // curb → property line
  laneOurs: 4.9,      // camera drives the right lane; traffic streams past in the left lane
  curb: -8.0,         // hero: standing on the opposite sidewalk, looking across the traffic at the dark storefront
  cornerR: 16,
};

// segments: name shown on signs + road markings, kind drives what the city builder places along it
export const SEGMENTS = [
  { id: 'warren', name: 'W WARREN AVE', mark: 'W WARREN', kind: 'town', to: [0, -260] },
  { id: 'ford', name: 'FORD RD', mark: 'FORD RD', kind: 'town', to: [220, -260] },
  { id: 'dearborn', name: 'DEARBORN', mark: 'DEARBORN', kind: 'town', to: [220, -470], citySign: true },
  { id: 'middlebelt', name: 'MIDDLEBELT RD', mark: 'MIDDLEBELT', kind: 'town', to: [440, -470] },
  { id: 'plymouth', name: 'PLYMOUTH RD', mark: 'PLYMOUTH', kind: 'town', to: [440, -680] },
  { id: 'i75', name: 'I-75 S', mark: 'I-75 S', kind: 'highway', to: [900, -680] },
  { id: 'monroe', name: 'MONROE ST', mark: 'MONROE ST', kind: 'town', to: [900, -900] },
];
const START = [0, 60];

export class Route {
  constructor() {
    const pts = [START, ...SEGMENTS.map((s) => s.to)].map(([x, z]) => new THREE.Vector3(x, 0, z));
    this.curve = new THREE.CurvePath();
    this.segments = [];
    const R = ROAD.cornerR;
    let cursor = pts[0].clone();
    let dist = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const dir = b.clone().sub(a).normalize();
      const isLast = i === pts.length - 1;
      const next = isLast ? null : pts[i + 1].clone().sub(b).normalize();
      const lineEnd = isLast ? b.clone() : b.clone().addScaledVector(dir, -R);
      const line = new THREE.LineCurve3(cursor.clone(), lineEnd);
      this.curve.add(line);
      const len = line.getLength();
      this.segments.push({ ...SEGMENTS[i - 1], a: cursor.clone(), b: lineEnd.clone(), dir, d0: dist, d1: dist + len, len });
      dist += len;
      if (!isLast) {
        const cEnd = b.clone().addScaledVector(next, R);
        const corner = new THREE.QuadraticBezierCurve3(lineEnd, b.clone(), cEnd);
        this.curve.add(corner);
        dist += corner.getLength();
        this.segments[this.segments.length - 1].corner = { at: b.clone(), dIn: dist - corner.getLength(), dOut: dist, turn: Math.sign(dir.x * next.z - dir.z * next.x) };
        cursor = cEnd;
      }
    }
    this.curve.updateArcLengths?.();
    this.length = this.curve.getLength();
    // arc-length lookup table (every 0.5 m): the city, trails and camera sample the route thousands of times,
    // so they read this instead of re-solving the curve's arc length each call
    this.step = 0.5;
    const n = Math.ceil(this.length / this.step) + 1;
    this.tab = new Float32Array(n * 4); // x, z, tx, tz
    const p = new THREE.Vector3(), t = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const u = Math.min(1, (i * this.step) / this.length);
      this.curve.getPointAt(u, p); this.curve.getTangentAt(u, t);
      this.tab.set([p.x, p.z, t.x, t.z], i * 4);
    }
    this.n = n;
  }

  // frame at distance d (clamped): position on the centerline, unit tangent, right vector
  frame(d, out = {}) {
    const p = (out.p ||= new THREE.Vector3());
    const t = (out.t ||= new THREE.Vector3());
    const r = (out.r ||= new THREE.Vector3());
    const f = THREE.MathUtils.clamp(d / this.step, 0, this.n - 1.0001);
    const i = Math.floor(f), k = f - i, a = i * 4, b = a + 4, T = this.tab;
    p.set(T[a] + (T[b] - T[a]) * k, 0, T[a + 1] + (T[b + 1] - T[a + 1]) * k);
    t.set(T[a + 2] + (T[b + 2] - T[a + 2]) * k, 0, T[a + 3] + (T[b + 3] - T[a + 3]) * k).normalize();
    r.set(-t.z, 0, t.x); // right of travel direction (y up)
    return out;
  }

  // point at distance d, lateral offset, height
  at(d, lateral = 0, h = 0, out = new THREE.Vector3()) {
    const f = this.frame(d, this._f || (this._f = {}));
    return out.copy(f.p).addScaledVector(f.r, lateral).setY(h);
  }

  segment(id) { return this.segments.find((s) => s.id === id); }
  segmentAt(d) { return this.segments.find((s) => d >= s.d0 && d <= (s.corner ? s.corner.dOut : s.d1)) || this.segments[this.segments.length - 1]; }

  // sample a lateral offset line along the whole route (for trails, markings, curbs)
  sample(lateral, h, step = 2, d0 = 0, d1 = this.length) {
    const pts = [];
    for (let d = d0; d <= d1; d += step) pts.push(this.at(d, lateral, h));
    return pts;
  }
}
