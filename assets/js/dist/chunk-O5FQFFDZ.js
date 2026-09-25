import{$ as Y,D,E as K,I as j,J as X,Z as _,_ as v,c as N,d as z,e as L,f as O,g as H,ga as q,h as I,i as V,ia as J,j as Q,k as G,n as d,p as k,r as n,t as C,u as W,w as g,z as m}from"./chunk-6D4L4JEG.js";var M={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var h=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},ie=new q(-1,1,1,-1,0,1),B=class extends K{constructor(){super(),this.setAttribute("position",new D([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new D([0,2,0,0,2,0],2))}},se=new B,T=class{constructor(e){this._mesh=new X(se,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,ie)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};var x=class extends h{constructor(e,i="tDiffuse"){super(),this.textureID=i,this.uniforms=null,this.material=null,e instanceof v?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=_.clone(e.uniforms),this.material=new v({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new T(this.material)}render(e,i,a){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=a.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(i),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var P=class extends h{constructor(e,i){super(),this.scene=e,this.camera=i,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,i,a){let r=e.getContext(),t=e.state;t.buffers.color.setMask(!1),t.buffers.depth.setMask(!1),t.buffers.color.setLocked(!0),t.buffers.depth.setLocked(!0);let s,l;this.inverse?(s=0,l=1):(s=1,l=0),t.buffers.stencil.setTest(!0),t.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),t.buffers.stencil.setFunc(r.ALWAYS,s,4294967295),t.buffers.stencil.setClear(l),t.buffers.stencil.setLocked(!0),e.setRenderTarget(a),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(i),this.clear&&e.clear(),e.render(this.scene,this.camera),t.buffers.color.setLocked(!1),t.buffers.depth.setLocked(!1),t.buffers.color.setMask(!0),t.buffers.depth.setMask(!0),t.buffers.stencil.setLocked(!1),t.buffers.stencil.setFunc(r.EQUAL,1,4294967295),t.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),t.buffers.stencil.setLocked(!0)}},A=class extends h{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}};var E=class{constructor(e,i){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),i===void 0){let a=e.getSize(new n);this._width=a.width,this._height=a.height,i=new g(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:d}),i.texture.name="EffectComposer.rt1"}else this._width=i.width,this._height=i.height;this.renderTarget1=i,this.renderTarget2=i.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new x(M),this.copyPass.material.blending=N,this.timer=new J}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,i){this.passes.splice(i,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let i=this.passes.indexOf(e);i!==-1&&this.passes.splice(i,1)}isLastEnabledPass(e){for(let i=e+1;i<this.passes.length;i++)if(this.passes[i].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let i=this.renderer.getRenderTarget(),a=!1;for(let r=0,t=this.passes.length;r<t;r++){let s=this.passes[r];if(s.enabled!==!1){if(s.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(r),s.render(this.renderer,this.writeBuffer,this.readBuffer,e,a),s.needsSwap){if(a){let l=this.renderer.getContext(),o=this.renderer.state.buffers.stencil;o.setFunc(l.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),o.setFunc(l.EQUAL,1,4294967295)}this.swapBuffers()}P!==void 0&&(s instanceof P?a=!0:s instanceof A&&(a=!1))}}this.renderer.setRenderTarget(i)}reset(e){if(e===void 0){let i=this.renderer.getSize(new n);this._pixelRatio=this.renderer.getPixelRatio(),this._width=i.width,this._height=i.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,i){this._width=e,this._height=i;let a=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(a,r),this.renderTarget2.setSize(a,r);for(let t=0;t<this.passes.length;t++)this.passes[t].setSize(a,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var U=class extends h{constructor(e,i,a=null,r=null,t=null){super(),this.scene=e,this.camera=i,this.overrideMaterial=a,this.clearColor=r,this.clearAlpha=t,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new m}render(e,i,a){let r=e.autoClear;e.autoClear=!1;let t,s;this.overrideMaterial!==null&&(s=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(t=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:a),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(t),this.overrideMaterial!==null&&(this.scene.overrideMaterial=s),e.autoClear=r}};var Z={name:"LuminosityHighPassShader",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new m(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};var w=class u extends h{constructor(e,i=1,a,r){super(),this.strength=i,this.radius=a,this.threshold=r,this.resolution=e!==void 0?new n(e.x,e.y):new n(256,256),this.clearColor=new m(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let t=Math.round(this.resolution.x/2),s=Math.round(this.resolution.y/2);this.renderTargetBright=new g(t,s,{type:d,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let f=0;f<this.nMips;f++){let b=new g(t,s,{type:d,depthBuffer:!1});b.texture.name="UnrealBloomPass.h"+f,b.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(b);let c=new g(t,s,{type:d,depthBuffer:!1});c.texture.name="UnrealBloomPass.v"+f,c.texture.generateMipmaps=!1,this.renderTargetsVertical.push(c),t=Math.round(t/2),s=Math.round(s/2)}let l=Z;this.highPassUniforms=_.clone(l.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new v({uniforms:this.highPassUniforms,vertexShader:l.vertexShader,fragmentShader:l.fragmentShader}),this.separableBlurMaterials=[];let o=[6,10,14,18,22];t=Math.round(this.resolution.x/2),s=Math.round(this.resolution.y/2);for(let f=0;f<this.nMips;f++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(o[f])),this.separableBlurMaterials[f].uniforms.invSize.value=new n(1/t,1/s),t=Math.round(t/2),s=Math.round(s/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=i,this.compositeMaterial.uniforms.bloomRadius.value=.1;let p=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=p,this.bloomTintColors=[new C(1,1,1),new C(1,1,1),new C(1,1,1),new C(1,1,1),new C(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=_.clone(M.uniforms),this.blendMaterial=new v({uniforms:this.copyUniforms,vertexShader:M.vertexShader,fragmentShader:M.fragmentShader,premultipliedAlpha:!0,blending:z,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new m,this._oldClearAlpha=1,this._basic=new j,this._fsQuad=new T(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,i){let a=Math.round(e/2),r=Math.round(i/2);this.renderTargetBright.setSize(a,r);for(let t=0;t<this.nMips;t++)this.renderTargetsHorizontal[t].setSize(a,r),this.renderTargetsVertical[t].setSize(a,r),this.separableBlurMaterials[t].uniforms.invSize.value=new n(1/a,1/r),a=Math.round(a/2),r=Math.round(r/2)}render(e,i,a,r,t){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();let s=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),t&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=a.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=a.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let l=this.renderTargetBright;for(let o=0;o<this.nMips;o++)this._fsQuad.material=this.separableBlurMaterials[o],this.separableBlurMaterials[o].uniforms.colorTexture.value=l.texture,this.separableBlurMaterials[o].uniforms.direction.value=u.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[o]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[o].uniforms.colorTexture.value=this.renderTargetsHorizontal[o].texture,this.separableBlurMaterials[o].uniforms.direction.value=u.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[o]),e.clear(),this._fsQuad.render(e),l=this.renderTargetsVertical[o];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,t&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(a),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=s}_getSeparableBlurMaterial(e){let i=[],a=e/3;for(let s=0;s<e;s++)i.push(.39894*Math.exp(-.5*s*s/(a*a))/a);let r=[],t=[];for(let s=1;s<e;s+=2){let l=i[s],o=s+1<e?i[s+1]:0,p=l+o;r.push((s*l+(s+1)*o)/p),t.push(p)}return new v({defines:{KERNEL_PAIRS:r.length},uniforms:{colorTexture:{value:null},invSize:{value:new n(.5,.5)},direction:{value:new n(.5,.5)},centerWeight:{value:i[0]},gaussianOffsets:{value:r},gaussianWeights:{value:t}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new v({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};w.BlurDirectionX=new n(1,0);w.BlurDirectionY=new n(0,1);var R={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var F=class extends h{constructor(){super(),this.isOutputPass=!0,this.uniforms=_.clone(R.uniforms),this.material=new Y({name:R.name,uniforms:this.uniforms,vertexShader:R.vertexShader,fragmentShader:R.fragmentShader}),this._fsQuad=new T(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,i,a){this.uniforms.tDiffuse.value=a.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},W.getTransfer(this._outputColorSpace)===k&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===L?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===O?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===H?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===I?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===Q?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===G?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===V&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(i),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var $="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",re={name:"Cinema",defines:{BLUR_TAPS:8,STREAK_TAPS:7},uniforms:{tDiffuse:{value:null},uRes:{value:new n(1,1)},uAspect:{value:1},uSpeed:{value:0},uFocus:{value:new n(.5,.5)},uStreak:{value:.55},uFlash:{value:0},uVignette:{value:.5},uShadow:{value:new m("#4E6E9A")},uHigh:{value:new m("#FFB46A")},uAmount:{value:.12}},vertexShader:$,fragmentShader:`
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
    }`},ae={name:"Film",uniforms:{tDiffuse:{value:null},uTime:{value:0},uGrain:{value:.055},uFringe:{value:.0022},uAspect:{value:1}},vertexShader:$,fragmentShader:`
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
    }`};function Ie(u,e,i,{tier:a}){let r=u.getSize(new n),t=u.getPixelRatio(),s=new E(u,new g(r.x,r.y,{type:d}));s.addPass(new U(e,i));let l=new w(new n(r.x/2,r.y/2),a==="high"?.62:.52,.5,.86);s.addPass(l);let o=new x(re);a!=="high"&&(o.material.defines.BLUR_TAPS=5,o.material.defines.STREAK_TAPS=5),s.addPass(o),s.addPass(new F);let p=new x(ae);s.addPass(p);let f=l.strength,b=(c,S)=>{s.setSize(c,S),l.setSize(c/2,S/2),o.uniforms.uAspect.value=p.uniforms.uAspect.value=c/S,o.uniforms.uRes.value.set(c*t,S*t)};return b(r.x,r.y),{composer:s,bloom:l,cinema:o,film:p,setSize:b,frame(c,{speed:S=0,flash:y=0,focusX:ee=.5,focusY:te=.5}={}){o.uniforms.uSpeed.value=S,o.uniforms.uFlash.value=y,o.uniforms.uFocus.value.set(ee,te),l.strength=f*(1+y*.9),p.uniforms.uTime.value=c},render(){s.render()}}}export{Ie as buildPost};
//# sourceMappingURL=chunk-O5FQFFDZ.js.map
