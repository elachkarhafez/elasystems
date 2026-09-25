// Post: bloom (emissive storytelling) + the "cinema" pass + film finish. HIGH/MEDIUM only (phones get CSS grain).
//  cinema (linear HDR, before tone mapping): speed zoom-blur toward the vanishing point, anamorphic horizontal
//    streaks on the brightest lights (streetlamps, signs, trails), switch-on flash, night grade, vignette.
//  film (display space, after OutputPass): animated grain + a little chromatic fringe at the frame edges.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';

const CinemaShader = {
  name: 'Cinema',
  defines: { BLUR_TAPS: 8, STREAK_TAPS: 7 },
  uniforms: {
    tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uAspect: { value: 1 },
    uSpeed: { value: 0 }, uFocus: { value: new THREE.Vector2(0.5, 0.5) }, uStreak: { value: 0.55 }, uFlash: { value: 0 },
    uVignette: { value: 0.5 }, uShadow: { value: new THREE.Color('#4E6E9A') }, uHigh: { value: new THREE.Color('#FFB46A') }, uAmount: { value: 0.12 },
  },
  vertexShader: VS,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform vec2 uRes, uFocus; uniform float uAspect, uSpeed, uStreak, uFlash, uVignette, uAmount;
    uniform vec3 uShadow, uHigh; varying vec2 vUv;
    vec3 hot(vec2 uv){ vec3 c = texture2D(tDiffuse, uv).rgb; return max(c - 1.2, 0.0); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      // speed: zoom blur toward the vanishing point, stronger at the frame edges (the centre stays sharp)
      vec2 dir = vUv - uFocus;
      float edge = smoothstep(0.08, 0.7, length(dir * vec2(uAspect, 1.0)));
      float amt = uSpeed * 0.055 * edge;
      if (amt > 0.0005) {
        vec3 acc = c;
        for (int i = 1; i <= BLUR_TAPS; i++) acc += texture2D(tDiffuse, vUv - dir * amt * float(i) / float(BLUR_TAPS)).rgb;
        c = acc / float(BLUR_TAPS + 1);
      }
      // anamorphic streaks: bright lights smear horizontally, tinted cool at the tips (car-commercial lens)
      vec3 s = vec3(0.0);
      float px = 1.0 / uRes.x;
      for (int i = 1; i <= STREAK_TAPS; i++) {
        float o = pow(2.0, float(i)) * 1.6 * px;
        float w = 1.0 - float(i) / float(STREAK_TAPS + 1);
        s += (hot(vUv + vec2(o, 0.0)) + hot(vUv - vec2(o, 0.0))) * w;
      }
      c += s * uStreak * vec3(0.55, 0.72, 1.0) * 0.16;
      // grade: steel shadows, sodium highlights
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(c, c * mix(uShadow, uHigh, smoothstep(0.02, 0.6, l)) * 1.6, uAmount);
      c += uFlash * vec3(1.0, 0.82, 0.55) * 0.22;
      vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
      c *= 1.0 - uVignette * smoothstep(0.3, 1.05, length(p));
      gl_FragColor = vec4(c, 1.0);
    }`,
};

const FilmShader = {
  name: 'Film',
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: 0.055 }, uFringe: { value: 0.0022 }, uAspect: { value: 1 } },
  vertexShader: VS,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime, uGrain, uFringe, uAspect; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 d = (vUv - 0.5); float r2 = dot(d * vec2(uAspect, 1.0), d * vec2(uAspect, 1.0));
      vec2 o = d * uFringe * r2 * 4.0;
      vec3 c = vec3(texture2D(tDiffuse, vUv + o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - o).b);
      float n = h(vUv * vec2(1733.0, 977.0) + fract(uTime * 23.0) * 91.0) - 0.5;
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      c += n * uGrain * (1.0 - lum * 0.7); // grain lives in the shadows, like film
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export function buildPost(renderer, scene, camera, { tier }) {
  const size = renderer.getSize(new THREE.Vector2());
  const dpr = renderer.getPixelRatio();
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), tier === 'high' ? 0.62 : 0.52, 0.5, 0.86);
  composer.addPass(bloom);
  const cinema = new ShaderPass(CinemaShader);
  if (tier !== 'high') { cinema.material.defines.BLUR_TAPS = 5; cinema.material.defines.STREAK_TAPS = 5; }
  composer.addPass(cinema);
  composer.addPass(new OutputPass());
  const film = new ShaderPass(FilmShader);
  composer.addPass(film);
  const baseBloom = bloom.strength;
  const setSize = (w, h) => {
    composer.setSize(w, h); bloom.setSize(w / 2, h / 2);
    cinema.uniforms.uAspect.value = film.uniforms.uAspect.value = w / h;
    cinema.uniforms.uRes.value.set(w * dpr, h * dpr);
  };
  setSize(size.x, size.y);
  return {
    composer, bloom, cinema, film,
    setSize,
    // speed 0..1, flash 0..1 (a storefront switching on), focus = vanishing point in uv
    frame(time, { speed = 0, flash = 0, focusX = 0.5, focusY = 0.5 } = {}) {
      cinema.uniforms.uSpeed.value = speed;
      cinema.uniforms.uFlash.value = flash;
      cinema.uniforms.uFocus.value.set(focusX, focusY);
      bloom.strength = baseBloom * (1 + flash * 0.9);
      film.uniforms.uTime.value = time;
    },
    render() { composer.render(); },
  };
}
