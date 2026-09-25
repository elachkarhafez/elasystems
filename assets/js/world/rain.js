// Rain: the reason the road is wet. GPU line streaks in a box that travels with the camera (one draw call).
// Streaks lean back with the car's speed and fade near/far; they vanish in the aerial shot.
import * as THREE from 'three';

const BOX = new THREE.Vector3(56, 26, 56);

export function buildRain(scene, { tier }) {
  const n = tier === 'high' ? 5200 : tier === 'medium' ? 3600 : 1800;
  const seed = new Float32Array(n * 2 * 3);
  const end = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const s = [Math.random(), Math.random(), Math.random()];
    for (let v = 0; v < 2; v++) { seed.set(s, (i * 2 + v) * 3); end[i * 2 + v] = v; }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(seed, 3)); // seeds (the shader places everything)
  geo.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uBox: { value: BOX },
      uVel: { value: new THREE.Vector3() }, uOpacity: { value: tier === 'low' ? 0.5 : 0.36 },
      uColor: { value: new THREE.Color('#B9CCE8') },
    },
    vertexShader: /* glsl */`
      attribute float aEnd; uniform float uTime; uniform vec3 uCam, uBox, uVel; varying float vA;
      void main(){
        vec3 s = position;
        float fall = 17.0 + s.x * 6.0;
        vec3 p;
        p.xz = mod(s.xz * uBox.xz - uCam.xz + uBox.xz * 0.5, uBox.xz) - uBox.xz * 0.5 + uCam.xz;
        p.y = mod(s.y * uBox.y - uTime * fall, uBox.y) - 1.0;
        // streak = drop velocity relative to the camera over ~1/40 s (motion blur of a film shutter)
        vec3 v = vec3(0.6, -fall, 0.3) - uVel;
        p += v * aEnd * 0.028;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = -mv.z;
        vA = (1.0 - aEnd * 0.85) * smoothstep(0.6, 3.0, d) * (1.0 - smoothstep(16.0, 27.0, d));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uOpacity; varying float vA;
      void main(){ gl_FragColor = vec4(uColor * 1.6, vA * uOpacity); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.renderOrder = 5;
  scene.add(lines);
  return {
    update(t, camPos, vel, fade) {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uCam.value.copy(camPos);
      mat.uniforms.uVel.value.copy(vel);
      lines.visible = fade > 0.01;
      mat.uniforms.uOpacity.value = (tier === 'low' ? 0.5 : 0.36) * fade;
    },
  };
}
