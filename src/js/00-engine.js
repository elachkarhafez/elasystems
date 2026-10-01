/* ============================================================================
   00-engine.js — RainField: one fixed WebGL2 canvas, one full-screen triangle,
   one fragment shader. Everything visual is a uniform on that shader.
   Exposes window.ES.rain (see scratchpad/ENGINE_API.md), ES.util, ES.atlas,
   ES.masks, ES.motion. Zero per-frame allocations in the render loop.
   ========================================================================== */
(function () {
  'use strict';
  var ES = window.ES = window.ES || {};
  var html = document.documentElement;
  var SLASH_RUN = 0.535;
  var TAN_SKEW = 0.0437; // tan(2.5deg)

  /* ---------------------------------------------------------------- util */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hex(h) {
    var n = parseInt(h.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  var C = {
    night: hex('#050B16'), navy: hex('#081830'), navy2: hex('#102848'),
    gold: hex('#E3A02A'), goldLight: hex('#F4CD72'), goldDeep: hex('#8A5A12'),
    paper: hex('#F2EFE8'), head: hex('#FFF4D6')
  };
  var navyField = [lerp(C.night[0], C.navy[0], .35), lerp(C.night[1], C.navy[1], .35), lerp(C.night[2], C.navy[2], .35)];

  /* front line in CSS px (y down): x(y) = x0 + RUN * (H - y); ahead = right side */
  function frontX0(f, W, H) { return -SLASH_RUN * H + f * (W + SLASH_RUN * H); }
  function slashPolygon(f, rect, side, W, H) {
    W = W || window.innerWidth; H = H || window.innerHeight;
    var x0 = frontX0(f, W, H);
    var L = rect.left !== undefined ? rect.left : rect.x, T = rect.top !== undefined ? rect.top : rect.y;
    var w = rect.width !== undefined ? rect.width : rect.w, h = rect.height !== undefined ? rect.height : rect.h;
    var xTop = x0 - L + SLASH_RUN * (H - T);        // line x at element top (local)
    var xBot = xTop - SLASH_RUN * h;                 // line x at element bottom (local)
    // 'new' (swept, left of the line) is the default; 'old' = unswept, right of the line
    if (side === 'old' || side === 'unswept' || side === 'right') return 'polygon(' + xTop.toFixed(1) + 'px 0, 100% 0, 100% 100%, ' + xBot.toFixed(1) + 'px 100%)';
    return 'polygon(0 0, ' + xTop.toFixed(1) + 'px 0, ' + xBot.toFixed(1) + 'px 100%, 0 100%)';
  }
  function frontThrough(x, y, W, H) { // f such that the front line passes through viewport point (x, y)
    W = W || window.innerWidth; H = H || window.innerHeight;
    var x0 = x - SLASH_RUN * (H - y);
    return (x0 + SLASH_RUN * H) / (W + SLASH_RUN * H);
  }
  function rectOf(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }
  /* rasterise text into a mask canvas (white on black) sized to a CSS rect */
  function rasterText(text, rect, font, letterSpacing) {
    var scale = Math.min(2, 2048 / Math.max(1, rect.w));
    var cv = document.createElement('canvas');
    cv.width = Math.max(2, Math.round(rect.w * scale));
    cv.height = Math.max(2, Math.round(rect.h * scale));
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#fff';
    ctx.font = font;
    if (letterSpacing !== undefined && 'letterSpacing' in ctx) ctx.letterSpacing = letterSpacing;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    // fit: scale the text to the rect width
    var m = ctx.measureText(text);
    var tw = m.width || 1;
    var sx = (cv.width * 0.995) / tw;
    var asc = m.actualBoundingBoxAscent || cv.height * 0.72, desc = m.actualBoundingBoxDescent || 0;
    var th = asc + desc;
    var sy = Math.min(sx, (cv.height * 0.98) / (th || 1));
    sx = Math.min(sx, sy * 1.0);
    ctx.save();
    ctx.translate(0, (cv.height - th * sy) / 2 + asc * sy);
    ctx.scale(sx, sy);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    return cv;
  }

  /* glyph alphabet -------------------------------------------------------- */
  var GLYPH = {}; // char -> index
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', DIGITS = '0123456789';
  (function () {
    var i;
    for (i = 0; i < 26; i++) GLYPH[LETTERS[i]] = i;
    for (i = 0; i < 10; i++) GLYPH[DIGITS[i]] = 26 + i;
    GLYPH['.'] = 36; GLYPH['·'] = 37; GLYPH['/'] = 38; GLYPH['–'] = 39; GLYPH['-'] = 39;
    GLYPH['\u0001'] = 40; GLYPH['\u0002'] = 41; GLYPH['\u0003'] = 42; GLYPH['\u0004'] = 43; GLYPH['\u0005'] = 44; GLYPH['\u0006'] = 45;
    GLYPH['Λ'] = 45; GLYPH[' '] = 46;
  })();
  var PRIM = { bar1: '\u0001', bar2: '\u0002', bar3: '\u0003', slash: '\u0004', s: '\u0005', lambda: '\u0006' };
  function glyphIndex(ch) { var g = GLYPH[ch.toUpperCase()]; return g === undefined ? 46 : g; }
  var WORDS = [
    'W WARREN AVE', 'FORD RD', 'MIDDLEBELT RD', 'PLYMOUTH RD', 'MONROE ST', '313 300 6898', '313 300 6898',
    'TRAFFIC PROBLEM', 'SYSTEM PROBLEM', 'FIRST CLICK', 'FINAL CONVERSION', 'WEBSITES', 'APPS', 'SYSTEMS',
    'DETROIT', 'DETROIT MI', 'ELΛ SYSTEMS', 'FAMILY BAKERY', 'DMODA SHOES', 'THE SNUG MUG', 'BOUNCE IT UP',
    '313 APPAREL', 'BIG WISS MATCHA', 'CREATIVE STYLE', 'MONARCH URGENT CARE', 'EXPRESS POULTRY FISH',
    'ALLEN PARK', 'DEARBORN', 'LIVONIA', 'ORDER · BOOKING', 'FOLLOW UP TEXT', 'RETURN VISIT', 'STOREFRONT',
    'THE SYSTEM BEHIND', 'EVERY TOUCHPOINT', 'W WARREN AVE 17032', 'PLYMOUTH RD 30276', 'FORD RD 22140',
    PRIM.bar1 + PRIM.bar2 + PRIM.bar3 + PRIM.slash + PRIM.s + PRIM.lambda,
    PRIM.bar3 + PRIM.bar2 + PRIM.bar1 + PRIM.slash + ' ',
    PRIM.slash + PRIM.s + PRIM.slash + PRIM.s + ' ' + PRIM.lambda,
    PRIM.lambda + PRIM.bar1 + PRIM.lambda + PRIM.bar2 + PRIM.lambda + PRIM.bar3,
    'E' + PRIM.s + ' E' + PRIM.s + ' ' + PRIM.bar3 + PRIM.s,
    PRIM.bar3 + PRIM.slash + PRIM.s + ' 313',
    'SYSTEM ' + PRIM.slash + ' STOREFRONT'
  ];

  /* ----------------------------------------------------------- shaders */
  var VS = '#version 300 es\n' +
    'void main(){float x=float((gl_VertexID&1)<<2)-1.0;float y=float((gl_VertexID&2)<<1)-1.0;gl_Position=vec4(x,y,0.0,1.0);}';

  var FS = [
    '#version 300 es',
    'precision highp float; precision highp int; precision highp sampler2D;',
    'out vec4 fragColor;',
    'uniform vec2 uRes; uniform float uDpr;',
    'uniform float uTimeA, uTimeB, uClock;',
    'uniform vec3 uCell, uRate, uLAlpha; uniform int uLayers;',
    'uniform vec2 uPar; uniform float uFront, uBand;',
    'uniform vec3 uGroundA, uGroundB, uHeadA, uHeadB, uGlyphA, uGlyphB, uTailA, uTailB, uDensA, uDensB;',
    'uniform float uBaseA, uBaseB, uGridA, uGridB;',
    'uniform sampler2D uAtlas, uWords, uMark, uNum, uShotA, uShotB;',
    'uniform float uWordsN;',
    'uniform vec4 uMarkRect; uniform float uCatch, uMelt, uSlash, uSlashGlow, uDim, uTimeLock;',
    'uniform vec4 uNumRect; uniform float uCatchNum, uPulse; uniform int uNumLayer;',
    'uniform vec4 uTextMask[4]; uniform int uTextMaskN;',
    'uniform vec4 uFrameA, uFrameB; uniform vec2 uShotSizeA, uShotSizeB;',
    'uniform float uStageA, uStageB, uBleedA, uBleedB, uFrameOnA, uFrameOnB, uSweepA, uSweepB; uniform vec3 uTintA, uTintB;',
    'const float RUN = 0.535;',
    'const vec3 GOLD = vec3(0.890, 0.627, 0.165);',
    'const vec3 GOLD_LIGHT = vec3(0.957, 0.804, 0.447);',
    'const vec3 GOLD_DEEP = vec3(0.541, 0.353, 0.071);',
    'const vec3 PAPER = vec3(0.949, 0.937, 0.910);',
    'const vec3 HEAD = vec3(1.0, 0.957, 0.839);',
    'const vec3 NIGHT = vec3(0.0196, 0.0431, 0.0863);',
    'uint uh(uint x){x^=x>>16u;x*=0x7feb352du;x^=x>>15u;x*=0x846ca68bu;x^=x>>16u;return x;}',
    'float hash3(int a,int b,int c){uint h=uh(uint(a+262144)*0x9E3779B1u^uh(uint(b+262144)*0x85EBCA77u^uh(uint(c+262144))));return float(h)*(1.0/4294967296.0);}',
    'float wordChar(float w,float i){float len=texelFetch(uWords,ivec2(0,int(w)),0).r*255.0;float k=mod(i,max(len,1.0));return texelFetch(uWords,ivec2(1+int(k),int(w)),0).r*255.0;}',
    'float glyph(float g,vec2 f,float lod){vec2 cell=vec2(mod(g,16.0),floor(g/16.0));vec2 uv=(cell+clamp(f,0.03,0.97))/16.0;return textureLod(uAtlas,uv,lod).r;}',
    'float rectDist(vec2 p,vec4 r){vec2 d=max(r.xy-p,p-(r.xy+r.zw));return max(max(d.x,d.y),0.0);}',
    'bool inRect(vec2 p,vec4 r){return p.x>=r.x&&p.y>=r.y&&p.x<r.x+r.z&&p.y<r.y+r.w;}',
    'bool inRectX(vec2 p,vec4 r,float e){return p.x>=r.x-e&&p.y>=r.y-e&&p.x<r.x+r.z+e&&p.y<r.y+r.w+e;}',
    // the decode inside a frame progresses in the Slash Front\'s own order (top-left first, iso-lines parallel to the slash)
    'float frameOrder(vec2 p,vec4 r){return (p.x-r.x+RUN*(p.y-r.y))/(r.z+RUN*r.w);}',
    // one glyph layer; returns rgb + alpha
    'vec4 layerEval(int L,vec2 p,vec2 vp,float x0,float amp,float base0,float fill0){',
    '  float cellPx=uCell[L]; float rate=uRate[L]; float lAlpha=uLAlpha[L];',
    '  vec2 parOff=uPar*amp; parOff.x+=uPar.x*0.0437*(p.y-vp.y*0.5)*(amp/12.0);',
    '  vec2 q=p+parOff; vec2 ci=floor(q/cellPx); vec2 f=q/cellPx-ci;',
    '  vec2 cc=(ci+0.5)*cellPx; vec2 ccs=cc-parOff;',
    '  int cx=int(ci.x), cy=int(ci.y);',
    '  float h1=hash3(cx,11,L), h2=hash3(cx,23,L), h3=hash3(cx,37,L), hc=hash3(cx,cy,51+L);',
    '  float dC=ccs.x-x0-RUN*(vp.y-ccs.y)+(hc-0.5)*0.6*cellPx;',
    '  float unswept=step(0.0,dC); float sideC=1.0-unswept; float bandC=unswept*(1.0-step(uBand,dC));',
    '  float dens=max(mix(uDensA[L],uDensB[L],sideC),bandC);',
    // the catch: the ES mark locks cells (computed first: locked cells freeze their glyph)
    '  float lock=0.0; vec3 lockC=GOLD; float dimK=uDim; float pour=0.0;',
    '  if(uCatch>0.0&&inRect(cc,uMarkRect)){',
    '    vec2 muv=(cc-uMarkRect.xy)/uMarkRect.zw; vec2 m=textureLod(uMark,muv,0.0).rg;',
    '    if(m.r>0.5){',
    '      float o=(RUN*(cc.x-uMarkRect.x)-(cc.y-uMarkRect.y)+uMarkRect.w)/(RUN*uMarkRect.z+uMarkRect.w);',
    '      float delay=m.g<0.3?0.17:(m.g<0.55?0.085:0.0);',
    '      float t=uCatch*1.35-o-delay; lock=smoothstep(0.0,0.08,t);',
    '      float v=1.0-muv.y; float mel=uMelt*1.14-(v+(hc-0.5)*0.12);',
    '      float rel=step(0.0,mel)*step(0.001,uMelt); lock*=1.0-rel;',
    '      pour=smoothstep(0.0,0.06,mel)*(1.0-smoothstep(0.06,0.28,mel))*step(0.001,uMelt);',
    '      lockC=m.g>0.85?PAPER:mix(GOLD,GOLD_LIGHT,o);',
    '      dimK*=1.0-lock;',
    '    }',
    '  }',
    // the number catch (contact): ONE layer holds the digits (uNumLayer: the front layer on desktop, the mid layer on
    // phones) as opaque gold-light cells with the glyph printed in night; the other layers hide inside the locked shape
    '  float lockN=0.0, hideN=0.0;',
    '  if(uCatchNum>0.0&&inRect(cc,uNumRect)){',
    '    vec2 nuv=(cc-uNumRect.xy)/uNumRect.zw; float n=textureLod(uNum,nuv,0.0).r;',
    '    if(n>0.5){float o=(RUN*(cc.x-uNumRect.x)-(cc.y-uNumRect.y)+uNumRect.w)/(RUN*uNumRect.z+uNumRect.w);',
    '      float ln=smoothstep(0.0,0.1,uCatchNum*1.3-o); if(L==uNumLayer) lockN=ln; else hideN=ln;}',
    '  }',
    '  float dimN=uCatchNum*(1.0-max(lockN,hideN));',
    // storefront frames: a cell belongs to a frame when its centre is within half a cell of the rect AND the pixel is
    // inside it (so the decode is clipped exactly to the DOM frame, no overhang); inside a frame every column is dense
    // once the decode has started, so the mosaic is complete by stage 0.35 instead of striped by the scene density
    '  bool fA=uFrameOnA>0.5&&inRectX(ccs,uFrameA,cellPx*0.5)&&inRect(p,uFrameA);',
    '  bool fB=uFrameOnB>0.5&&inRectX(ccs,uFrameB,cellPx*0.5)&&inRect(p,uFrameB);',
    '  float inF=(fA?uStageA:0.0)+(fB?uStageB:0.0);',
    '  dens=max(dens,smoothstep(0.0,0.35,inF));',
    '  if(h1>=dens&&lock<=0.0&&lockN<=0.0) return vec4(0.0);',
    '  dens=max(dens,0.001);',
    // the stream: head row, tail, frozen while locked
    '  float tm=mix(uTimeA,uTimeB,sideC);',
    '  float period=14.0+floor(h2*26.0); float phase=floor(h3*period);',
    '  float head=floor(tm*rate+phase); float since=mod(head-ci.y,period); float passes=floor((head-ci.y)/period);',
    '  float headL=floor(uTimeLock*rate+phase); float passesL=floor((headL-ci.y)/period);',
    '  if(lock>0.5) passes=passesL;',
    '  float word=floor(h1/max(dens,h1+0.001)*uWordsN); word=min(word,uWordsN-1.0);',
    '  float cidx=ci.y+passes+floor(h2*97.0)+bandC*floor(uClock*8.0);',
    '  float g=wordChar(word,cidx);',
    '  float lod=log2(64.0/(cellPx*uDpr));',
    '  float a=glyph(g,f,lod);',
    '  vec3 headC=mix(uHeadA,uHeadB,sideC), glyphC=mix(uGlyphA,uGlyphB,sideC), tailC=mix(uTailA,uTailB,sideC);',
    '  float base=mix(uBaseA,uBaseB,sideC)*base0;',
    '  float tailA=since<0.5?1.0:(since<7.0?1.0-(since-1.0)/6.5:0.0);',
    '  vec3 c=since<0.5?headC:mix(glyphC,tailC,clamp((since-1.0)/5.0,0.0,1.0));',
    '  float inten=tailA; if(tailA<base){inten=base;c=glyphC;}',
    '  if(pour>inten){inten=pour;c=headC;}',
    // client tint bleed around decode frames
    '  float bl=0.0; vec3 tint=GOLD;',
    '  if(uFrameOnA>0.5){float d=rectDist(ccs,uFrameA);float k=uBleedA*(1.0-smoothstep(0.0,40.0*uCell.z,d));if(k>bl){bl=k;tint=uTintA;}}',
    '  if(uFrameOnB>0.5){float d=rectDist(ccs,uFrameB);float k=uBleedB*(1.0-smoothstep(0.0,40.0*uCell.z,d));if(k>bl){bl=k;tint=uTintB;}}',
    '  if(bl>0.0){c=mix(c,tint,bl*0.85*(since<0.5?0.5:1.0));}',
    '  inten*=mix(1.0,0.18,dimK); c=mix(c,GOLD_DEEP,dimK*0.7);',
    '  inten*=mix(1.0,0.15,dimN); inten*=1.0-hideN;',
    // the slash stream down the mark's slash line
    '  if(uSlash>=0.0){',
    '    vec2 A=uMarkRect.xy+vec2(0.5947,0.0)*uMarkRect.zw; vec2 B=uMarkRect.xy+vec2(0.2705,1.0)*uMarkRect.zw;',
    '    vec2 ab=B-A; float t=dot(cc-A,ab)/dot(ab,ab); float dist=length((cc-A)-clamp(t,0.0,1.0)*ab);',
    '    float near=1.0-smoothstep(0.0,cellPx*0.8,dist); float along=uSlash-t;',
    '    float stream=near*step(0.0,t)*step(t,1.0)*(along>=0.0&&along<0.22?1.0-along/0.22:0.0);',
    '    if(stream>inten){inten=stream;c=HEAD;lock=max(lock,stream);lockC=HEAD;}',
    '  }',
    // storefront decode frames
    '  float cov=a; float solid=0.0;',
    // uSweep > 0: the local stage lags along the frame order, so the frame resolves as a sweep of the same slash edge
    '  if(fA){',
    '    vec2 fuv=clamp((ccs-uFrameA.xy)/uFrameA.zw,0.0,1.0); float lodS=log2(max(1.0,cellPx*uShotSizeA.x/uFrameA.z));',
    '    float stA=clamp(uStageA*(1.0+uSweepA)-frameOrder(ccs,uFrameA)*uSweepA,0.0,1.0);',
    '    float s1=smoothstep(0.0,0.35,stA), s2=smoothstep(0.35,0.6,stA), s3=smoothstep(0.6,0.9,stA);',
    '    vec2 puv=(p-uFrameA.xy)/uFrameA.zw; vec3 shot=textureLod(uShotA,mix(fuv,puv,s3),lodS*(1.0-s3)).rgb;',
    '    c=mix(c,shot,s1*(1.0-lock)); cov=mix(cov,1.0,s2); inten=mix(inten,1.0,s2); solid=s2;',
    '  }',
    '  if(fB){',
    '    vec2 fuv=clamp((ccs-uFrameB.xy)/uFrameB.zw,0.0,1.0); float lodS=log2(max(1.0,cellPx*uShotSizeB.x/uFrameB.z));',
    '    float stB=clamp(uStageB*(1.0+uSweepB)-frameOrder(ccs,uFrameB)*uSweepB,0.0,1.0);',
    '    float s1=smoothstep(0.0,0.35,stB), s2=smoothstep(0.35,0.6,stB), s3=smoothstep(0.6,0.9,stB);',
    '    vec2 puv=(p-uFrameB.xy)/uFrameB.zw; vec3 shot=textureLod(uShotB,mix(fuv,puv,s3),lodS*(1.0-s3)).rgb;',
    '    c=mix(c,shot,s1*(1.0-lock)); cov=mix(cov,1.0,s2); inten=mix(inten,1.0,s2); solid=s2;',
    '  }',
    // locked cells: lock colour, full intensity, a soft fill under the glyph so the shape reads
    '  c=mix(c,lockC,lock); inten=mix(inten,1.0,lock); cov=mix(cov,max(cov,fill0),lock); float alphaL=mix(lAlpha,1.0,max(lock,solid));',
    // number-locked cells: an opaque gold-light cell (alpha .92, a soft 1 px inset so the grid reads) with the glyph in night
    '  if(lockN>0.0){vec2 e=min(f,1.0-f)*cellPx; float ins=smoothstep(0.4,1.6,min(e.x,e.y)); c=mix(c,mix(GOLD_LIGHT,NIGHT,a),lockN); cov=mix(cov,0.92*ins,lockN); inten=mix(inten,1.0,lockN); alphaL=mix(alphaL,1.0,lockN);}',
    // front band: bright, gold, full
    '  if(bandC>0.5){inten=max(inten,0.95);c=mix(c,GOLD_LIGHT,0.65*(1.0-max(solid,lockN)));}',
    // rain under copy held low
    '  float tmk=1.0;',
    '  for(int i=0;i<4;i++){if(i>=uTextMaskN)break;vec4 r=uTextMask[i];vec2 d=max(r.xy-ccs,ccs-(r.xy+r.zw));float dd=max(d.x,d.y);tmk=min(tmk,mix(0.25,1.0,smoothstep(0.0,12.0,dd)));}',
    '  inten*=mix(tmk,1.0,max(solid,lockN));',
    '  return vec4(c,cov*inten*alphaL);',
    '}',
    'void main(){',
    '  vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr; vec2 vp=uRes/uDpr;',
    '  float x0=-RUN*vp.y+uFront*(vp.x+RUN*vp.y);',
    '  float dP=p.x-x0-RUN*(vp.y-p.y); float sideP=1.0-step(0.0,dP);',
    '  vec3 col=mix(uGroundA,uGroundB,sideP);',
    '  float grid=mix(uGridA,uGridB,sideP);',
    '  if(grid>0.5){float gln=step(mod(p.x,96.0),1.0)+step(mod(p.y,96.0),1.0);col=mix(col,PAPER,0.06*clamp(gln,0.0,1.0));}',
    '  vec4 l;',
    '  if(uLayers>2){l=layerEval(0,p,vp,x0,3.0,0.26,0.55);col=mix(col,l.rgb,l.a);}',
    '  l=layerEval(1,p,vp,x0,7.0,0.13,0.3);col=mix(col,l.rgb,l.a);',
    '  l=layerEval(2,p,vp,x0,12.0,0.0,0.18);col=mix(col,l.rgb,l.a);',
    // additive: slash glow (fake bloom), pulse ring, front head line
    '  if(uSlashGlow>0.0){vec2 A=uMarkRect.xy+vec2(0.5947,0.0)*uMarkRect.zw;vec2 B=uMarkRect.xy+vec2(0.2705,1.0)*uMarkRect.zw;vec2 ab=B-A;float t=clamp(dot(p-A,ab)/dot(ab,ab),0.0,1.0);float dist=length((p-A)-t*ab);float gw=1.3*uCell.z;col+=GOLD_LIGHT*uSlashGlow*0.5*exp(-(dist*dist)/(gw*gw*0.5));}',
    '  if(uPulse>=0.0&&uPulse<1.4){vec2 cen=uNumRect.xy+uNumRect.zw*0.5;float r=length(p-cen);float ring=exp(-pow((r-uPulse*1100.0)/80.0,2.0))*(1.0-uPulse/1.4);col+=GOLD_LIGHT*ring*0.4;}',
    '  if(uFront>-0.2&&uFront<1.2){float e=abs(dP)/(1.0+RUN*RUN);col+=GOLD_LIGHT*0.18*exp(-e*e/(uCell.z*uCell.z*0.25));}',
    '  fragColor=vec4(col,1.0);',
    '}'
  ].join('\n');

  /* ------------------------------------------------------------- scenes */
  var SCENES = {
    hero:      { ground: C.night, head: C.head, glyph: C.gold, tail: C.goldDeep, dens: [1.0, 0.6, 0.3], speed: 1.0, base: 1.0, grid: 0 },
    page:      { ground: navyField, head: C.head, glyph: C.gold, tail: C.goldDeep, dens: [0.25, 0.16, 0.08], speed: 1.0, base: 0.6, grid: 1 },
    construct: { ground: C.paper, head: C.navy, glyph: C.navy, tail: C.navy2, dens: [0.12, 0.08, 0.04], speed: 0.6, base: 0.5, grid: 1 },
    contact:   { ground: C.night, head: C.head, glyph: C.gold, tail: C.goldDeep, dens: [0.15, 0.10, 0.05], speed: 1.0, base: 0.5, grid: 0 }
  };

  /* --------------------------------------------------------------- state */
  var S = {
    ready: false, hasGL: false, running: false, poster: false, destroyed: false,
    dpr: 1, dprCap: 1.5, W: 1, H: 1, phone: false,
    timeA: 0, timeB: 0, clock: 0, lastT: 0,
    ts: 1, tsFrom: 1, tsTarget: 1, tsT0: 0, tsDur: 0, bulletOn: false,
    velocity: 0, velocityCoupling: true, surgeMul: 1, surgeT: 0, surgeDur: 0,
    front: -0.25, band: 40,
    sceneA: SCENES.hero, sceneB: SCENES.hero, sceneAName: 'hero', sceneBName: 'hero',
    parX: 0, parY: 0, parTX: 0, parTY: 0, pointerLive: false, driftOn: true,
    markRect: new Float32Array([0, 0, 1, 1]), catch: 0, melt: 0, slash: -1, slashGlow: 0, slashT0: -1, dim: 0, timeLock: 0,
    numRect: new Float32Array([0, 0, 1, 1]), catchNum: 0, pulseT0: -1,
    textMask: new Float32Array(16), textMaskN: 0,
    frames: [
      { rect: new Float32Array([0, 0, 1, 1]), stage: 0, sweep: 0, tint: [1, 1, 1], bleed: 0, on: 0, size: [1, 1], image: null, tex: null },
      { rect: new Float32Array([0, 0, 1, 1]), stage: 0, sweep: 0, tint: [1, 1, 1], bleed: 0, on: 0, size: [1, 1], image: null, tex: null }
    ],
    layers: 3, probe: true, probeFrames: 0, probeAcc: 0, probeStage: 0,
    needFrame: false, raf: 0
  };
  var canvas = null, gl = null, prog = null, U = {}, tex = {};
  var cellDesktop = [12, 18, 26], cellPhone = [10, 14, 20];
  var listeners = { ready: [] };
  var resizeTimer = 0;

  function emit(name) { var L = listeners[name] || []; for (var i = 0; i < L.length; i++) { try { L[i](); } catch (e) { /* noop */ } } }

  /* --------------------------------------------------------------- atlas */
  var atlas = document.createElement('canvas');
  atlas.width = 1024; atlas.height = 1024;
  var atlasMeta = { cell: 64, cols: 16, rows: 16, glyphs: GLYPH, count: 47, blank: 46 };
  function buildAtlas() {
    var ctx = atlas.getContext('2d');
    var cs = 64;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 50px "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace';
    var chars = LETTERS + DIGITS + '.·/–';
    for (var i = 0; i < chars.length; i++) {
      var cx = (i % 16) * cs, cy = Math.floor(i / 16) * cs;
      ctx.fillText(chars[i], cx + cs / 2, cy + cs / 2 + 2);
    }
    function cellAt(idx) { return [(idx % 16) * cs, Math.floor(idx / 16) * cs]; }
    function bar(x, y, len, h) {
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.lineTo(x + len - h * SLASH_RUN, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
    }
    var o;
    o = cellAt(40); bar(o[0] + 9, o[1] + 26, 46, 12);
    o = cellAt(41); bar(o[0] + 9, o[1] + 17, 46, 12); bar(o[0] + 9, o[1] + 35, 38, 12);
    o = cellAt(42); bar(o[0] + 9, o[1] + 11, 46, 11); bar(o[0] + 9, o[1] + 27, 38, 11); bar(o[0] + 9, o[1] + 43, 30, 11);
    o = cellAt(43); ctx.beginPath(); ctx.moveTo(o[0] + 45.7, o[1] + 8); ctx.lineTo(o[0] + 50.7, o[1] + 8); ctx.lineTo(o[0] + 25, o[1] + 56); ctx.lineTo(o[0] + 20, o[1] + 56); ctx.closePath(); ctx.fill();
    o = cellAt(44);
    ctx.save(); ctx.translate(o[0] + 32, o[1] + 32); ctx.scale(0.108, 0.108); ctx.translate(-437, -223.5);
    ctx.fill(new Path2D('M652 65H426.5A96.5 96.5 0 0 0 426.5 258H548A32 32 0 0 1 548 322H254.9L222.2 382H548A92 92 0 0 0 548 198H426.5A36.5 36.5 0 0 1 426.5 125H605Z'));
    ctx.restore();
    o = cellAt(45);
    ctx.save(); ctx.translate(o[0] + 32, o[1] + 32); ctx.scale(0.42, 0.42); ctx.translate(-35, -50);
    ctx.fill(new Path2D('M0 100 29 0h12l29 100h-9.5L35 9.5 9.5 100Z'));
    ctx.restore();
    if (gl && tex.atlas) uploadAtlas();
  }
  function uploadAtlas() {
    gl.bindTexture(gl.TEXTURE_2D, tex.atlas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    var ok = true;
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, atlas); if (gl.getError() !== gl.NO_ERROR) ok = false; } catch (e) { ok = false; }
    if (!ok) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  /* words texture: row = word, x0 = length, x1.. = glyph indices */
  var wordsData = new Uint8Array(32 * 64);
  (function () {
    for (var w = 0; w < WORDS.length && w < 64; w++) {
      var s = WORDS[w].toUpperCase(), n = Math.min(31, s.length);
      wordsData[w * 32] = n;
      for (var i = 0; i < n; i++) wordsData[w * 32 + 1 + i] = glyphIndex(s[i]);
    }
  })();

  /* mark mask: R = inside, G = element id (bars 64/128/192, S 255) */
  var markCanvas = document.createElement('canvas');
  markCanvas.width = 512; markCanvas.height = 512;
  (function () {
    var ctx = markCanvas.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 512, 512);
    ctx.save();
    ctx.scale(512 / 660, 512 / 400); ctx.translate(-10, -20);
    ctx.fillStyle = 'rgb(255,64,0)'; ctx.fill(new Path2D('M62 65H365L332.3 125H26Z'));
    ctx.fillStyle = 'rgb(255,128,0)'; ctx.fill(new Path2D('M62 198H292.5L259.8 258H26Z'));
    ctx.fillStyle = 'rgb(255,192,0)'; ctx.fill(new Path2D('M62 322H225.1L192.4 382H26Z'));
    ctx.fillStyle = 'rgb(255,255,0)'; ctx.fill(new Path2D('M652 65H426.5A96.5 96.5 0 0 0 426.5 258H548A32 32 0 0 1 548 322H254.9L222.2 382H548A92 92 0 0 0 548 198H426.5A36.5 36.5 0 0 1 426.5 125H605Z'));
    ctx.restore();
  })();

  /* ------------------------------------------------------------------ GL */
  function makeTex(unit, filter) {
    var t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { var log = gl.getShaderInfoLog(sh); gl.deleteShader(sh); throw new Error('shader: ' + log); }
    return sh;
  }
  function setupGL() {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    var names = ['uRes', 'uDpr', 'uTimeA', 'uTimeB', 'uClock', 'uCell', 'uRate', 'uLAlpha', 'uLayers', 'uPar', 'uFront', 'uBand',
      'uGroundA', 'uGroundB', 'uHeadA', 'uHeadB', 'uGlyphA', 'uGlyphB', 'uTailA', 'uTailB', 'uDensA', 'uDensB', 'uBaseA', 'uBaseB', 'uGridA', 'uGridB',
      'uAtlas', 'uWords', 'uMark', 'uNum', 'uShotA', 'uShotB', 'uWordsN', 'uMarkRect', 'uCatch', 'uMelt', 'uSlash', 'uSlashGlow', 'uDim', 'uTimeLock',
      'uNumRect', 'uCatchNum', 'uPulse', 'uNumLayer', 'uTextMask', 'uTextMaskN', 'uFrameA', 'uFrameB', 'uShotSizeA', 'uShotSizeB',
      'uStageA', 'uStageB', 'uBleedA', 'uBleedB', 'uFrameOnA', 'uFrameOnB', 'uSweepA', 'uSweepB', 'uTintA', 'uTintB'];
    for (var i = 0; i < names.length; i++) U[names[i]] = gl.getUniformLocation(prog, names[i]);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    tex.atlas = makeTex(0, gl.LINEAR); uploadAtlas();
    tex.words = makeTex(1, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 32, 64, 0, gl.RED, gl.UNSIGNED_BYTE, wordsData);
    tex.mark = makeTex(2, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, markCanvas);
    tex.num = makeTex(3, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(16));
    tex.shotA = makeTex(4, gl.LINEAR); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(16));
    tex.shotB = makeTex(5, gl.LINEAR); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(16));
    S.frames[0].tex = tex.shotA; S.frames[1].tex = tex.shotB;
    gl.uniform1i(U.uAtlas, 0); gl.uniform1i(U.uWords, 1); gl.uniform1i(U.uMark, 2); gl.uniform1i(U.uNum, 3); gl.uniform1i(U.uShotA, 4); gl.uniform1i(U.uShotB, 5);
    gl.uniform1f(U.uWordsN, Math.min(64, WORDS.length));
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
    // re-upload any frames that were set before (context restore)
    for (var k = 0; k < 2; k++) if (S.frames[k].image) uploadShot(k, S.frames[k].image);
  }
  function uploadShot(slot, img) {
    var F = S.frames[slot];
    gl.activeTexture(gl.TEXTURE0 + 4 + slot);
    gl.bindTexture(gl.TEXTURE_2D, F.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      F.size[0] = img.naturalWidth || img.width || 1; F.size[1] = img.naturalHeight || img.height || 1;
    } catch (e) { F.on = 0; }
  }

  function resize() {
    if (!canvas) return;
    S.W = Math.max(1, window.innerWidth); S.H = Math.max(1, window.innerHeight);
    S.phone = S.W < 768;
    var cap = S.phone ? Math.min(S.dprCap, 1.25) : S.dprCap;
    var dpr = Math.min(window.devicePixelRatio || 1, cap);
    var w = Math.round(S.W * dpr), h = Math.round(S.H * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    S.dpr = w / S.W;
    if (gl) gl.viewport(0, 0, w, h);
    S.needFrame = true;
  }
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); if (S.poster) requestFrame(); }, 150);
  }

  /* -------------------------------------------------------------- render */
  function easeOut3(u) { u = 1 - u; return 1 - u * u * u; }
  function render(now) {
    var dt = S.lastT ? Math.min(0.05, (now - S.lastT) / 1000) : 0;
    S.lastT = now;
    S.clock += dt;
    // eased time scale
    if (S.tsDur > 0) {
      var u = clamp((now - S.tsT0) / S.tsDur, 0, 1);
      S.ts = lerp(S.tsFrom, S.tsTarget, easeOut3(u));
      if (u >= 1) S.tsDur = 0;
    }
    var velMul = S.velocityCoupling ? clamp(1 + Math.abs(S.velocity) / 1200, 0, 2.5) : 1;
    if (S.surgeDur > 0) { var su = clamp((now - S.surgeT) / S.surgeDur, 0, 1); S.surgeMul = lerp(3, 1, su); if (su >= 1) S.surgeDur = 0; }
    var tsEff = S.ts * velMul * S.surgeMul;
    if (!S.poster) { S.timeA += dt * tsEff * S.sceneA.speed; S.timeB += dt * tsEff * S.sceneB.speed; }
    // parallax: pointer or slow drift
    if (!S.pointerLive && S.driftOn) { S.parTX = Math.sin(S.clock * 0.628) * 0.6; S.parTY = Math.cos(S.clock * 0.43) * 0.35; }
    S.parX += (S.parTX - S.parX) * Math.min(1, dt * 6); S.parY += (S.parTY - S.parY) * Math.min(1, dt * 6);
    // slash stream + glow
    if (S.slashT0 >= 0) {
      var st = (now - S.slashT0) / 1000;
      S.slash = st < 0.45 ? (st / 0.35) : -1;
      S.slashGlow = st < 0.75 ? 1 : Math.max(0, 1 - (st - 0.75) / 0.35);
      if (st > 1.1) { S.slashT0 = -1; S.slash = -1; S.slashGlow = 0; }
    }
    var pulse = S.pulseT0 >= 0 ? (now - S.pulseT0) / 1000 : -1; if (pulse > 1.4) { S.pulseT0 = -1; pulse = -1; }

    var cells = S.phone ? cellPhone : cellDesktop;
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uDpr, S.dpr);
    gl.uniform1f(U.uTimeA, S.timeA); gl.uniform1f(U.uTimeB, S.timeB); gl.uniform1f(U.uClock, S.clock);
    gl.uniform3f(U.uCell, cells[0], cells[1], cells[2]);
    gl.uniform3f(U.uRate, 8, 11, 14);
    gl.uniform3f(U.uLAlpha, 0.25, 0.6, 1.0);
    gl.uniform1i(U.uLayers, S.layers);
    gl.uniform2f(U.uPar, S.parX, S.parY);
    gl.uniform1f(U.uFront, S.front);
    gl.uniform1f(U.uBand, S.band);
    var A = S.sceneA, B = S.sceneB;
    gl.uniform3f(U.uGroundA, A.ground[0], A.ground[1], A.ground[2]); gl.uniform3f(U.uGroundB, B.ground[0], B.ground[1], B.ground[2]);
    gl.uniform3f(U.uHeadA, A.head[0], A.head[1], A.head[2]); gl.uniform3f(U.uHeadB, B.head[0], B.head[1], B.head[2]);
    gl.uniform3f(U.uGlyphA, A.glyph[0], A.glyph[1], A.glyph[2]); gl.uniform3f(U.uGlyphB, B.glyph[0], B.glyph[1], B.glyph[2]);
    gl.uniform3f(U.uTailA, A.tail[0], A.tail[1], A.tail[2]); gl.uniform3f(U.uTailB, B.tail[0], B.tail[1], B.tail[2]);
    gl.uniform3f(U.uDensA, A.dens[0], A.dens[1], A.dens[2]); gl.uniform3f(U.uDensB, B.dens[0], B.dens[1], B.dens[2]);
    gl.uniform1f(U.uBaseA, A.base); gl.uniform1f(U.uBaseB, B.base);
    gl.uniform1f(U.uGridA, A.grid); gl.uniform1f(U.uGridB, B.grid);
    gl.uniform4fv(U.uMarkRect, S.markRect);
    gl.uniform1f(U.uCatch, S.catch); gl.uniform1f(U.uMelt, S.melt);
    gl.uniform1f(U.uSlash, S.slash); gl.uniform1f(U.uSlashGlow, S.slashGlow);
    gl.uniform1f(U.uDim, S.dim); gl.uniform1f(U.uTimeLock, S.timeLock);
    gl.uniform4fv(U.uNumRect, S.numRect);
    gl.uniform1f(U.uCatchNum, S.catchNum); gl.uniform1f(U.uPulse, pulse);
    gl.uniform1i(U.uNumLayer, S.phone ? 1 : 2); // the digits lock on the 14 px mid layer on phones, the 26 px front layer on desktop
    gl.uniform4fv(U.uTextMask, S.textMask); gl.uniform1i(U.uTextMaskN, S.textMaskN);
    var FA = S.frames[0], FB = S.frames[1];
    gl.uniform4fv(U.uFrameA, FA.rect); gl.uniform4fv(U.uFrameB, FB.rect);
    gl.uniform2f(U.uShotSizeA, FA.size[0], FA.size[1]); gl.uniform2f(U.uShotSizeB, FB.size[0], FB.size[1]);
    gl.uniform1f(U.uStageA, FA.stage); gl.uniform1f(U.uStageB, FB.stage);
    gl.uniform1f(U.uBleedA, FA.bleed); gl.uniform1f(U.uBleedB, FB.bleed);
    gl.uniform1f(U.uFrameOnA, FA.on); gl.uniform1f(U.uFrameOnB, FB.on);
    gl.uniform1f(U.uSweepA, FA.sweep); gl.uniform1f(U.uSweepB, FB.sweep);
    gl.uniform3f(U.uTintA, FA.tint[0], FA.tint[1], FA.tint[2]); gl.uniform3f(U.uTintB, FB.tint[0], FB.tint[1], FB.tint[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    S.needFrame = false;
  }
  function probeFrame(dt) {
    if (!S.probe || S.probeStage > 1 || !S.ready) return;
    S.probeFrames++;
    if (S.probeFrames <= 10) return;
    S.probeAcc += dt;
    if (S.probeFrames >= 70) {
      var avg = S.probeAcc / 60;
      S.probeFrames = 0; S.probeAcc = 0;
      if (avg > 16.5) {
        if (S.probeStage === 0) { S.dprCap = 1.0; resize(); S.probeStage = 1; }
        else { S.layers = 2; S.probeStage = 2; }
      } else S.probeStage = 2;
    }
  }
  var lastRaf = 0;
  function tick(now) {
    S.raf = 0;
    if (S.destroyed || !gl) return;
    if (S.poster) { if (S.needFrame) render(now); return; }
    if (!S.running) return;
    var fdt = lastRaf ? now - lastRaf : 16; lastRaf = now;
    render(now);
    probeFrame(fdt);
    S.raf = requestAnimationFrame(tick);
  }
  function start() {
    if (S.poster || S.running || !gl || S.destroyed) return;
    S.running = true; S.lastT = 0; lastRaf = 0;
    if (!S.raf) S.raf = requestAnimationFrame(tick);
  }
  function stop() { S.running = false; if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; } }
  function requestFrame() { S.needFrame = true; if (S.poster && gl && !S.raf) S.raf = requestAnimationFrame(tick); }

  /* ------------------------------------------------------------- pointer */
  var pointerTimer = 0;
  function onPointer(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    S.pointerLive = true;
    S.parTX = (e.clientX / S.W) * 2 - 1; S.parTY = (e.clientY / S.H) * 2 - 1;
    clearTimeout(pointerTimer);
    pointerTimer = setTimeout(function () { S.pointerLive = false; }, 4000);
  }

  /* --------------------------------------------------------------- init */
  function init(cv) {
    if (S.hasGL || S.destroyed) return S.hasGL;
    canvas = cv || document.getElementById('rain');
    if (!canvas) { html.dataset.webgl = 'none'; return false; }
    var opts = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: false };
    try { gl = canvas.getContext('webgl2', opts); } catch (e) { gl = null; }
    if (!gl) { html.dataset.webgl = 'none'; if (window.console) console.warn('[rain] no WebGL2'); return false; }
    try { setupGL(); } catch (e) { gl = null; html.dataset.webgl = 'none'; if (window.console) console.warn('[rain] ' + (e && e.message)); return false; }
    S.hasGL = true;
    html.dataset.webgl = 'ok';
    resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (S.running) { stop(); S.running = false; S.pausedByHidden = true; } }
      else if (S.pausedByHidden) { S.pausedByHidden = false; start(); }
    });
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); stop(); S.hasGL = false; html.dataset.webgl = 'none';
    });
    canvas.addEventListener('webglcontextrestored', function () {
      try { U = {}; tex = {}; setupGL(); S.hasGL = true; html.dataset.webgl = 'ok'; resize(); if (S.poster) requestFrame(); else start(); }
      catch (e) { html.dataset.webgl = 'none'; }
    });
    if (document.fonts && document.fonts.load) {
      document.fonts.load('700 48px "JetBrains Mono"').then(function () { buildAtlas(); S.ready = true; emit('ready'); requestFrame(); }, function () { S.ready = true; emit('ready'); });
    } else { S.ready = true; emit('ready'); }
    if (/[?&]quality=max/.test(location.search)) S.probe = false;
    if (html.dataset.motion === 'reduced') { S.poster = true; requestFrame(); } else start();
    return true;
  }

  /* ------------------------------------------------------------- scene */
  function sceneByName(n) { return SCENES[n] || SCENES.page; }
  function setRect4(arr, r) {
    if (!r) return;
    if (r.length) { arr[0] = r[0]; arr[1] = r[1]; arr[2] = r[2]; arr[3] = r[3]; }
    else {
      arr[0] = r.x !== undefined ? r.x : r.left; arr[1] = r.y !== undefined ? r.y : r.top;
      arr[2] = r.w !== undefined ? r.w : r.width; arr[3] = r.h !== undefined ? r.h : r.height;
    }
    if (arr[2] <= 0) arr[2] = 1; if (arr[3] <= 0) arr[3] = 1;
  }
  function setTimeScale(x, dur) {
    dur = dur || 0;
    if (dur <= 0) { S.ts = S.tsTarget = x; S.tsDur = 0; return; }
    S.tsFrom = S.ts; S.tsTarget = x; S.tsT0 = performance.now(); S.tsDur = dur;
  }

  /* ---------------------------------------------------------------- API */
  var rain = {
    init: init,
    set: function (o) {
      if (!o) return;
      if (o.timeScale !== undefined) setTimeScale(o.timeScale, o.duration);
      if (o.front !== undefined) S.front = o.front;
      if (o.scene !== undefined) { S.sceneA = S.sceneB = sceneByName(o.scene); S.sceneAName = S.sceneBName = o.scene; S.timeA = S.timeB; }
      if (o.sceneA !== undefined) { S.sceneA = sceneByName(o.sceneA); S.sceneAName = o.sceneA; }
      if (o.sceneB !== undefined) { S.sceneB = sceneByName(o.sceneB); S.sceneBName = o.sceneB; }
      if (o.catch !== undefined) { if (S.catch <= 0 && o.catch > 0) S.timeLock = S.timeA; S.catch = clamp(o.catch, 0, 1); }
      if (o.melt !== undefined) S.melt = clamp(o.melt, 0, 1);
      if (o.dim !== undefined) S.dim = clamp(o.dim, 0, 1);
      if (o.markRect) setRect4(S.markRect, o.markRect);
      if (o.numRect) setRect4(S.numRect, o.numRect);
      if (o.catchNum !== undefined) S.catchNum = clamp(o.catchNum, 0, 1);
      if (o.textMask) rain.setTextMask(o.textMask);
      if (o.velocityCoupling !== undefined) S.velocityCoupling = !!o.velocityCoupling;
      if (o.probe !== undefined) S.probe = !!o.probe;
      if (o.band !== undefined) S.band = o.band;
      if (o.parallax) { S.pointerLive = true; S.parTX = o.parallax[0]; S.parTY = o.parallax[1]; }
      if (o.drift !== undefined) S.driftOn = !!o.drift;
      if (o.slash !== undefined) { S.slash = o.slash; if (o.slash < 0) S.slashT0 = -1; }
      if (o.slashGlow !== undefined) S.slashGlow = o.slashGlow;
      if (o.dprCap !== undefined) { S.dprCap = o.dprCap; resize(); }
      if (o.layers !== undefined) S.layers = o.layers;
      if (S.poster) requestFrame();
    },
    setScene: function (name) { rain.set({ scene: name }); },
    setScenePair: function (a, b) { rain.set({ sceneA: a, sceneB: b }); S.timeB = S.timeA; },
    setFront: function (f) { S.front = f; if (S.poster) requestFrame(); },
    setTimeScale: function (x, dur) { setTimeScale(x, dur); },
    bullet: function (on) {
      on = !!on; if (on === S.bulletOn) return; S.bulletOn = on;
      setTimeScale(on ? 0.04 : 1, on ? 450 : 600);
    },
    setCatch: function (x) { if (S.catch <= 0 && x > 0) S.timeLock = S.timeA; S.catch = clamp(x, 0, 1); S.dim = S.catch * (1 - S.melt); if (S.poster) requestFrame(); },
    setMelt: function (x) { S.melt = clamp(x, 0, 1); S.dim = S.catch * (1 - S.melt); if (S.poster) requestFrame(); },
    setMarkRect: function (r) { setRect4(S.markRect, r); if (S.poster) requestFrame(); },
    slash: function () { S.slashT0 = performance.now(); S.slash = 0; S.slashGlow = 1; },
    setTextMask: function (rects) {
      var n = Math.min(4, rects ? rects.length : 0);
      for (var i = 0; i < n; i++) {
        var r = rects[i];
        S.textMask[i * 4] = r.x !== undefined ? r.x : r.left; S.textMask[i * 4 + 1] = r.y !== undefined ? r.y : r.top;
        S.textMask[i * 4 + 2] = r.w !== undefined ? r.w : r.width; S.textMask[i * 4 + 3] = r.h !== undefined ? r.h : r.height;
      }
      S.textMaskN = n;
      if (S.poster) requestFrame();
    },
    frame: function (slot, o) {
      var F = S.frames[slot ? 1 : 0]; if (!F || !o) return;
      if (o.rect) setRect4(F.rect, o.rect);
      if (o.stage !== undefined) F.stage = clamp(o.stage, 0, 1);
      if (o.sweep !== undefined) F.sweep = clamp(o.sweep, 0, 4);
      if (o.bleed !== undefined) F.bleed = clamp(o.bleed, 0, 1);
      if (o.tint) { var t = typeof o.tint === 'string' ? hex(o.tint) : o.tint; F.tint[0] = t[0]; F.tint[1] = t[1]; F.tint[2] = t[2]; }
      if (o.image !== undefined) {
        if (o.image === null) { F.image = null; F.on = 0; }
        else if (o.image !== F.image) { F.image = o.image; if (gl && S.hasGL) uploadShot(slot ? 1 : 0, o.image); F.on = 1; }
        else F.on = 1;
      }
      if (o.on !== undefined) F.on = o.on ? 1 : 0;
      if (S.poster) requestFrame();
    },
    setNumber: function (o) {
      if (!o) return;
      if (o.rect) setRect4(S.numRect, o.rect);
      if (o.maskCanvas && gl && S.hasGL) {
        gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, tex.num);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o.maskCanvas);
      }
      if (o.catch !== undefined) S.catchNum = clamp(o.catch, 0, 1);
      if (S.poster) requestFrame();
    },
    pulse: function () { S.pulseT0 = performance.now(); if (S.poster) requestFrame(); },
    surge: function (ms) { S.surgeT = performance.now(); S.surgeDur = ms || 400; S.surgeMul = 3; },
    velocity: function (v) { S.velocity = v || 0; },
    poster: function () {
      S.poster = true; stop();
      S.timeA = S.timeB = 11.3; S.timeLock = 11.3; S.clock = 11.3; S.slash = -1; S.slashT0 = -1; S.slashGlow = 0; S.pulseT0 = -1;
      S.parX = S.parY = S.parTX = S.parTY = 0; S.pointerLive = true;
      requestFrame();
    },
    resume: function () { S.poster = false; S.pointerLive = false; start(); },
    requestFrame: requestFrame,
    on: function (name, cb) { (listeners[name] = listeners[name] || []).push(cb); if (name === 'ready' && S.ready) cb(); },
    destroy: function () {
      stop(); S.destroyed = true;
      window.removeEventListener('resize', onResize); window.removeEventListener('pointermove', onPointer);
      if (gl) { var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
      gl = null;
    },
    scenes: SCENES,
    get state() { return { ready: S.ready, hasGL: S.hasGL, running: S.running, poster: S.poster, dpr: S.dpr, layers: S.layers, W: S.W, H: S.H, phone: S.phone, front: S.front, sceneA: S.sceneAName, sceneB: S.sceneBName, catch: S.catch, melt: S.melt, timeScale: S.ts, slash: S.slash, slashGlow: S.slashGlow, velocity: S.velocity, textMaskN: S.textMaskN }; }
  };

  ES.rain = rain;
  ES.atlas = atlas;
  ES.atlasMeta = atlasMeta;
  ES.masks = { markCanvas: markCanvas };
  ES.util = { SLASH_RUN: SLASH_RUN, clamp: clamp, lerp: lerp, hex: hex, frontX0: frontX0, slashPolygon: slashPolygon, frontThrough: frontThrough, rectOf: rectOf, rasterText: rasterText, glyphIndex: glyphIndex, PRIM: PRIM, words: WORDS, TAN_SKEW: TAN_SKEW };
  ES.SLASH_RUN = SLASH_RUN;

  /* motion switch (reduced motion / "Reduce effects") */
  var motionCbs = [];
  ES.motion = {
    get reduced() { return html.dataset.motion === 'reduced'; },
    set: function (reduced, persist) {
      html.dataset.motion = reduced ? 'reduced' : 'full';
      if (persist !== false) { try { localStorage.setItem('es-motion', reduced ? 'reduced' : 'full'); } catch (e) { /* noop */ } }
      if (reduced) { rain.poster(); if (ES.text && ES.text.settleAll) ES.text.settleAll(); } else rain.resume();
      for (var i = 0; i < motionCbs.length; i++) { try { motionCbs[i](reduced); } catch (e) { /* noop */ } }
    },
    on: function (cb) { motionCbs.push(cb); }
  };

  buildAtlas();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
