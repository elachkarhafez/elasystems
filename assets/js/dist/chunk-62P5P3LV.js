import{C as B,D as W,H as k,I as j,X as T,Y as g,Z as K,c as F,d as D,e as N,ea as X,f as z,g as O,ga as Y,h as L,i as I,j as H,k as V,n as c,p as Q,r as n,t as _,u as G,w as d,z as f}from"./chunk-MQBZCQBU.js";var x={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`};var h=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},J=new X(-1,1,1,-1,0,1),U=class extends W{constructor(){super(),this.setAttribute("position",new B([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new B([0,2,0,0,2,0],2))}},Z=new U,v=class{constructor(e){this._mesh=new j(Z,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,J)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};var b=class extends h{constructor(e,i="tDiffuse"){super(),this.textureID=i,this.uniforms=null,this.material=null,e instanceof g?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=T.clone(e.uniforms),this.material=new g({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new v(this.material)}render(e,i,a){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=a.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(i),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var C=class extends h{constructor(e,i){super(),this.scene=e,this.camera=i,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,i,a){let s=e.getContext(),t=e.state;t.buffers.color.setMask(!1),t.buffers.depth.setMask(!1),t.buffers.color.setLocked(!0),t.buffers.depth.setLocked(!0);let r,l;this.inverse?(r=0,l=1):(r=1,l=0),t.buffers.stencil.setTest(!0),t.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),t.buffers.stencil.setFunc(s.ALWAYS,r,4294967295),t.buffers.stencil.setClear(l),t.buffers.stencil.setLocked(!0),e.setRenderTarget(a),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(i),this.clear&&e.clear(),e.render(this.scene,this.camera),t.buffers.color.setLocked(!1),t.buffers.depth.setLocked(!1),t.buffers.color.setMask(!0),t.buffers.depth.setMask(!0),t.buffers.stencil.setLocked(!1),t.buffers.stencil.setFunc(s.EQUAL,1,4294967295),t.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),t.buffers.stencil.setLocked(!0)}},w=class extends h{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}};var P=class{constructor(e,i){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),i===void 0){let a=e.getSize(new n);this._width=a.width,this._height=a.height,i=new d(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:c}),i.texture.name="EffectComposer.rt1"}else this._width=i.width,this._height=i.height;this.renderTarget1=i,this.renderTarget2=i.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new b(x),this.copyPass.material.blending=F,this.timer=new Y}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,i){this.passes.splice(i,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let i=this.passes.indexOf(e);i!==-1&&this.passes.splice(i,1)}isLastEnabledPass(e){for(let i=e+1;i<this.passes.length;i++)if(this.passes[i].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let i=this.renderer.getRenderTarget(),a=!1;for(let s=0,t=this.passes.length;s<t;s++){let r=this.passes[s];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,a),r.needsSwap){if(a){let l=this.renderer.getContext(),o=this.renderer.state.buffers.stencil;o.setFunc(l.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),o.setFunc(l.EQUAL,1,4294967295)}this.swapBuffers()}C!==void 0&&(r instanceof C?a=!0:r instanceof w&&(a=!1))}}this.renderer.setRenderTarget(i)}reset(e){if(e===void 0){let i=this.renderer.getSize(new n);this._pixelRatio=this.renderer.getPixelRatio(),this._width=i.width,this._height=i.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,i){this._width=e,this._height=i;let a=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(a,s),this.renderTarget2.setSize(a,s);for(let t=0;t<this.passes.length;t++)this.passes[t].setSize(a,s)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var R=class extends h{constructor(e,i,a=null,s=null,t=null){super(),this.scene=e,this.camera=i,this.overrideMaterial=a,this.clearColor=s,this.clearAlpha=t,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new f}render(e,i,a){let s=e.autoClear;e.autoClear=!1;let t,r;this.overrideMaterial!==null&&(r=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(t=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:a),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(t),this.overrideMaterial!==null&&(this.scene.overrideMaterial=r),e.autoClear=s}};var q={name:"LuminosityHighPassShader",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new f(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`};var M=class u extends h{constructor(e,i=1,a,s){super(),this.strength=i,this.radius=a,this.threshold=s,this.resolution=e!==void 0?new n(e.x,e.y):new n(256,256),this.clearColor=new f(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let t=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);this.renderTargetBright=new d(t,r,{type:c,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let m=0;m<this.nMips;m++){let A=new d(t,r,{type:c,depthBuffer:!1});A.texture.name="UnrealBloomPass.h"+m,A.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(A);let y=new d(t,r,{type:c,depthBuffer:!1});y.texture.name="UnrealBloomPass.v"+m,y.texture.generateMipmaps=!1,this.renderTargetsVertical.push(y),t=Math.round(t/2),r=Math.round(r/2)}let l=q;this.highPassUniforms=T.clone(l.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new g({uniforms:this.highPassUniforms,vertexShader:l.vertexShader,fragmentShader:l.fragmentShader}),this.separableBlurMaterials=[];let o=[6,10,14,18,22];t=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);for(let m=0;m<this.nMips;m++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(o[m])),this.separableBlurMaterials[m].uniforms.invSize.value=new n(1/t,1/r),t=Math.round(t/2),r=Math.round(r/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=i,this.compositeMaterial.uniforms.bloomRadius.value=.1;let p=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=p,this.bloomTintColors=[new _(1,1,1),new _(1,1,1),new _(1,1,1),new _(1,1,1),new _(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=T.clone(x.uniforms),this.blendMaterial=new g({uniforms:this.copyUniforms,vertexShader:x.vertexShader,fragmentShader:x.fragmentShader,premultipliedAlpha:!0,blending:D,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new f,this._oldClearAlpha=1,this._basic=new k,this._fsQuad=new v(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,i){let a=Math.round(e/2),s=Math.round(i/2);this.renderTargetBright.setSize(a,s);for(let t=0;t<this.nMips;t++)this.renderTargetsHorizontal[t].setSize(a,s),this.renderTargetsVertical[t].setSize(a,s),this.separableBlurMaterials[t].uniforms.invSize.value=new n(1/a,1/s),a=Math.round(a/2),s=Math.round(s/2)}render(e,i,a,s,t){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();let r=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),t&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=a.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=a.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let l=this.renderTargetBright;for(let o=0;o<this.nMips;o++)this._fsQuad.material=this.separableBlurMaterials[o],this.separableBlurMaterials[o].uniforms.colorTexture.value=l.texture,this.separableBlurMaterials[o].uniforms.direction.value=u.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[o]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[o].uniforms.colorTexture.value=this.renderTargetsHorizontal[o].texture,this.separableBlurMaterials[o].uniforms.direction.value=u.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[o]),e.clear(),this._fsQuad.render(e),l=this.renderTargetsVertical[o];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,t&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(a),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=r}_getSeparableBlurMaterial(e){let i=[],a=e/3;for(let r=0;r<e;r++)i.push(.39894*Math.exp(-.5*r*r/(a*a))/a);let s=[],t=[];for(let r=1;r<e;r+=2){let l=i[r],o=r+1<e?i[r+1]:0,p=l+o;s.push((r*l+(r+1)*o)/p),t.push(p)}return new g({defines:{KERNEL_PAIRS:s.length},uniforms:{colorTexture:{value:null},invSize:{value:new n(.5,.5)},direction:{value:new n(.5,.5)},centerWeight:{value:i[0]},gaussianOffsets:{value:s},gaussianWeights:{value:t}},vertexShader:`

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

				}`})}_getCompositeMaterial(e){return new g({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

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

				}`})}};M.BlurDirectionX=new n(1,0);M.BlurDirectionY=new n(0,1);var S={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`};var E=class extends h{constructor(){super(),this.isOutputPass=!0,this.uniforms=T.clone(S.uniforms),this.material=new K({name:S.name,uniforms:this.uniforms,vertexShader:S.vertexShader,fragmentShader:S.fragmentShader}),this._fsQuad=new v(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,i,a){this.uniforms.tDiffuse.value=a.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},G.getTransfer(this._outputColorSpace)===Q&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===N?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===z?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===O?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===L?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===H?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===V?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===I&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(i),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var $={name:"NightGrade",uniforms:{tDiffuse:{value:null},uVignette:{value:.42},uShadow:{value:new f("#4E6E9A")},uHigh:{value:new f("#FFB46A")},uAmount:{value:.1},uAspect:{value:1}},vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",fragmentShader:`
    uniform sampler2D tDiffuse; uniform float uVignette, uAmount, uAspect; uniform vec3 uShadow, uHigh; varying vec2 vUv;
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      vec3 tint = mix(uShadow, uHigh, smoothstep(0.02, 0.6, l));
      c = mix(c, c * tint * 1.6, uAmount);
      vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
      c *= 1.0 - uVignette * smoothstep(0.35, 1.05, length(p));
      gl_FragColor = vec4(c, 1.0);
    }`};function De(u,e,i,{tier:a}){let s=u.getSize(new n),t=new P(u,new d(s.x,s.y,{type:c}));t.addPass(new R(e,i));let r=new M(new n(s.x/2,s.y/2),a==="high"?.62:.52,.5,.86);t.addPass(r);let l=new b($);return l.uniforms.uAspect.value=s.x/s.y,t.addPass(l),t.addPass(new E),{composer:t,bloom:r,grade:l,setSize(o,p){t.setSize(o,p),r.setSize(o/2,p/2),l.uniforms.uAspect.value=o/p},render(){t.render()}}}export{De as buildPost};
