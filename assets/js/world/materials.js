// Shader materials for the night world. All respect scene fog and the renderer's tone mapping / output color space.
import * as THREE from 'three';

const NOISE = /* glsl */`
  float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x), mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }
`;

// background buildings: near-silhouettes with a hash-lit window grid (no textures)
export function buildingMaterial({ base = '#0A111D', warm = '#FFC98A', cool = '#9FBFEA', lit = 0.14 } = {}) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uBase: { value: new THREE.Color(base) }, uWarm: { value: new THREE.Color(warm) }, uCool: { value: new THREE.Color(cool) },
      uLit: { value: lit }, uGain: { value: 1 },
    }]),
    vertexShader: /* glsl */`
      attribute float aSeed;
      varying vec3 vWP; varying vec3 vN; varying float vSeed;
      #include <fog_pars_vertex>
      void main(){
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vWP = wp.xyz; vSeed = aSeed;
        vN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uBase, uWarm, uCool; uniform float uLit, uGain;
      varying vec3 vWP; varying vec3 vN; varying float vSeed;
      #include <fog_pars_fragment>
      ${NOISE}
      void main(){
        vec3 col = uBase * (0.75 + 0.35 * smoothstep(0.0, 22.0, vWP.y));
        if (abs(vN.y) < 0.5) {
          float horiz = abs(vN.x) > 0.5 ? vWP.z : vWP.x;
          vec2 cell = vec2(horiz / 2.7, (vWP.y - 0.6) / 3.4);
          vec2 id = floor(cell); vec2 f = fract(cell);
          float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.28, f.y) * step(f.y, 0.82);
          float upper = step(1.0, id.y);
          float h = hash21(id + vSeed * 13.7);
          float on = step(1.0 - uLit, h) * win * upper;
          vec3 lc = mix(uCool, uWarm, step(0.4, hash21(id * 1.93 + vSeed))) * (0.35 + 0.55 * hash21(id + 7.1));
          col = mix(col, col * 1.7 + 0.004, win * upper * 0.5);
          col += lc * on * uGain;
          // ground-floor shutters catch a little street light
          col += vec3(0.05, 0.035, 0.02) * (1.0 - upper) * smoothstep(3.2, 0.0, vWP.y) * (0.6 + 0.4 * vnoise(vec2(horiz * 3.0, vWP.y * 8.0)));
        } else col *= 0.55;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

// matte asphalt for tiers without real reflections
export function asphaltMaterial(color = '#0B0F16') {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uColor: { value: new THREE.Color(color) } }]),
    vertexShader: /* glsl */`
      varying vec3 vWP;
      #include <fog_pars_vertex>
      void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWP = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; varying vec3 vWP;
      #include <fog_pars_fragment>
      ${NOISE}
      void main(){
        float n = fbm(vWP.xz * 0.9) * 0.6 + vnoise(vWP.xz * 7.0) * 0.4;
        float wet = smoothstep(0.45, 0.8, fbm(vWP.xz * 0.06));
        vec3 col = uColor * (0.75 + 0.5 * n) + vec3(0.012, 0.016, 0.024) * wet;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

// wet asphalt for the Reflector (HIGH tier): distorted, vertically smeared reflection + puddle mask
export const WetReflectorShader = {
  name: 'WetReflectorShader',
  uniforms: {
    color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
    uStrength: { value: 0.9 },
    fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 },
  },
  vertexShader: /* glsl */`
    uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWP;
    #include <fog_pars_vertex>
    void main(){ vUv = textureMatrix * vec4(position, 1.0); vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz;
      vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 color; uniform sampler2D tDiffuse; uniform float uStrength; varying vec4 vUv; varying vec3 vWP;
    #include <fog_pars_fragment>
    ${NOISE}
    void main(){
      float n = fbm(vWP.xz * 0.9) * 0.6 + vnoise(vWP.xz * 7.0) * 0.4;
      float puddle = smoothstep(0.42, 0.78, fbm(vWP.xz * 0.06 + 3.1));
      vec4 uv = vUv;
      uv.x += (vnoise(vWP.xz * 2.3) - 0.5) * 0.018 * uv.w;
      vec3 acc = vec3(0.0);
      float spread = mix(0.03, 0.008, puddle);
      for (int i = 0; i < 6; i++) { float o = (float(i) - 2.5) * spread; acc += texture2DProj(tDiffuse, uv + vec4(0.0, o * uv.w, 0.0, 0.0)).rgb; }
      acc /= 6.0;
      vec3 asphalt = color * (0.75 + 0.5 * n);
      vec3 col = asphalt + acc * uStrength * mix(0.3, 0.95, puddle);
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }`,
};

// light trails: continuous long-exposure streak + brighter moving pulses (the mark's speed stripes)
export function trailMaterial({ color = '#E3A02A', intensity = 2.2, length = 1000, spacing = 46, carLen = 18, base = 0.42 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, toneMapped: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity }, uPhase: { value: 0 },
      uLength: { value: length }, uSpacing: { value: spacing }, uCar: { value: carLen }, uBase: { value: base }, uFade: { value: 1 },
    }]),
    vertexShader: /* glsl */`
      varying vec2 vUv;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uIntensity, uPhase, uLength, uSpacing, uCar, uBase, uFade; varying vec2 vUv;
      #include <fog_pars_fragment>
      void main(){
        float s = vUv.x * uLength - uPhase;
        float f = fract(s / uSpacing) * uSpacing;
        float pulse = smoothstep(0.0, 1.5, f) * (1.0 - smoothstep(uCar * 0.25, uCar, f));
        float core = 1.0 - abs(vUv.y - 0.5) * 2.0;
        float b = (uBase + pulse) * (0.55 + 0.45 * core) * uIntensity * uFade;
        gl_FragColor = vec4(uColor * b, 1.0);
        #ifdef USE_FOG
          // additive light fades to black in fog (never adds fog color)
          float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          gl_FragColor.rgb *= 1.0 - fogFactor;
        #endif
      }`,
  });
}

// camera-facing instanced glow (lamp halos): billboards in the vertex shader, fades to black in fog
export function billboardGlowMaterial(tex, color, opacity = 1) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, toneMapped: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: tex }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } }]),
    vertexShader: /* glsl */`
      varying vec2 vUv; varying float vDepth;
      #include <fog_pars_vertex>
      void main(){
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        vDepth = -mvPosition.z;
        float s = length(instanceMatrix[0].xyz);
        mvPosition.xy += position.xy * s;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D map; uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv; varying float vDepth;
      #include <fog_pars_fragment>
      void main(){
        float a = texture2D(map, vUv).a * uOpacity * smoothstep(12.0, 26.0, vDepth); // never a disc in the viewer's face
        gl_FragColor = vec4(uColor * a, 1.0);
        #ifdef USE_FOG
          float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          gl_FragColor.rgb *= 1.0 - fogFactor;
        #endif
      }`,
  });
}

// additive glow (streetlight heads, sign halos, light pools); on LOW tier this stands in for bloom
export function glowMaterial(tex, color, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    map: tex, color: new THREE.Color(color), transparent: true, opacity, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false, fog: true,
  });
}
