// Post: bloom (emissive storytelling) + night grade (sodium highlights / steel shadows, vignette). HIGH/MEDIUM only.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const GradeShader = {
  name: 'NightGrade',
  uniforms: { tDiffuse: { value: null }, uVignette: { value: 0.42 }, uShadow: { value: new THREE.Color('#4E6E9A') }, uHigh: { value: new THREE.Color('#FFB46A') }, uAmount: { value: 0.1 }, uAspect: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uVignette, uAmount, uAspect; uniform vec3 uShadow, uHigh; varying vec2 vUv;
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      vec3 tint = mix(uShadow, uHigh, smoothstep(0.02, 0.6, l));
      c = mix(c, c * tint * 1.6, uAmount);
      vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
      c *= 1.0 - uVignette * smoothstep(0.35, 1.05, length(p));
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export function buildPost(renderer, scene, camera, { tier }) {
  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), tier === 'high' ? 0.62 : 0.52, 0.5, 0.86);
  composer.addPass(bloom);
  const grade = new ShaderPass(GradeShader);
  grade.uniforms.uAspect.value = size.x / size.y;
  composer.addPass(grade);
  composer.addPass(new OutputPass());
  return {
    composer, bloom, grade,
    setSize(w, h) { composer.setSize(w, h); bloom.setSize(w / 2, h / 2); grade.uniforms.uAspect.value = w / h; },
    render() { composer.render(); },
  };
}
