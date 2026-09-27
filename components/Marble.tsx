'use client';
// The ground of the whole site: black marble with veins of the logo's gold, rendered live (WebGL, one full-screen
// triangle). The veins brighten on a heartbeat, catch the light where the pointer is, drift as you scroll, flare when
// a gateway opens, and a few flecks of gold leaf glint. Falls back to a CSS marble when WebGL isn't available;
// with reduced motion it renders one still frame.
import { useEffect, useRef } from 'react';
import { beat, BEAT_PERIOD } from '@/lib/beat';

const VERT = `attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uBeat, uFlow, uFlash, uDim, uRing, uRingAmp;
uniform vec2 uPtr, uHeart;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y) * 1.15 + vec2(0.0, uFlow);
  float t = uTime * 0.012;

  // domain-warped stone
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 2.2 * q + vec2(1.7, 9.2) + 0.5 * t), fbm(p + 2.2 * q + vec2(8.3, 2.8)));
  float f = fbm(p + 2.0 * r);

  vec3 deep = vec3(0.16, 0.14, 0.12);
  vec3 smoke = vec3(0.36, 0.33, 0.29);
  vec3 col = mix(deep, smoke, smoothstep(0.3, 0.95, f) * 0.85);
  col = mix(col, vec3(0.24, 0.215, 0.185), smoothstep(0.45, 0.8, length(q)) * 0.4);
  // faint grey calcite threads through the body, the way real stone has more than one kind of vein
  float v3 = 1.0 - abs(sin((p.x * 0.3 - p.y * 1.2 + 2.4 * q.x + 1.8 * f) * 3.3));
  col += vec3(0.6, 0.56, 0.5) * pow(v3, 26.0) * 0.1;

  // gold: two to four long seams per view that taper as they run, plus a few fine cracks
  float w1 = p.x * 0.8 + p.y * 0.55 + 1.5 * f + 0.9 * r.x;
  float w2 = (p.y * 1.1 - p.x * 0.35 + 2.0 * r.y) * 2.2;
  float v1 = 1.0 - abs(sin(w1 * 0.95));
  float v2 = 1.0 - abs(sin(w2));
  float m1 = smoothstep(0.3, 0.55, fbm(p * 0.45 + vec2(7.0, 3.0)));
  float m2 = smoothstep(0.4, 0.62, fbm(p * 0.6 + vec2(2.0, 11.0)));
  float wid = smoothstep(0.25, 0.75, fbm(p * 0.35 + vec2(3.0, 5.0)));
  float taper = mix(22.0, 56.0, wid);
  // where a seam widens it also thins out in colour, so no stretch of the slab can read as a bolt
  float vein = pow(v1, taper) * m1 * mix(0.55, 1.0, wid) + 0.18 * pow(v2, 64.0) * m2;
  float halo = pow(v1, 7.0) * 0.12 * m1;

  // light: the heartbeat, the pointer (or a slow wandering light), a soft flare when a gateway opens
  vec2 d = (uv - uPtr) * vec2(asp, 1.0);
  float light = exp(-2.4 * length(d));
  // each lub leaves the mark and travels out through the stone
  float hd = length((uv - uHeart) * vec2(asp, 1.0));
  float ring = exp(-pow((hd - uRing) / 0.1, 2.0)) * uRingAmp;
  float energy = 0.55 + 0.45 * uBeat + 0.45 * light + 1.1 * ring;
  vec3 goldLo = vec3(0.42, 0.26, 0.04);
  vec3 goldMid = vec3(0.89, 0.63, 0.16);
  vec3 goldHi = vec3(0.97, 0.82, 0.48);
  vec3 gold = mix(goldLo, goldMid, clamp(vein * 1.4, 0.0, 1.0));
  // metal catches light rather than glowing: the bright tone only where the light (or the pulse) is
  gold = mix(gold, goldHi, clamp(vein * (pow(light, 3.0) * 2.2 + ring * 1.2), 0.0, 1.0));
  col += gold * vein * energy;
  col += vec3(0.9, 0.58, 0.16) * halo * (0.25 + 0.35 * uBeat + 0.35 * uFlash + 0.8 * ring);

  // polished surface: a broad soft reflection that follows the light
  col += vec3(0.95, 0.85, 0.7) * light * 0.045;

  // flecks of gold leaf, glinting near the veins
  vec2 g = p * 16.0;
  vec2 gi = floor(g);
  float h = hash(gi);
  vec2 o = vec2(hash(gi + 1.3), hash(gi + 7.1)) - 0.5;
  float dd = length(fract(g) - 0.5 - o * 0.6);
  float tw = pow(0.5 + 0.5 * sin(uTime * (0.8 + h * 2.5) + h * 40.0), 8.0);
  float fleck = step(0.95, h) * smoothstep(0.1, 0.0, dd) * (0.25 + 0.75 * tw) * smoothstep(0.05, 0.6, halo + 0.15);
  col += goldHi * fleck * (0.5 + 0.9 * light + 0.3 * uBeat + ring);

  // vignette and a little grain so it reads as stone, not a gradient
  float vig = smoothstep(1.3, 0.2, length((uv - 0.5) * vec2(asp * 0.8, 1.0)));
  col *= mix(0.7, 1.06, vig);
  col += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 100.0) - 0.5) * 0.02;
  col *= uDim;
  gl_FragColor = vec4(col, 1.0);
}`;

export function Marble() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    if (!gl) { document.documentElement.classList.add('no-marble'); return; }
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('marble:', gl.getProgramInfoLog(prog)); document.documentElement.classList.add('no-marble'); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U('uRes'), uTime = U('uTime'), uBeat = U('uBeat'), uFlow = U('uFlow'), uFlash = U('uFlash'), uPtr = U('uPtr'), uDim = U('uDim'), uHeart = U('uHeart'), uRing = U('uRing'), uRingAmp = U('uRingAmp');

    const reduced = document.documentElement.dataset.motion === 'reduced';
    const mobile = matchMedia('(max-width: 899px), (pointer: coarse)').matches;
    const coarse = matchMedia('(pointer: coarse)').matches;
    // the stone is soft: render below CSS resolution and let the browser upscale
    let scale = mobile ? 0.5 : 0.62;
    const size = () => {
      const w = Math.max(1, Math.round(innerWidth * scale)), h = Math.max(1, Math.round(innerHeight * scale));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
      gl.uniform2f(uRes, w, h);
    };
    size();

    const ptr = { x: 0.62, y: 0.55, tx: 0.62, ty: 0.55 };
    let flow = 0, vel = 0, lastY = scrollY, flash = 0, dim = 1, ring = 0, ringAmp = 0, calm = 1;
    const heart = { x: 0.5, y: 0.56 };
    let moved = -1e9, touched = performance.now();
    const onMove = (e: PointerEvent) => { ptr.tx = e.clientX / innerWidth; ptr.ty = 1 - e.clientY / innerHeight; moved = touched = performance.now(); };
    const onFlash = () => { flash = 1; };
    const onScroll = () => {
      const y = scrollY;
      // jumps (a world resetting to its top, deep links) are not the visitor scrolling
      if (Math.abs(y - lastY) < innerHeight) vel += (y - lastY) / innerHeight;
      lastY = y;
      touched = performance.now();
    };
    // gold elements that breathe with the stone: animated on the document timeline so they share its clock
    const pulse = () => document.querySelectorAll<HTMLElement>('[data-pulse]:not([data-pulsing])').forEach((el) => {
      el.dataset.pulsing = '';
      const [lo, hi] = (el.dataset.pulse || '0.2,0.6').split(',').map(Number);
      const k = (v: number) => ({ opacity: v });
      const anim = el.animate([{ offset: 0, ...k(lo) }, { offset: 0.05, ...k(hi) }, { offset: 0.13, ...k(lo + (hi - lo) * 0.2) }, { offset: 0.21, ...k(lo + (hi - lo) * 0.62) }, { offset: 0.32, ...k(lo) }, { offset: 1, ...k(lo) }], { duration: 1600, iterations: Infinity, easing: 'linear' });
      anim.startTime = 0;
    });
    let n = 0;

    const draw = (s: number, b: number) => {
      gl.uniform1f(uTime, s);
      gl.uniform1f(uBeat, b);
      gl.uniform1f(uFlow, flow);
      gl.uniform1f(uFlash, flash);
      gl.uniform1f(uDim, dim);
      gl.uniform2f(uHeart, heart.x, heart.y);
      gl.uniform1f(uRing, ring);
      gl.uniform1f(uRingAmp, ringAmp);
      gl.uniform2f(uPtr, ptr.x, ptr.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    if (reduced) {
      const still = () => { dim = document.documentElement.dataset.phase === 'world' ? 0.88 : 1; size(); draw(12, 0.35); };
      const mo = new MutationObserver(still);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-phase'] });
      still();
      addEventListener('resize', still);
      return () => { removeEventListener('resize', still); mo.disconnect(); };
    }

    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('marble:flash', onFlash);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', size);
    let raf = 0, prev = performance.now(), slow = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      if (coarse && now - prev < 30) return;
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      // adapt: if frames keep running long, render the stone at a lower resolution
      slow = dt > (coarse ? 0.045 : 0.024) ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 40 && scale > 0.34) { scale -= 0.08; slow = 0; size(); }
      const s = now / 1000, b = beat(s);
      // with no pointer (phones, or a still hand) the light wanders slowly across the slab
      if (now - moved > 4000) { ptr.tx = 0.5 + 0.32 * Math.sin(s * 0.11); ptr.ty = 0.52 + 0.22 * Math.sin(s * 0.17 + 1.3); }
      ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * (now - moved > 4000 ? 0.6 : 3));
      ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 3);
      // scrolling glides the slab under the light; it does not wake the gold
      flow += vel * 0.5;
      vel *= Math.pow(0.02, dt);
      flash *= Math.pow(0.08, dt);
      const phase = document.documentElement.dataset.phase;
      // inside a world the stone steps back a little so the work and the words lead
      const dimTo = phase === 'world' || phase === 'leaving' ? 0.88 : 1;
      dim += (dimTo - dim) * Math.min(1, dt * 2.5);
      // the heart is the mark: on the intro it beats from the ES, on the hub from the gateways
      const narrow = innerWidth < 900;
      const hx = phase === 'intro' || phase === 'opening' ? 0.5 : narrow ? 0.4 : 0.2;
      const hy = phase === 'intro' || phase === 'opening' ? 0.56 : narrow ? 0.5 : 0.5;
      heart.x += (hx - heart.x) * Math.min(1, dt * 2);
      heart.y += (hy - heart.y) * Math.min(1, dt * 2);
      const x = s % BEAT_PERIOD;
      ring = x < 0.08 ? 0 : (x - 0.08) * 1.15;
      const inWorld = phase === 'world' || phase === 'leaving';
      // after a while without input the pulse settles to half, so it never nags
      calm += ((now - touched > 8000 ? 0.5 : 1) - calm) * Math.min(1, dt * 0.8);
      ringAmp = (x < 0.08 ? 0 : Math.max(0, 1 - ring / 1.5)) * (inWorld ? 0.25 : 1) * calm;
      draw(s, b * calm);
      if (++n % 30 === 0) pulse();
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
      removeEventListener('marble:flash', onFlash);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', size);
    };
  }, []);

  return <canvas ref={canvas} className="marble" aria-hidden="true" />;
}
