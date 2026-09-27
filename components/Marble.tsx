'use client';
// The ground of the whole site: polished black quartz with gold seeping out of its fissures, fixed behind everything.
// The stone never moves. It is painted once (per size) into a texture; each frame only the gold glows: a slow lub-dub
// heartbeat that radiates from the mark, a soft flare when a gateway opens, and during the opening the light runs
// back along the veins into the three bars. Falls back to a painted CSS stone without WebGL; reduced motion gets one
// still frame.
import { useEffect, useRef } from 'react';
import { beat, BEAT_PERIOD } from '@/lib/beat';

const VERT = `attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const NOISE = `
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}`;

// pass 1 (once): the stone in rgb, the gold in alpha
const STONE = `
precision highp float;
uniform vec2 uRes;
${NOISE}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y) * 1.25;

  vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(p + 2.2 * q + vec2(1.7, 9.2)), fbm(p + 2.2 * q + vec2(8.3, 2.8)));
  float f = fbm(p + 2.0 * r);

  // black quartz: near-black body, smoky depth, milky crystal clouds
  vec3 col = mix(vec3(0.028, 0.027, 0.03), vec3(0.15, 0.145, 0.15), pow(smoothstep(0.32, 1.0, f), 1.5) * 0.9);
  col += vec3(0.24, 0.235, 0.24) * pow(smoothstep(0.55, 0.95, fbm(p * 2.2 + r * 1.6)), 2.2) * 0.32;
  // fine pale quartz lines, two directions, broken up so they read as crystal, not stripes
  float v3 = 1.0 - abs(sin((p.x * 0.3 - p.y * 1.2 + 2.4 * q.x + 1.8 * f) * 3.3));
  float v4 = 1.0 - abs(sin((p.x * 1.4 + p.y * 0.2 + 2.0 * r.y) * 2.6));
  float br = smoothstep(0.35, 0.7, fbm(p * 3.0 + q));
  col += vec3(0.78, 0.77, 0.75) * (pow(v3, 70.0) * 0.4 + pow(v4, 110.0) * 0.25) * br;

  // gold in the fissures: a thin bright core, and gold seeping out into the stone around it
  float w1 = p.x * 0.8 + p.y * 0.55 + 1.5 * f + 0.9 * r.x;
  float v1 = 1.0 - abs(sin(w1 * 0.95));
  float m1 = smoothstep(0.3, 0.55, fbm(p * 0.45 + vec2(7.0, 3.0)));
  float w2 = (p.y * 1.1 - p.x * 0.35 + 2.0 * r.y) * 2.2;
  float v2 = 1.0 - abs(sin(w2));
  float m2 = smoothstep(0.42, 0.62, fbm(p * 0.6 + vec2(2.0, 11.0)));
  float bleed = smoothstep(0.25, 0.85, fbm(p * 7.0 + r * 2.5));
  float core = pow(v1, 80.0) * m1 + 0.6 * pow(v2, 120.0) * m2;
  float seep = pow(v1, 10.0) * m1 * bleed * 0.45 + pow(v2, 18.0) * m2 * bleed * 0.14;
  float gold = clamp(core + seep, 0.0, 1.0);
  // the stone darkens a touch where the gold runs, like a filled crack
  col *= 1.0 - 0.35 * smoothstep(0.0, 0.4, seep);
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.012;
  gl_FragColor = vec4(col, gold);
}`;

// pass 2 (each frame): light the gold
const GLOW = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes, uHeart, uSink;
uniform float uBeat, uRing, uRingAmp, uFeed, uFlash, uDim;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec4 s = texture2D(uTex, uv);
  float g = s.a;
  // the heartbeat leaves the mark and radiates out through the veins
  float hd = length((uv - uHeart) * vec2(asp, 1.0));
  float ring = exp(-pow((hd - uRing) / 0.13, 2.0)) * uRingAmp;
  // the opening: light runs back along the veins and gathers into the bars
  float sd = length((uv - uSink) * vec2(asp, 1.0));
  float feed = exp(-pow((sd - (1.0 - uFeed) * 1.7) / 0.16, 2.0)) * sin(3.14159 * uFeed);
  float energy = 0.72 + 0.4 * uBeat + 1.1 * ring + 2.2 * feed + 0.5 * uFlash;
  vec3 deep = vec3(0.4, 0.24, 0.04), mid = vec3(0.89, 0.6, 0.15), hi = vec3(1.0, 0.86, 0.52);
  vec3 gold = mix(deep, mid, smoothstep(0.0, 0.5, g));
  gold = mix(gold, hi, smoothstep(0.5, 1.0, g) * clamp(0.35 + uBeat * 0.4 + ring + feed, 0.0, 1.0));
  vec3 col = s.rgb + gold * g * energy;
  float vig = smoothstep(1.35, 0.25, length((uv - 0.5) * vec2(asp * 0.8, 1.0)));
  col *= mix(0.78, 1.05, vig) * uDim;
  gl_FragColor = vec4(col, 1.0);
}`;

export function Marble() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const html = document.documentElement;
    const gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    const fail = (why?: string) => { if (why) console.warn('marble:', why); html.classList.add('no-marble'); };
    if (!gl) return fail();
    const program = (frag: string) => {
      const pr = gl.createProgram()!;
      for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, frag]] as const) { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(pr, s); }
      gl.linkProgram(pr);
      return gl.getProgramParameter(pr, gl.LINK_STATUS) ? pr : (fail(gl.getProgramInfoLog(pr) || 'link'), null);
    };
    const stone = program(STONE), glow = program(GLOW);
    if (!stone || !glow) return;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const attach = (pr: WebGLProgram) => { const l = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0); };
    const U = (pr: WebGLProgram, n: string) => gl.getUniformLocation(pr, n);
    const g = { res: U(glow, 'uRes'), heart: U(glow, 'uHeart'), sink: U(glow, 'uSink'), beat: U(glow, 'uBeat'), ring: U(glow, 'uRing'), ringAmp: U(glow, 'uRingAmp'), feed: U(glow, 'uFeed'), flash: U(glow, 'uFlash'), dim: U(glow, 'uDim'), tex: U(glow, 'uTex') };

    const tex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    const reduced = html.dataset.motion === 'reduced';
    const coarse = matchMedia('(pointer: coarse)').matches;
    let W = 0, H = 0;
    // paint the stone once for this size (it's the expensive part), sized to the largest viewport so a phone's
    // collapsing toolbar never forces a repaint
    const paint = () => {
      const q = Math.min(devicePixelRatio || 1, coarse ? 1.25 : 1.5);
      const w = Math.round(innerWidth * q), h = Math.round((coarse ? Math.max(innerHeight, screen.height || 0) : innerHeight) * q);
      if (Math.abs(w - W) < 2 && Math.abs(h - H) < 2) return;
      W = w; H = h; cv.width = w; cv.height = h;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h);
      gl.useProgram(stone); attach(stone);
      gl.uniform2f(U(stone, 'uRes'), w, h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(glow); attach(glow);
      gl.uniform1i(g.tex, 0);
      gl.uniform2f(g.res, w, h);
    };
    paint();

    const heart = { x: 0.5, y: 0.56 }, sink = { x: 0.2, y: 0.5 };
    let feed = 1, feedOn = false, feedT = 0, flash = 0, dim = 1, touched = performance.now(), calm = 1;
    const draw = (b: number, ring: number, ringAmp: number) => {
      gl.uniform2f(g.heart, heart.x, heart.y);
      gl.uniform2f(g.sink, sink.x, sink.y);
      gl.uniform1f(g.beat, b);
      gl.uniform1f(g.ring, ring);
      gl.uniform1f(g.ringAmp, ringAmp);
      gl.uniform1f(g.feed, feedOn ? feed : 0);
      gl.uniform1f(g.flash, flash);
      gl.uniform1f(g.dim, dim);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    if (reduced) {
      const still = () => { paint(); dim = html.dataset.phase === 'world' ? 0.9 : 1; draw(0.35, 0, 0); };
      const mo = new MutationObserver(still);
      mo.observe(html, { attributes: true, attributeFilter: ['data-phase'] });
      still();
      addEventListener('resize', still);
      return () => { removeEventListener('resize', still); mo.disconnect(); };
    }

    const onFlash = () => { flash = 1; };
    const onFeed = (e: Event) => { const d = (e as CustomEvent).detail; sink.x = d.x; sink.y = d.y; feedOn = true; feedT = performance.now(); };
    const onInput = () => { touched = performance.now(); };
    // gold elements that breathe with the stone, on the document timeline so they share its clock
    const pulse = () => document.querySelectorAll<HTMLElement>('[data-pulse]:not([data-pulsing])').forEach((el) => {
      el.dataset.pulsing = '';
      const [lo, hi] = (el.dataset.pulse || '0.2,0.6').split(',').map(Number);
      const k = (v: number) => ({ opacity: v });
      const anim = el.animate([{ offset: 0, ...k(lo) }, { offset: 0.05, ...k(hi) }, { offset: 0.13, ...k(lo + (hi - lo) * 0.2) }, { offset: 0.21, ...k(lo + (hi - lo) * 0.62) }, { offset: 0.32, ...k(lo) }, { offset: 1, ...k(lo) }], { duration: BEAT_PERIOD * 1000, iterations: Infinity });
      anim.startTime = 0;
    });
    addEventListener('marble:flash', onFlash);
    addEventListener('marble:feed', onFeed);
    addEventListener('pointermove', onInput, { passive: true });
    addEventListener('keydown', onInput);
    addEventListener('touchstart', onInput, { passive: true });
    addEventListener('resize', paint);

    let raf = 0, prev = performance.now(), n = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      if (coarse && now - prev < 30) return; // phones: the glow is slow; 30 fps is plenty
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const s = now / 1000, phase = html.dataset.phase;
      flash *= Math.pow(0.1, dt);
      if (feedOn) { feed = Math.min(1, (now - feedT) / 1100); if (feed >= 1) feedOn = false; }
      const inWorld = phase === 'world' || phase === 'leaving';
      dim += ((inWorld ? 0.9 : 1) - dim) * Math.min(1, dt * 2.5);
      // the heart is the mark: on the intro it beats from the ES, on the hub from the gateways
      const intro = phase === 'intro' || phase === 'opening';
      const hx = intro ? 0.5 : innerWidth < 900 ? 0.4 : 0.2, hy = intro ? 0.56 : 0.5;
      heart.x += (hx - heart.x) * Math.min(1, dt * 2);
      heart.y += (hy - heart.y) * Math.min(1, dt * 2);
      const x = s % BEAT_PERIOD;
      const ring = x < 0.08 ? 0 : (x - 0.08) * 1.1;
      calm += ((now - touched > 8000 ? 0.55 : 1) - calm) * Math.min(1, dt * 0.8);
      const ringAmp = (x < 0.08 ? 0 : Math.max(0, 1 - ring / 1.5)) * (inWorld ? 0.25 : 1) * calm;
      draw(beat(s) * calm, ring, ringAmp);
      if (++n % 30 === 0) pulse();
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('marble:flash', onFlash);
      removeEventListener('marble:feed', onFeed);
      removeEventListener('pointermove', onInput);
      removeEventListener('keydown', onInput);
      removeEventListener('touchstart', onInput);
      removeEventListener('resize', paint);
    };
  }, []);

  return <canvas ref={canvas} className="marble" aria-hidden="true" />;
}
