/* 00-engine.js */
(function () {
'use strict';
var ES = window.ES = window.ES || {};
var html = document.documentElement;
var SLASH_RUN = 0.535;
var TAN_SKEW = 0.0437; // tan(2.5deg)
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
function frontX0(f, W, H) { return -SLASH_RUN * H + f * (W + SLASH_RUN * H); }
function slashPolygon(f, rect, side, W, H) {
W = W || window.innerWidth; H = H || window.innerHeight;
var x0 = frontX0(f, W, H);
var L = rect.left !== undefined ? rect.left : rect.x, T = rect.top !== undefined ? rect.top : rect.y;
var w = rect.width !== undefined ? rect.width : rect.w, h = rect.height !== undefined ? rect.height : rect.h;
var xTop = x0 - L + SLASH_RUN * (H - T);        // line x at element top (local)
var xBot = xTop - SLASH_RUN * h;                 // line x at element bottom (local)
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
'float frameOrder(vec2 p,vec4 r){return (p.x-r.x+RUN*(p.y-r.y))/(r.z+RUN*r.w);}',
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
'  float lockN=0.0, hideN=0.0;',
'  if(uCatchNum>0.0&&inRect(cc,uNumRect)){',
'    vec2 nuv=(cc-uNumRect.xy)/uNumRect.zw; float n=textureLod(uNum,nuv,0.0).r;',
'    if(n>0.5){float o=(RUN*(cc.x-uNumRect.x)-(cc.y-uNumRect.y)+uNumRect.w)/(RUN*uNumRect.z+uNumRect.w);',
'      float ln=smoothstep(0.0,0.1,uCatchNum*1.3-o); if(L==uNumLayer) lockN=ln; else hideN=ln;}',
'  }',
'  float dimN=uCatchNum*(1.0-max(lockN,hideN));',
'  bool fA=uFrameOnA>0.5&&inRectX(ccs,uFrameA,cellPx*0.5)&&inRect(p,uFrameA);',
'  bool fB=uFrameOnB>0.5&&inRectX(ccs,uFrameB,cellPx*0.5)&&inRect(p,uFrameB);',
'  float inF=(fA?uStageA:0.0)+(fB?uStageB:0.0);',
'  dens=max(dens,smoothstep(0.0,0.35,inF));',
'  if(h1>=dens&&lock<=0.0&&lockN<=0.0) return vec4(0.0);',
'  dens=max(dens,0.001);',
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
'  float bl=0.0; vec3 tint=GOLD;',
'  if(uFrameOnA>0.5){float d=rectDist(ccs,uFrameA);float k=uBleedA*(1.0-smoothstep(0.0,40.0*uCell.z,d));if(k>bl){bl=k;tint=uTintA;}}',
'  if(uFrameOnB>0.5){float d=rectDist(ccs,uFrameB);float k=uBleedB*(1.0-smoothstep(0.0,40.0*uCell.z,d));if(k>bl){bl=k;tint=uTintB;}}',
'  if(bl>0.0){c=mix(c,tint,bl*0.85*(since<0.5?0.5:1.0));}',
'  inten*=mix(1.0,0.18,dimK); c=mix(c,GOLD_DEEP,dimK*0.7);',
'  inten*=mix(1.0,0.15,dimN); inten*=1.0-hideN;',
'  if(uSlash>=0.0){',
'    vec2 A=uMarkRect.xy+vec2(0.5947,0.0)*uMarkRect.zw; vec2 B=uMarkRect.xy+vec2(0.2705,1.0)*uMarkRect.zw;',
'    vec2 ab=B-A; float t=dot(cc-A,ab)/dot(ab,ab); float dist=length((cc-A)-clamp(t,0.0,1.0)*ab);',
'    float near=1.0-smoothstep(0.0,cellPx*0.8,dist); float along=uSlash-t;',
'    float stream=near*step(0.0,t)*step(t,1.0)*(along>=0.0&&along<0.22?1.0-along/0.22:0.0);',
'    if(stream>inten){inten=stream;c=HEAD;lock=max(lock,stream);lockC=HEAD;}',
'  }',
'  float cov=a; float solid=0.0;',
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
'  c=mix(c,lockC,lock); inten=mix(inten,1.0,lock); cov=mix(cov,max(cov,fill0),lock); float alphaL=mix(lAlpha,1.0,max(lock,solid));',
'  if(lockN>0.0){vec2 e=min(f,1.0-f)*cellPx; float ins=smoothstep(0.4,1.6,min(e.x,e.y)); c=mix(c,mix(GOLD_LIGHT,NIGHT,a),lockN); cov=mix(cov,0.92*ins,lockN); inten=mix(inten,1.0,lockN); alphaL=mix(alphaL,1.0,lockN);}',
'  if(bandC>0.5){inten=max(inten,0.95);c=mix(c,GOLD_LIGHT,0.65*(1.0-max(solid,lockN)));}',
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
'  if(uSlashGlow>0.0){vec2 A=uMarkRect.xy+vec2(0.5947,0.0)*uMarkRect.zw;vec2 B=uMarkRect.xy+vec2(0.2705,1.0)*uMarkRect.zw;vec2 ab=B-A;float t=clamp(dot(p-A,ab)/dot(ab,ab),0.0,1.0);float dist=length((p-A)-t*ab);float gw=1.3*uCell.z;col+=GOLD_LIGHT*uSlashGlow*0.5*exp(-(dist*dist)/(gw*gw*0.5));}',
'  if(uPulse>=0.0&&uPulse<1.4){vec2 cen=uNumRect.xy+uNumRect.zw*0.5;float r=length(p-cen);float ring=exp(-pow((r-uPulse*1100.0)/80.0,2.0))*(1.0-uPulse/1.4);col+=GOLD_LIGHT*ring*0.4;}',
'  if(uFront>-0.2&&uFront<1.2){float e=abs(dP)/(1.0+RUN*RUN);col+=GOLD_LIGHT*0.18*exp(-e*e/(uCell.z*uCell.z*0.25));}',
'  fragColor=vec4(col,1.0);',
'}'
].join('\n');
var SCENES = {
hero:      { ground: C.night, head: C.head, glyph: C.gold, tail: C.goldDeep, dens: [1.0, 0.6, 0.3], speed: 1.0, base: 1.0, grid: 0 },
page:      { ground: navyField, head: C.head, glyph: C.gold, tail: C.goldDeep, dens: [0.25, 0.16, 0.08], speed: 1.0, base: 0.6, grid: 1 },
construct: { ground: C.paper, head: C.navy, glyph: C.navy, tail: C.navy2, dens: [0.12, 0.08, 0.04], speed: 0.6, base: 0.5, grid: 1 },
contact:   { ground: C.night, head: C.head, glyph: C.gold, tail: C.goldDeep, dens: [0.15, 0.10, 0.05], speed: 1.0, base: 0.5, grid: 0 }
};
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
var wordsData = new Uint8Array(32 * 64);
(function () {
for (var w = 0; w < WORDS.length && w < 64; w++) {
var s = WORDS[w].toUpperCase(), n = Math.min(31, s.length);
wordsData[w * 32] = n;
for (var i = 0; i < n; i++) wordsData[w * 32 + 1 + i] = glyphIndex(s[i]);
}
})();
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
function easeOut3(u) { u = 1 - u; return 1 - u * u * u; }
function render(now) {
var dt = S.lastT ? Math.min(0.05, (now - S.lastT) / 1000) : 0;
S.lastT = now;
S.clock += dt;
if (S.tsDur > 0) {
var u = clamp((now - S.tsT0) / S.tsDur, 0, 1);
S.ts = lerp(S.tsFrom, S.tsTarget, easeOut3(u));
if (u >= 1) S.tsDur = 0;
}
var velMul = S.velocityCoupling ? clamp(1 + Math.abs(S.velocity) / 1200, 0, 2.5) : 1;
if (S.surgeDur > 0) { var su = clamp((now - S.surgeT) / S.surgeDur, 0, 1); S.surgeMul = lerp(3, 1, su); if (su >= 1) S.surgeDur = 0; }
var tsEff = S.ts * velMul * S.surgeMul;
if (!S.poster) { S.timeA += dt * tsEff * S.sceneA.speed; S.timeB += dt * tsEff * S.sceneB.speed; }
if (!S.pointerLive && S.driftOn) { S.parTX = Math.sin(S.clock * 0.628) * 0.6; S.parTY = Math.cos(S.clock * 0.43) * 0.35; }
S.parX += (S.parTX - S.parX) * Math.min(1, dt * 6); S.parY += (S.parTY - S.parY) * Math.min(1, dt * 6);
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
var pointerTimer = 0;
function onPointer(e) {
if (e.pointerType && e.pointerType !== 'mouse') return;
S.pointerLive = true;
S.parTX = (e.clientX / S.W) * 2 - 1; S.parTY = (e.clientY / S.H) * 2 - 1;
clearTimeout(pointerTimer);
pointerTimer = setTimeout(function () { S.pointerLive = false; }, 4000);
}
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

/* 01-text.js */
(function () {
'use strict';
var ES = window.ES = window.ES || {};
var html = document.documentElement;
var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·–'; // the brand glyph set only (what the rain atlas carries)
var MAX = 3;
var pool = [], active = [], queue = [], rafId = 0;
function reduced() { return html.dataset.motion === 'reduced'; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function easeOut(u) { u = 1 - clamp(u, 0, 1); return 1 - u * u * u; }
function rnd() { return ALPHABET[(Math.random() * ALPHABET.length) | 0]; }
function getSpan() { return pool.pop() || document.createElement('span'); }
function release(sp) { sp.textContent = ''; sp.className = ''; sp.removeAttribute('style'); sp.removeAttribute('aria-hidden'); if (pool.length < 200) pool.push(sp); }
function offscreen(el) { if (!el || !el.getBoundingClientRect) return false; var r = el.getBoundingClientRect(), H = window.innerHeight; return r.bottom < -H || r.top > 2 * H; }
function loop(now) {
rafId = 0;
for (var i = active.length - 1; i >= 0; i--) {
var j = active[i];
var done = false;
try { done = j.step(now); } catch (e) { done = true; }
if (done) { active.splice(i, 1); j.finish(); }
}
if (queue.length) {
for (var q = queue.length - 1; q >= 0; q--) if (offscreen(queue[q].el)) { var jq = queue.splice(q, 1)[0]; jq.finish(); }
for (var a = active.length - 1; a >= 0; a--) if (offscreen(active[a].el)) { var ja = active.splice(a, 1)[0]; ja.finish(); }
}
while (active.length < MAX && queue.length) { var k = queue.shift(); k.start(now); active.push(k); }
if (active.length) rafId = requestAnimationFrame(loop);
}
function schedule(job) {
if (active.length < MAX) { job.start(performance.now()); active.push(job); } else queue.push(job);
if (!rafId) rafId = requestAnimationFrame(loop);
}
function cancelJob(el) {
var j = el.__esJob; if (!j) return;
var i = active.indexOf(j); if (i > -1) active.splice(i, 1);
i = queue.indexOf(j); if (i > -1) queue.splice(i, 1);
j.finish();
}
function normText(el, opts) {
var t = opts && opts.text !== undefined ? opts.text : (el.dataset.text !== undefined ? el.dataset.text : el.textContent);
return String(t).replace(/\s+/g, ' ').trim();
}
function scramble(el, opts) {
if (!el) return;
opts = opts || {};
cancelJob(el);
var text = normText(el, opts);
el.dataset.text = text;
if (reduced() || opts.instant) { el.textContent = text; if (opts.onDone) opts.onDone(); return; }
var dur = opts.duration || 300, stagger = opts.stagger === undefined ? 18 : opts.stagger, delay = opts.delay || 0;
var lockLast = opts.lockLast || null, lastStep = opts.lockLastStep || 60;
var chars = text.split(''), n = chars.length;
var spans = [], locked = [], flipAt = [], lockAt = [];
var baseAll = (n - 1) * stagger + dur, late = 0;
for (var i = 0; i < n; i++) {
var isLate = lockLast && lockLast(chars[i], i);
lockAt[i] = isLate ? baseAll + (late++) * lastStep : i * stagger + dur;
locked[i] = chars[i] === ' ';
flipAt[i] = 0;
}
var job = {
el: el, t0: 0, lockedW: false,
start: function (now) {
this.t0 = now + delay;
var cs = getComputedStyle(el);
if (cs.display !== 'inline') { var w = el.getBoundingClientRect().width; if (w > 0) { el.style.minWidth = w + 'px'; this.lockedW = true; } }
var sr = getSpan(); sr.className = 'sr-only'; sr.textContent = text;
var wrap = getSpan(); wrap.setAttribute('aria-hidden', 'true'); wrap.className = 'scr';
for (var i = 0; i < n; i++) { var s = getSpan(); s.textContent = locked[i] ? chars[i] : rnd(); wrap.appendChild(s); spans.push(s); }
el.textContent = ''; el.appendChild(sr); el.appendChild(wrap);
this.sr = sr; this.wrap = wrap;
},
step: function (now) {
var t = now - this.t0; if (t < 0) return false;
var all = true;
for (var i = 0; i < n; i++) {
if (locked[i]) continue;
if (t >= lockAt[i]) { spans[i].textContent = chars[i]; locked[i] = true; }
else { all = false; if (now - flipAt[i] > 44) { spans[i].textContent = rnd(); flipAt[i] = now; } }
}
return all;
},
finish: function () {
if (el.__esJob !== job) return;
el.textContent = text;
for (var i = 0; i < spans.length; i++) release(spans[i]);
if (this.sr) release(this.sr); if (this.wrap) release(this.wrap);
if (this.lockedW) el.style.minWidth = '';
el.__esJob = null;
if (opts.onDone) opts.onDone();
}
};
el.__esJob = job;
schedule(job);
}
function digits(el, opts) {
opts = opts || {};
opts.lockLast = function (ch) { return /\d/.test(ch); };
opts.lockLastStep = opts.lockLastStep || 60;
scramble(el, opts);
}
function words(el) {
if (el.__esWords) return el.__esWords;
var list = [];
var nodes = Array.prototype.slice.call(el.childNodes);
for (var i = 0; i < nodes.length; i++) {
var nd = nodes[i];
if (nd.nodeType === 3) {
var parts = nd.nodeValue.split(/(\s+)/);
var frag = document.createDocumentFragment();
for (var k = 0; k < parts.length; k++) {
if (!parts[k]) continue;
if (/^\s+$/.test(parts[k])) { frag.appendChild(document.createTextNode(' ')); continue; }
var sp = document.createElement('span'); sp.className = 'w'; sp.textContent = parts[k]; frag.appendChild(sp); list.push(sp);
}
el.replaceChild(frag, nd);
} else if (nd.nodeType === 1) {
if (nd.classList.contains('sr-only')) continue;
nd.classList.add('w'); list.push(nd);
}
}
el.__esWords = list;
return list;
}
function setWord(sp, e) {
var wght = 400 + 420 * e, wdth = 86 + 39 * e;
sp.style.fontVariationSettings = '"wght" ' + wght.toFixed(1) + ', "wdth" ' + wdth.toFixed(1);
sp.style.opacity = (0.4 + 0.6 * e).toFixed(3);
}
function clearWord(sp) { sp.style.fontVariationSettings = ''; sp.style.opacity = ''; }
function prime(el) { if (!el || reduced()) return; var W = words(el); for (var i = 0; i < W.length; i++) setWord(W[i], 0); }
function solidifyAt(el, p) {
if (!el) return;
var W = words(el);
if (reduced()) { for (var k = 0; k < W.length; k++) clearWord(W[k]); return; }
var n = W.length, kf = n > 1 ? Math.min(0.08, 0.5 / n) : 0;
for (var i = 0; i < n; i++) {
var u = clamp((p - i * kf) / (1 - (n - 1) * kf), 0, 1);
if (u >= 1) clearWord(W[i]); else setWord(W[i], easeOut(u));
}
}
function solidify(el, opts) {
if (!el) return;
opts = opts || {};
cancelJob(el);
var W = words(el);
if (reduced() || opts.instant) { for (var k = 0; k < W.length; k++) clearWord(W[k]); if (opts.onDone) opts.onDone(); return; }
var dur = opts.duration || 600, stagger = opts.stagger === undefined ? 40 : opts.stagger, delay = opts.delay || 0;
var job = {
el: el, t0: 0,
start: function (now) { this.t0 = now + delay; for (var i = 0; i < W.length; i++) setWord(W[i], 0); },
step: function (now) {
var t = now - this.t0; if (t < 0) return false;
var all = true;
for (var i = 0; i < W.length; i++) {
var u = (t - i * stagger) / dur;
if (u >= 1) clearWord(W[i]); else { all = false; setWord(W[i], easeOut(u)); }
}
return all;
},
finish: function () { if (el.__esJob !== job) return; for (var i = 0; i < W.length; i++) clearWord(W[i]); el.__esJob = null; if (opts.onDone) opts.onDone(); }
};
el.__esJob = job;
schedule(job);
}
function lineOf(el) {
var line = el.querySelector('.strike-line');
if (!line) { line = document.createElement('i'); line.className = 'strike-line'; line.setAttribute('aria-hidden', 'true'); el.classList.add('strike-word'); el.appendChild(line); }
return line;
}
function strikeAt(el, p) { if (!el) return; var line = lineOf(el); line.style.transform = 'scaleX(' + clamp(p, 0, 1).toFixed(3) + ')'; }
function strike(el, opts) {
if (!el) return;
opts = opts || {};
var line = lineOf(el);
if (reduced() || opts.instant || !line.animate) { line.style.transform = 'scaleX(1)'; return; }
line.style.transform = '';
line.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: opts.duration || 260, delay: opts.delay || 0, easing: 'cubic-bezier(.52,0,.12,1)', fill: 'forwards' });
}
function finishAll() {
var all = active.concat(queue); active.length = 0; queue.length = 0;
for (var i = 0; i < all.length; i++) all[i].finish();
}
function settleAll() {
finishAll();
var sol = document.querySelectorAll('[data-solidify]');
for (var i = 0; i < sol.length; i++) { var W = sol[i].querySelectorAll('.w'); for (var k = 0; k < W.length; k++) clearWord(W[k]); }
var lines = document.querySelectorAll('.strike-line');
for (var j = 0; j < lines.length; j++) {
var ln = lines[j];
if (ln.getAnimations) { var an = ln.getAnimations(); for (var a = 0; a < an.length; a++) an[a].cancel(); }
ln.style.transform = '';
}
}
ES.text = { scramble: scramble, digits: digits, solidify: solidify, solidifyAt: solidifyAt, prime: prime, strike: strike, strikeAt: strikeAt, finishAll: finishAll, settleAll: settleAll, cancel: cancelJob, words: words };
})();

/* 02-scroll.js */
(function () {
'use strict';
var ES = window.ES = window.ES || {};
var html = document.documentElement;
var U = ES.util;
var reduced = html.dataset.motion === 'reduced';
var fine = html.dataset.input === 'fine';
var touch = !fine;
var hasGSAP = !!(window.gsap && window.ScrollTrigger);
var W = window.innerWidth, H = window.innerHeight;
var sections = Array.prototype.slice.call(document.querySelectorAll('main > .section'));
var windows = [], boundaryCbs = {}, lenis = null, pair = '';
var clamp = U.clamp;
var scroll = ES.scroll = {
isTouch: touch, reduced: reduced, lenis: null, windows: windows, front: -0.25,
onSection: onSection, onBoundary: onBoundary, bindFront: bindFront, scrollTo: scrollTo, setScene: setSceneAttr,
sceneOf: sceneOf, refresh: function () { if (hasGSAP) ScrollTrigger.refresh(); }, teardown: teardown
};
ES.chrome = {
topbar: function (on) { html.dataset.topbar = on ? 'on' : 'off'; },
bottombar: function (on) { html.dataset.bottombar = on ? 'on' : 'off'; }
};
function sceneOf(sec) { return (sec && sec.dataset.scene) || 'page'; }
function setFrontVar(f) { scroll.front = f; html.style.setProperty('--front', f.toFixed(4)); ES.rain.setFront(f); }
function setSceneAttr(name) { if (html.dataset.scene !== name) html.dataset.scene = name; }
function ensurePair(a, b) { var key = a + '>' + b; if (key !== pair) { pair = key; ES.rain.setScenePair(a, b); } }
var pairOwner = null;
function setPair(win, a, b) { var key = a + '-' + b; if (html.dataset.pair !== key) html.dataset.pair = key; pairOwner = win; }
function clearPair(win) { if (pairOwner === win) { delete html.dataset.pair; pairOwner = null; } }
var inkEls = null;
function updateInk(f, a, b) {
if (a !== 'construct' && b !== 'construct') return;
if (!inkEls) inkEls = ['.topbar__brand', '.topbar__nav', '.topbar__cta'].map(function (s) { return document.querySelector(s); });
for (var i = 0; i < inkEls.length; i++) {
var el = inkEls[i]; if (!el) continue;
var r = el.getBoundingClientRect();
var scene = f > U.frontThrough(r.left + r.width * 0.5, r.top + r.height * 0.5) ? b : a;
var ink = scene === 'construct' ? 'paper' : 'night';
if (el.dataset.ink !== ink) el.dataset.ink = ink;
}
}
function clearInk() { if (!inkEls) return; for (var i = 0; i < inkEls.length; i++) if (inkEls[i] && inkEls[i].dataset.ink) delete inkEls[i].dataset.ink; }
function hide(el, on) {
var clip = on ? 'polygon(0 0, 0 0, 0 0)' : '';
if (el.style.clipPath !== clip) el.style.clipPath = clip;
el.style.pointerEvents = on ? 'none' : '';
}
if (hasGSAP) {
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
if (!reduced && fine && window.Lenis) {
lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
scroll.lenis = lenis;
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(lenisRaf);
gsap.ticker.lagSmoothing(0);
}
}
function lenisRaf(t) { if (lenis) lenis.raf(t * 1000); }
var lastY = window.scrollY, lastT = performance.now(), vel = 0, maskY = -1, maskT = 0;
function velTick() {
if (reduced) return; // the still page (switched live) measures its masks on scroll instead
var now = performance.now(), dt = Math.max(1, now - lastT) / 1000, y = window.scrollY;
var v = (y - lastY) / dt; lastY = y; lastT = now;
vel += (v - vel) * Math.min(1, dt * 10);
if (Math.abs(vel) < 2) vel = 0;
ES.rain.velocity(vel);
if (y !== maskY || now - maskT > 200) { maskY = y; maskT = now; updateMasks(); }
}
if (!reduced) { if (hasGSAP) gsap.ticker.add(velTick); else (function raf() { velTick(); requestAnimationFrame(raf); })(); }
function parseRange(sec) {
var src = (touch && sec.dataset.frontRangeTouch) || sec.dataset.frontRange || '';
var r = src.trim().split(/[\s,]+/).map(parseFloat);
return (r.length === 2 && isFinite(r[0]) && isFinite(r[1])) ? r : [0.2, 0.8];
}
function frontOf(p, range) { return -0.25 + 1.5 * clamp((p - range[0]) / (range[1] - range[0]), 0, 1); }
function emitBoundary(id, p, f) { var L = boundaryCbs[id]; if (!L) return; for (var i = 0; i < L.length; i++) { try { L[i](p, f); } catch (e) { /* noop */ } } }
function bindFront(A, B, opts) {
opts = opts || {};
var stageB = B.querySelector('.stage') || B;
var win = { A: A, B: B, stageB: stageB, range: opts.range || parseRange(A), p: 0, docTopB: 0, hA: 0, trigger: null };
windows.push(win);
if (!hasGSAP || reduced) return win;
if (fine) {
win.trigger = ScrollTrigger.create({
trigger: A, start: 'bottom bottom', end: function () { return '+=' + window.innerHeight; },
pin: A, pinSpacing: false, anticipatePin: 1, invalidateOnRefresh: true,
onRefreshInit: function () { stageB.style.transform = ''; hide(stageB, false); hide(A, false); },
onRefresh: function () { measure(win); applyDesktop(win, win.trigger ? win.trigger.progress : 0); },
onUpdate: function (self) { applyDesktop(win, self.progress); }
});
} else {
win.trigger = ScrollTrigger.create({
trigger: stageB, start: 'top bottom', end: 'top top', invalidateOnRefresh: true,
onUpdate: function (self) { applyTouch(win, self.progress); },
onRefresh: function () { applyTouch(win, win.trigger ? win.trigger.progress : 0); }
});
}
return win;
}
function measure(win) {
var r = win.stageB.getBoundingClientRect();
win.docTopB = r.top + window.scrollY;
win.hA = win.A.offsetHeight;
W = window.innerWidth; H = window.innerHeight;
}
var rectV = { x: 0, y: 0, w: 1, h: 1 };
function applyDesktop(win, p) {
if (p < 1e-4) p = 0; else if (p > 1 - 1e-4) p = 1;
var f = frontOf(p, win.range), A = win.A, sB = win.stageB, sa = sceneOf(A), sb = sceneOf(win.B);
win.p = p;
emitBoundary(A.id, p, f);
if (p <= 0) { sB.style.transform = ''; hide(sB, false); hide(A, false); clearPair(win); clearInk(); return; }
ensurePair(sa, sb);
if (p >= 1) { setFrontVar(1.25); setSceneAttr(sb); sB.style.transform = ''; hide(sB, false); hide(A, true); clearPair(win); clearInk(); return; }
setPair(win, sa, sb);
setFrontVar(f); setSceneAttr(f > 0.5 ? sb : sa); updateInk(f, sa, sb);
var yB = win.docTopB - window.scrollY;
if (f <= -0.25) { hide(sB, true); sB.style.transform = 'translate3d(0,' + (-yB).toFixed(1) + 'px,0)'; }
else {
rectV.x = 0; rectV.y = 0; rectV.w = W; rectV.h = Math.max(H, sB.offsetHeight);
sB.style.clipPath = f >= 1.25 ? '' : U.slashPolygon(f, rectV, 'new', W, H);
sB.style.pointerEvents = '';
sB.style.transform = 'translate3d(0,' + (-yB).toFixed(1) + 'px,0)';
}
if (f >= 1.25) hide(A, true);
else { rectV.x = 0; rectV.y = H - win.hA; rectV.w = W; rectV.h = win.hA; A.style.clipPath = U.slashPolygon(f, rectV, 'old', W, H); A.style.pointerEvents = ''; }
}
function applyTouch(win, p) {
if (p < 1e-4) p = 0; else if (p > 1 - 1e-4) p = 1;
var f = frontOf(p, win.range), A = win.A, sB = win.stageB, sa = sceneOf(A), sb = sceneOf(win.B);
win.p = p;
emitBoundary(A.id, p, f);
if (p <= 0) { hide(sB, false); clearPair(win); clearInk(); return; }
ensurePair(sa, sb);
if (p >= 1) { setFrontVar(1.25); setSceneAttr(sb); hide(sB, false); clearPair(win); clearInk(); return; }
setPair(win, sa, sb);
setFrontVar(f); setSceneAttr(f > 0.5 ? sb : sa); updateInk(f, sa, sb);
if (f <= -0.25) { hide(sB, true); return; }
var r = sB.getBoundingClientRect();
rectV.x = r.left; rectV.y = r.top; rectV.w = r.width; rectV.h = r.height;
sB.style.clipPath = f >= 1.25 ? '' : U.slashPolygon(f, rectV, 'new', window.innerWidth, window.innerHeight);
sB.style.pointerEvents = '';
}
function onBoundary(id, cb) { (boundaryCbs[id] = boundaryCbs[id] || []).push(cb); }
function onSection(id, h) {
var sec = typeof id === 'string' ? document.getElementById(id) : id;
if (!sec || !hasGSAP) return null;
h = h || {};
var t = [];
if (h.enter || h.leave) t.push(ScrollTrigger.create({
trigger: sec, start: 'top 60%', end: 'bottom 40%',
onEnter: function () { h.enter && h.enter('down'); }, onEnterBack: function () { h.enter && h.enter('up'); },
onLeave: function () { h.leave && h.leave('down'); }, onLeaveBack: function () { h.leave && h.leave('up'); }
}));
if (h.progress) t.push(ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onUpdate: function (s) { h.progress(s.progress, s.direction); } }));
return t;
}
function docTop(el) {
var y = 0, e = el;
while (e && e !== document.body && e !== html) {
if (getComputedStyle(e).position === 'fixed') {
for (var i = 0; i < windows.length; i++) if (windows[i].A === e && windows[i].trigger) return y + windows[i].trigger.start - e.offsetHeight + window.innerHeight;
return y + e.getBoundingClientRect().top + window.scrollY;
}
y += e.offsetTop; e = e.offsetParent;
}
return y;
}
function sectionOf(el) { var s = (el && el.closest) ? el.closest('.section') : null; return (s && sections.indexOf(s) > -1) ? s : null; }
function windowsOf(sec) {
var o = { prev: null, next: null };
for (var i = 0; i < windows.length; i++) { if (windows[i].B === sec) o.prev = windows[i]; if (windows[i].A === sec) o.next = windows[i]; }
return o;
}
function focusable(el) { return !!(el.matches && el.matches('a[href], button, input, select, textarea, summary, [tabindex]')); }
function focusTarget(el) {
if (document.activeElement === el) return;
if (!focusable(el)) el.tabIndex = -1;
try { el.focus({ preventScroll: true }); } catch (e) { /* noop */ }
}
function scrollTo(target, opts) {
var el = typeof target === 'string' ? document.querySelector(target) : target;
if (!el) return;
opts = opts || {};
var margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
var top = Math.max(0, docTop(el) - margin);
if (hasGSAP && !reduced) {
var sec = sectionOf(el), w = sec ? windowsOf(sec) : null;
if (w && w.next && w.next.trigger) top = Math.min(top, w.next.trigger.start);
if (w && w.prev && w.prev.trigger && w.prev.stageB.contains(el)) top = Math.max(top, w.prev.trigger.end);
}
top = Math.max(0, Math.round(top));
var dur = opts.duration || 1.2;
function land() { if (opts.focus !== false) focusTarget(el); }
if (lenis) { if (Math.abs(top - window.scrollY) < 1) land(); else lenis.scrollTo(top, { duration: dur, onComplete: land }); }
else { window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' }); setTimeout(land, reduced ? 0 : 700); }
}
scroll.docTop = docTop;
document.addEventListener('focusin', function (e) {
if (reduced || !hasGSAP) return;
var el = e.target; if (!el || el === document.body || !el.closest) return;
var sec = sectionOf(el); if (!sec) return;
var w = windowsOf(sec);
var clipped = (fine && w.next && w.next.p > w.next.range[0]) || (w.prev && w.prev.p > 0 && w.prev.p < w.prev.range[1] && w.prev.stageB.contains(el));
if (clipped) scrollTo(el);
});
var maskEls = [], visible = [], io = null, maskRects = [{}, {}, {}, {}];
function collectMasks() {
maskEls = Array.prototype.slice.call(document.querySelectorAll('[data-textmask]'));
if (io) io.disconnect();
if (!('IntersectionObserver' in window)) { visible = maskEls.slice(); return; }
io = new IntersectionObserver(function (entries) {
for (var i = 0; i < entries.length; i++) {
var e = entries[i], idx = visible.indexOf(e.target);
if (e.isIntersecting && idx < 0) visible.push(e.target);
else if (!e.isIntersecting && idx > -1) visible.splice(idx, 1);
}
}, { rootMargin: '0px' });
for (var i = 0; i < maskEls.length; i++) io.observe(maskEls[i]);
}
var maskOut = [];
function updateMasks() {
maskOut.length = 0;
for (var i = 0; i < visible.length && maskOut.length < 8; i++) {
var el = visible[i];
if (el.dataset.textmask === 'off') continue;
var r = el.getBoundingClientRect();
if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > H) continue;
maskOut.push(r);
}
if (maskOut.length > 4) maskOut.sort(function (a, b) { return b.width * b.height - a.width * a.height; });
for (var k = 0; k < 4 && k < maskOut.length; k++) { var m = maskRects[k], rr = maskOut[k]; m.x = rr.left - 6; m.y = rr.top - 4; m.w = rr.width + 12; m.h = rr.height + 8; }
ES.rain.setTextMask(maskRects.slice(0, Math.min(4, maskOut.length)));
}
scroll.collectMasks = collectMasks;
scroll.updateMasks = updateMasks;
var holdTimer = 0, holding = false;
function releaseHold() { clearTimeout(holdTimer); holdTimer = 0; if (holding) { holding = false; ES.rain.bullet(false); delete html.dataset.bullet; } }
if (!reduced) {
window.addEventListener('pointerdown', function (e) {
if (e.button !== undefined && e.button !== 0) return;
if (e.target.closest && e.target.closest('a, button, input, label, select, textarea, summary, [data-no-hold]')) return;
clearTimeout(holdTimer);
holdTimer = setTimeout(function () { holding = true; ES.rain.bullet(true); html.dataset.bullet = '1'; }, 180);
}, { passive: true });
window.addEventListener('pointerup', releaseHold, { passive: true });
window.addEventListener('pointercancel', releaseHold, { passive: true });
window.addEventListener('blur', releaseHold);
window.addEventListener('touchmove', function () { if (!holding) clearTimeout(holdTimer); }, { passive: true });
}
document.addEventListener('click', function (e) {
var a = e.target.closest && e.target.closest('a[href^="sms:"], a[href^="tel:"]');
if (!a) return;
ES.rain.surge(400); ES.rain.pulse();
}, { passive: true });
document.addEventListener('pointerdown', function (e) {
var a = e.target.closest && e.target.closest('a[href^="sms:"]');
if (a) ES.rain.pulse();
}, { passive: true });
document.addEventListener('click', function (e) {
var a = e.target.closest && e.target.closest('a[href^="#"]');
if (!a || !lenis) return;
var id = a.getAttribute('href').slice(1); if (!id) return;
var el = document.getElementById(id); if (!el) return;
e.preventDefault();
scrollTo(el);
if (history.replaceState) history.replaceState(null, '', '#' + id);
});
var inOff = 0, pastHero = false;
function updateBottombar() { html.dataset.bottombar = (pastHero && inOff <= 0) ? 'on' : 'off'; }
function setupChrome() {
var hero = document.getElementById('hero');
if (hasGSAP && hero) {
ScrollTrigger.create({ trigger: hero, start: 'bottom top', onEnter: function () { pastHero = true; updateBottombar(); }, onLeaveBack: function () { pastHero = false; updateBottombar(); } });
} else {
window.addEventListener('scroll', function () { var p = window.scrollY > H * 0.6; if (p !== pastHero) { pastHero = p; updateBottombar(); } }, { passive: true });
}
sections.forEach(function (sec) {
if (sec.dataset.bottombar !== 'off' || !hasGSAP) return;
ScrollTrigger.create({ trigger: sec, start: 'top 70%', end: 'bottom 30%', onToggle: function (s) { inOff += s.isActive ? 1 : -1; updateBottombar(); } });
});
var links = Array.prototype.slice.call(document.querySelectorAll('.topbar__nav a[href^="#"]'));
links.forEach(function (a) {
var sec = document.getElementById(a.getAttribute('href').slice(1)); if (!sec || !hasGSAP) return;
ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: function (s) { if (s.isActive) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); } });
});
var tgl = document.getElementById('reduce-fx');
if (tgl) {
tgl.checked = reduced;
tgl.addEventListener('change', function () {
if (tgl.checked) { ES.motion.set(true); teardown(); }
else { ES.motion.set(false); location.reload(); }
});
}
var cp = document.querySelector('[data-copy]');
if (cp) cp.addEventListener('click', function () {
var v = cp.dataset.copy, live = document.getElementById('contact-copied');
function ok() { cp.textContent = 'Copied'; if (live) live.textContent = 'Number copied'; setTimeout(function () { cp.textContent = 'Copy number'; }, 1600); }
if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(ok, function () { fallback(); });
else fallback();
function fallback() {
var ta = document.createElement('textarea'); ta.value = v; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { /* noop */ } document.body.removeChild(ta);
}
});
}
function teardown() {
if (hasGSAP) { ScrollTrigger.getAll().forEach(function (t) { t.kill(); }); gsap.ticker.remove(lenisRaf); }
if (lenis) { lenis.destroy(); lenis = null; scroll.lenis = null; }
windows.forEach(function (w) { w.stageB.style.transform = ''; hide(w.stageB, false); hide(w.A, false); });
delete html.dataset.pair; pairOwner = null; clearInk();
html.style.setProperty('--front', '1.25');
ES.text.finishAll();
reduced = true; scroll.reduced = true;
bindStatic();
window.addEventListener('scroll', function () { var p = window.scrollY > window.innerHeight * 0.9; if (p !== pastHero) { pastHero = p; updateBottombar(); } }, { passive: true });
}
var staticBound = false, onHero = null;
function staticScene() {
var mid = window.innerHeight * 0.5, cur = sections[0];
for (var i = 0; i < sections.length; i++) { if (sections[i].getBoundingClientRect().top <= mid) cur = sections[i]; }
setSceneAttr(sceneOf(cur));
var h = cur === sections[0];
if (h !== onHero) { onHero = h; ES.rain.set({ catch: h ? 1 : 0, dim: h ? 1 : 0.6 }); }
updateMasks();
}
function bindStatic() {
if (staticBound) return; staticBound = true;
html.style.setProperty('--front', '1.25');
ES.rain.setFront(-0.25);
window.addEventListener('scroll', staticScene, { passive: true });
staticScene();
}
function boot() {
collectMasks();
if (!reduced) {
for (var i = 0; i < sections.length - 1; i++) bindFront(sections[i], sections[i + 1]);
ES.rain.setScene(sceneOf(sections[0]));
setFrontVar(-0.25); setSceneAttr(sceneOf(sections[0]));
} else {
setSceneAttr('hero');
ES.rain.setScene('hero');
bindStatic();
}
setupChrome();
if (hasGSAP) {
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
window.addEventListener('load', function () { ScrollTrigger.refresh(); });
}
if (location.hash && hasGSAP) setTimeout(function () { ScrollTrigger.refresh(); }, 50);
}
var resizeT = 0;
window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(function () { W = window.innerWidth; H = window.innerHeight; windows.forEach(measure); if (reduced) updateMasks(); }, 150); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* 10-hero.js */
(function () {
'use strict';
var ES = window.ES = window.ES || {};
var html = document.documentElement;
var hero = document.getElementById('hero');
if (!hero) return;
var reduced = html.dataset.motion === 'reduced';
var touch = html.dataset.input !== 'fine';
var hasGSAP = !!(window.gsap && window.ScrollTrigger);
var clamp = ES.util.clamp;
var $ = function (id) { return document.getElementById(id); };
var els = {
intro: $('hero-intro') || hero.querySelector('.hero__intro'), mark: $('hero-mark'), copy: $('hero-copy'), title: $('hero-title'),
sub: $('hero-sub'), cta: $('hero-cta'), thesis: $('hero-thesis'), line1: $('hero-line-1'), line2: $('hero-line-2'),
strike: $('hero-strike'), lock: $('hero-lock'), cue: $('hero-cue'), topCta: $('topbar-cta'),
wm: Array.prototype.slice.call(document.querySelectorAll('#wordmark [data-scramble-part]'))
};
function measureMark() {
if (!els.mark) return;
var r = els.mark.getBoundingClientRect();
ES.rain.setMarkRect({ x: r.left, y: r.top, w: r.width, h: r.height });
}
function measureCopy() {
if (!els.copy) return;
var W = els.title ? els.title.querySelectorAll('.w') : [], saved = [], i;
for (i = 0; i < W.length; i++) { saved.push(W[i].style.fontVariationSettings); W[i].style.fontVariationSettings = ''; }
hero.style.setProperty('--copy-h', Math.round(els.copy.offsetHeight) + 'px');
for (i = 0; i < W.length; i++) W[i].style.fontVariationSettings = saved[i];
}
function remeasure() { measureCopy(); measureMark(); }
var mT = 0;
window.addEventListener('resize', function () { clearTimeout(mT); mT = setTimeout(remeasure, 160); });
remeasure();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
var trackUntil = 0, tracking = false;
function trackMark(ms) {
trackUntil = performance.now() + ms;
if (tracking) return; tracking = true;
(function tick() { measureMark(); if (performance.now() < trackUntil) requestAnimationFrame(tick); else { tracking = false; measureMark(); } })();
}
var following = false, sT = 0;
function followPoster() {
if (following) return; following = true;
window.addEventListener('scroll', function () { if (!sT) sT = requestAnimationFrame(function () { sT = 0; measureMark(); }); }, { passive: true });
measureMark();
}
if (reduced) {
hero.classList.add('is-idle');
ES.rain.set({ scene: 'hero', catch: 1, melt: 0, dim: 1, front: -0.25 });
ES.rain.on('ready', function () { measureMark(); ES.rain.requestFrame(); });
followPoster();
return;
}
ES.rain.set({ scene: 'hero', timeScale: 1, catch: 0, melt: 0, velocityCoupling: false });
if (els.copy) els.copy.dataset.textmask = 'off';
if (els.thesis) els.thesis.dataset.textmask = 'off';
if (els.intro) els.intro.dataset.textmask = 'off';
ES.text.prime(els.title); ES.text.prime(els.line1); ES.text.prime(els.line2);
var done = false, scrubP = 0;
var catchP = { v: 0 };
function showIntro() { if (els.intro) { els.intro.style.opacity = '1'; els.intro.dataset.textmask = 'on'; ES.text.scramble(els.intro); } }
function showCopy() {
if (!els.copy) return;
els.copy.style.opacity = '1'; els.copy.dataset.textmask = 'on';
hero.classList.add('is-copy'); trackMark(720);   // the mark yields to the headline (desktop pose, CSS); the engine follows the box
ES.text.solidify(els.title);
}
function showCta() {
hero.classList.add('is-cta');                     // the subline and the pill exist only from their own arrival
if (els.sub) ES.text.scramble(els.sub);
if (els.cta) ES.text.digits(els.cta);
if (els.cue) els.cue.style.opacity = '1';
}
function idle() {
done = true;
hero.classList.add('is-idle'); hero.classList.add('is-copy'); hero.classList.add('is-cta');
trackMark(720);
ES.rain.bullet(false);
ES.rain.setCatch(1);
ES.rain.set({ velocityCoupling: true });
if (els.copy && scrubP <= 0) { els.copy.style.opacity = '1'; els.copy.dataset.textmask = 'on'; }
if (els.intro) els.intro.dataset.textmask = 'on';
}
var tl = null;
if (hasGSAP) {
tl = gsap.timeline({ paused: true, onComplete: idle });
tl.call(function () { els.wm.forEach(function (p) { ES.text.scramble(p, { duration: 260 }); }); if (els.topCta) ES.text.digits(els.topCta, { lockLastStep: 40 }); }, null, 0.2);
tl.call(showIntro, null, 0.3);
tl.call(function () { ES.rain.bullet(true); }, null, 0.9);
tl.to(catchP, { v: 1, duration: 1.4, ease: 'none', onUpdate: function () { ES.rain.setCatch(catchP.v); } }, 1.2);
tl.call(function () { ES.rain.slash(); }, null, 2.8);
tl.call(function () { ES.rain.bullet(false); showCopy(); }, null, 3.2);
tl.call(showCta, null, 4.0);
tl.to({}, { duration: 1.3 }, 4.0);
}
function skip() {
if (done) return;
if (tl) { tl.progress(1); } else idle();
ES.text.finishAll();
if (els.intro) els.intro.style.opacity = '1';
if (els.copy) { els.copy.style.opacity = '1'; }
if (els.cue) els.cue.style.opacity = '1';
ES.rain.set({ catch: 1, slash: -1, slashGlow: 0 });
ES.rain.setTimeScale(1, 0);
}
var t0 = performance.now();
function maybeSkip(e) {
if (done || performance.now() - t0 < 350) return;
if (e && e.type === 'keydown' && !/^(Space|ArrowDown|ArrowUp|PageDown|PageUp|End|Home)$/.test(e.code)) return;
skip();
}
window.addEventListener('wheel', maybeSkip, { passive: true });
window.addEventListener('touchmove', maybeSkip, { passive: true });
window.addEventListener('scroll', function () { if (window.scrollY > 4) maybeSkip(); }, { passive: true });
window.addEventListener('keydown', maybeSkip);
window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse' || !e.target.closest('a, button')) maybeSkip(e); }, { passive: true });
setTimeout(function () { if (!done) { skip(); } }, 7000);
if (tl) {
if (!touch) ES.rain.set({ drift: false });
tl.play();
} else {
showIntro(); showCopy(); showCta(); ES.rain.setCatch(1); idle();
}
function applyScrub(p) {
scrubP = p = clamp(p, 0, 1);
if (p > 0.02 && !done) skip();
ES.rain.setMelt(p);
var out = clamp(p / 0.28, 0, 1);
if (els.copy) {
els.copy.style.opacity = done ? (1 - out).toFixed(3) : '0';
els.copy.style.transform = 'translate3d(0,' + (-140 * out).toFixed(1) + 'px,0)';
els.copy.dataset.textmask = (done && out < 0.6) ? 'on' : 'off';
}
if (els.intro) els.intro.style.opacity = done ? (1 - out).toFixed(3) : '0';
if (els.cue) els.cue.style.opacity = done ? (1 - out).toFixed(3) : '0';
var tin = clamp((p - 0.34) / 0.66, 0, 1);
if (els.thesis) {
els.thesis.style.opacity = tin > 0 ? '1' : '0';
els.thesis.dataset.textmask = tin > 0.2 ? 'on' : 'off';
}
ES.text.solidifyAt(els.line1, clamp(tin / 0.55, 0, 1));
ES.text.strikeAt(els.strike, clamp((tin - 0.5) / 0.2, 0, 1));
ES.text.solidifyAt(els.line2, clamp((tin - 0.3) / 0.55, 0, 1));
var lk = clamp((tin - 0.82) / 0.18, 0, 1);
if (els.lock) els.lock.style.color = lk > 0 ? 'color-mix(in srgb, var(--gold) ' + Math.round(lk * 100) + '%, var(--paper))' : '';
}
var meltST = null;
if (hasGSAP) {
if (!touch) {
ES.scroll.onBoundary('hero', function (p) { applyScrub(p / 0.6); });
} else {
meltST = ScrollTrigger.create({ trigger: hero, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 0.6); }, onUpdate: function (s) { applyScrub(s.progress); } });
}
}
ES.rain.on('ready', measureMark);
ES.motion.on(function (r) {
if (!r) return;
done = true;
if (tl) { tl.kill(); tl = null; }
if (meltST) { meltST.kill(); meltST = null; }
hero.classList.add('is-idle');
['copy', 'intro', 'cue', 'thesis'].forEach(function (k) { var el = els[k]; if (!el) return; el.style.opacity = ''; el.style.transform = ''; delete el.dataset.textmask; });
if (els.lock) els.lock.style.color = '';
ES.text.solidifyAt(els.line1, 1); ES.text.solidifyAt(els.line2, 1); ES.text.strikeAt(els.strike, 1);
ES.rain.set({ scene: 'hero', catch: 1, melt: 0, dim: 1, slash: -1, slashGlow: 0, timeScale: 1 });
remeasure();
followPoster();
});
})();

/* 20-pillars.js */
(function () {
'use strict';
var ES = window.ES, sec = document.getElementById('pillars');
if (!ES || !sec) return;
var html = document.documentElement;
var reduced = html.dataset.motion === 'reduced';
var hasST = !!(window.gsap && window.ScrollTrigger);
var text = ES.text;
var eyebrow = document.getElementById('pillars-title');
var bars = Array.prototype.slice.call(sec.querySelectorAll('.bar'));
var words = bars.map(function (b) { return b.querySelector('.bar__word'); });
var lines = bars.map(function (b) { return b.querySelector('.bar__line'); });
var entered = false, enteredAt = 0, eyebrowDone = false;
if (reduced || !hasST) { sec.classList.add('is-in'); return; }
words.forEach(function (w) { text.prime(w); });
function enter() {
if (entered) return;
entered = true; enteredAt = performance.now();
sec.classList.add('is-in');
if (!eyebrowDone) { eyebrowDone = true; text.scramble(eyebrow, { duration: 260 }); }
words.forEach(function (w, i) { text.solidify(w, { delay: 160 + i * 120 }); });
lines.forEach(function (l, i) { text.scramble(l, { delay: 260 + i * 120, duration: 300, stagger: 14 }); });
}
function rearm() {
if (!entered || performance.now() - enteredAt < 2000) return;
entered = false; eyebrowDone = false;
sec.classList.remove('is-in');
words.forEach(function (w) { text.prime(w); });
}
function heroWin() { var W = ES.scroll.windows || []; for (var i = 0; i < W.length; i++) if (W[i].A && W[i].A.id === 'hero') return W[i]; return null; }
ES.scroll.onBoundary('hero', function (p, f) {
if (f > 0.02 && !eyebrowDone && !entered) { eyebrowDone = true; text.scramble(eyebrow, { duration: 260 }); }
if (f >= 0.08) enter();
});
ES.scroll.onSection(sec, {
enter: function () { var w = heroWin(); if (w && w.p > 0 && w.p < 1) return; enter(); },
progress: function (p) { if (p <= 0.001 || p >= 0.999) rearm(); }
});
bars.forEach(function (b, i) {
var link = b.querySelector('.bar__link'), last = 0;
function once() {
if (!entered) return;
var now = performance.now(); if (now - last < 2000) return;
last = now; text.scramble(lines[i], { duration: 300, stagger: 14 });
}
link.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') once(); });
link.addEventListener('focus', once);
});
ES.motion.on(function (r) { if (r) { entered = true; sec.classList.add('is-in'); words.forEach(function (w) { text.solidify(w, { instant: true }); }); } });
})();

/* 21-diagnose.js */
(function () {
'use strict';
var ES = window.ES, sec = document.getElementById('diagnose');
if (!ES || !sec) return;
var html = document.documentElement;
var reduced = html.dataset.motion === 'reduced';
var hasST = !!(window.gsap && window.ScrollTrigger);
var DATA = {
"phone": "+13133006898",
"touchpoints": ["search", "first click", "the site", "order / booking", "follow-up text", "return visit"],
"kinds": [
{ "id": "bakery", "chip": "Bakery", "noun": "a bakery", "client": "Family Bakery", "place": "W Warren Ave", "slug": "family-bakery",
"leaks": [[2, "menu, online ordering, catering requests, English and Arabic"], [4, "instant text reply"]] },
{ "id": "barber", "chip": "Barber", "noun": "a barbershop", "client": "Creative Style", "place": "Ford Rd", "slug": "creative-style",
"leaks": [[3, "online booking by barber and chair, confirmed by text"], [4, "a reminder text before the cut, a rebook link after"]] },
{ "id": "cafe", "chip": "Cafe", "noun": "a cafe", "client": "The Snug Mug", "place": "Middlebelt Rd", "slug": "snug-mug",
"leaks": [[1, "hours, menu and directions on the first tap"], [3, "order ahead for pickup, built into the site"], [5, "a loyalty card that lives in their phone"]] },
{ "id": "matcha", "chip": "Matcha pop-up", "noun": "a matcha pop-up", "client": "Big Wiss Matcha", "place": "Dearborn", "slug": "big-wiss-matcha",
"leaks": [[0, "a page for this week's spot, with hours and a map"], [2, "the menu and the drops, with where the cart is today"], [5, "a text when the next drop goes live"]] },
{ "id": "fun", "chip": "Fun center", "noun": "a fun center", "client": "Bounce It Up", "place": "Plymouth Rd", "slug": "bounce-it-up",
"leaks": [[2, "hours, passes and parties, built for a parent on a phone"], [3, "party booking with online waivers"], [4, "booking confirmed by text, waiver link included"]] },
{ "id": "shoes", "chip": "Shoe boutique", "noun": "a shoe boutique", "client": "D'Moda Shoes", "place": "Monroe St", "slug": "dmoda-shoes",
"leaks": [[2, "an online store with sizes in stock, synced with the shelf"], [3, "checkout that works on a phone, pickup or shipping"], [5, "a text when a size is back or the next drop lands"]] },
{ "id": "streetwear", "chip": "Streetwear", "noun": "a streetwear brand", "client": "313 Apparel", "place": "Online", "slug": "313-apparel",
"leaks": [[2, "a storefront built around drops, with a waitlist"], [4, "drop alerts by text, with the link to buy"], [5, "a members list that hears about the next drop first"]] },
{ "id": "urgent", "chip": "Urgent care", "noun": "an urgent care", "client": "Monarch Urgent Care", "place": "Allen Park", "slug": "monarch-urgent-care",
"leaks": [[0, "a clinic page with hours, services and insurance, built for a phone"], [1, "one tap to call, one tap to directions"], [3, "online check-in before leaving the house"]] },
{ "id": "fish", "chip": "Fish market", "noun": "a fish market", "client": "Express Poultry & Fish", "place": "Fish market", "slug": "express-poultry-fish",
"leaks": [[2, "the counter online: today's fish, zabiha halal chicken, hours"], [3, "call-ahead orders taken on the site, ready at the counter"], [4, "instant text reply when someone asks what's fresh"]] }
]
};
var TP = DATA.touchpoints, KINDS = DATA.kinds, PHONE = DATA.phone;
var STEP = 280, text = ES.text;
var chips = Array.prototype.slice.call(sec.querySelectorAll('.chip'));
var live = document.getElementById('dx-live');
var print = document.getElementById('dx-print');
var seeLink = document.getElementById('dx-see'), seeText = seeLink && seeLink.querySelector('[data-scramble]');
var tag = document.getElementById('dx-tag'), msg = document.getElementById('dx-msg'), cta = document.getElementById('diagnose-cta');
var status = document.getElementById('dx-status');
if (!live || !print || !cta) return;
function body(k) { return 'Hi, I run ' + k.noun + ' in Detroit. I want to talk about a system.'; }
function smsHref(bodyText) {
var ua = navigator.userAgent || '';
var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
var android = /Android/i.test(ua);
var b = encodeURIComponent(bodyText);
return ios ? 'sms:' + PHONE + '&body=' + b : android ? 'sms:' + PHONE + '?body=' + b : 'sms:' + PHONE;
}
function kindOf(id) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].id === id) return KINDS[i]; return KINDS[0]; }
function leakOf(k, i) { for (var j = 0; j < k.leaks.length; j++) if (k.leaks[j][0] === i) return k.leaks[j][1]; return null; }
var rows = [];
(function build() {
print.textContent = '';
for (var i = 0; i < TP.length; i++) {
var li = document.createElement('li'); li.className = 'tp';
var node = document.createElement('i'); node.className = 'tp__node'; node.setAttribute('aria-hidden', 'true');
var name = document.createElement('span'); name.className = 'tp__name'; name.textContent = TP[i];
var sr = document.createElement('span'); sr.className = 'sr-only tp__sr';
var fix = document.createElement('span'); fix.className = 'tp__fix';
li.appendChild(node); li.appendChild(name); li.appendChild(sr); li.appendChild(fix);
print.appendChild(li);
rows.push({ li: li, name: name, sr: sr, fix: fix });
}
})();
var cur = null, timers = [], played = false, playedAt = 0, printing = false, firstRead = true;
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers.length = 0; }
function cancelJobs() {
for (var i = 0; i < rows.length; i++) {
text.cancel(rows[i].name); text.cancel(rows[i].fix);
var line = rows[i].name.querySelector('.strike-line');
if (line && line.getAnimations) line.getAnimations().forEach(function (a) { a.cancel(); });
}
if (seeText) text.cancel(seeText); if (tag) text.cancel(tag); if (msg) text.cancel(msg); text.cancel(cta);
}
function strikeLine(row) {
var line = row.name.querySelector('.strike-line');
if (!line) { line = document.createElement('i'); line.className = 'strike-line'; line.setAttribute('aria-hidden', 'true'); row.name.appendChild(line); }
row.name.classList.add('strike-word');
return line;
}
function fill(k, hidden) {
var leaks = [];
for (var i = 0; i < rows.length; i++) {
var r = rows[i], fixText = leakOf(k, i);
r.name.textContent = TP[i]; r.name.dataset.text = TP[i];
r.li.classList.toggle('is-leak', !!fixText);
r.li.classList.remove('is-fixed');
r.fix.textContent = fixText || ''; r.fix.dataset.text = fixText || '';
r.sr.textContent = fixText ? ' usually leaks. What we build: ' : '';
r.name.classList.remove('strike-word');
var old = r.name.querySelector('.strike-line'); if (old) old.remove();
if (fixText) { leaks.push(TP[i]); var line = strikeLine(r); line.style.transform = hidden ? 'scaleX(0)' : 'scaleX(1)'; if (!hidden) r.li.classList.add('is-fixed'); }
r.li.classList.toggle('is-wait', !!hidden);
r.li.classList.toggle('is-fixwait', !!hidden);
}
if (seeLink) { seeLink.href = '#work-' + k.slug; seeLink.dataset.slug = k.slug; }
var b = body(k);
cta.href = smsHref(b); cta.dataset.body = b;
if (!hidden) readout(k, false);
if (status) status.textContent = k.chip + '. Usually leaks at: ' + leaks.join(', ') + '.';
chips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.kind === k.id ? 'true' : 'false'); });
live.dataset.kind = k.id;
}
function readout(k, animate) {
var see = 'See: ' + k.client, t = 'Matching work · ' + k.place, b = body(k);
if (!animate) {
if (seeText) { seeText.textContent = see; seeText.dataset.text = see; }
if (tag) { tag.textContent = t; tag.dataset.text = t; }
if (msg) { msg.textContent = b; msg.dataset.text = b; }
return;
}
if (tag) text.scramble(tag, { text: t, duration: 260, stagger: 12 });
if (seeText) text.scramble(seeText, { text: see, duration: 300, stagger: 18, delay: 120 });
if (msg) text.scramble(msg, { text: b, duration: 300, stagger: 8, delay: 220 });
}
var gen = 0;
function play(k) {
clearTimers(); cancelJobs();
var g = ++gen;
if (reduced || html.dataset.motion === 'reduced') { fill(k, false); sec.classList.add('is-read'); return; }
fill(k, true);
printing = true;
sec.classList.remove('is-read');
var pending = rows.length;
function done() {
if (g !== gen || --pending > 0) return;
printing = false;
sec.classList.add('is-read');
readout(k, true);
if (firstRead) { firstRead = false; text.digits(cta, { delay: 300 }); }
}
rows.forEach(function (r, i) {
later(function () {
r.li.classList.remove('is-wait');
text.scramble(r.name, { duration: 300, stagger: 18, onDone: function () {
if (g !== gen) return;
if (!r.li.classList.contains('is-leak')) { done(); return; }
text.strike(r.name, { duration: 260 });
later(function () {
r.li.classList.remove('is-fixwait');
text.scramble(r.fix, { duration: 300, stagger: 10, onDone: function () { if (g !== gen) return; r.li.classList.add('is-fixed'); done(); } });
}, 200);
} });
}, i * STEP);
});
}
function select(id, animate) {
var k = kindOf(id);
cur = k;
if (animate && played) play(k); else { clearTimers(); cancelJobs(); gen++; printing = false; fill(k, false); if (played) sec.classList.add('is-read'); }
}
chips.forEach(function (c, i) {
c.addEventListener('click', function () { if (cur && cur.id === c.dataset.kind && !printing) return; select(c.dataset.kind, true); });
c.addEventListener('keydown', function (e) {
var n = chips.length, j = -1;
if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = n - 1;
if (j < 0) return;
e.preventDefault(); chips[j].focus();
});
});
if (seeLink) seeLink.addEventListener('click', function (e) {
var slug = seeLink.dataset.slug, id = 'work-' + slug;
var el = document.getElementById(id) || document.querySelector('#work [data-slug="' + slug + '"]');
if (!el) return;
e.preventDefault(); e.stopPropagation();
ES.scroll.scrollTo(el);
if (history.replaceState) history.replaceState(null, '', '#' + (el.id || 'work'));
}, true);
var initial = (live.dataset.kind && kindOf(live.dataset.kind)) || KINDS[0];
cur = initial;
if (reduced || !hasST) { played = true; fill(initial, false); sec.classList.add('is-read'); }
else fill(initial, true);
function enter() {
if (played) return;
played = true; playedAt = performance.now();
play(cur);
}
if (hasST && !reduced) {
ES.scroll.onSection(sec, {
enter: enter,
progress: function (p) {
if (played && !printing && (p <= 0.001 || p >= 0.999) && performance.now() - playedAt > 2000) { played = false; fill(cur, true); sec.classList.remove('is-read'); }
}
});
}
ES.motion.on(function (r) { if (r) { reduced = true; clearTimers(); cancelJobs(); gen++; printing = false; played = true; fill(cur, false); sec.classList.add('is-read'); } });
})();

/* 30-work.js */
(function () {
'use strict';
var ES = window.ES = window.ES || {};
var html = document.documentElement;
var section = document.getElementById('work');
if (!section || !ES.util) return;
var U = ES.util, clamp = U.clamp, RUN = ES.SLASH_RUN || 0.535;
var reduced = html.dataset.motion === 'reduced';
var hasGSAP = !!(window.gsap && window.ScrollTrigger);
var phoneMQ = window.matchMedia('(max-width: 767px)');
var H = window.innerHeight;
var ric = window.requestIdleCallback || function (cb) { return setTimeout(function () { cb({ timeRemaining: function () { return 8; } }); }, 40); };
function isPhone() { return phoneMQ.matches; }
function bandWidth() { return isPhone() ? 28 : 36; }
function rnd(n) { return Math.floor(Math.random() * n); }
var SHEET_W = 1020, SHEET_H = 300, CELL = 20, sheetBuilt = false;
function buildSheet() {
if (sheetBuilt || !ES.atlas || !ES.atlasMeta) return;
var atlas = ES.atlas, cs = ES.atlasMeta.cell || 64, cols = ES.atlasMeta.cols || 16;
var rows = 3; // glyphs 0..47 live in the first three atlas rows
var tinted = document.createElement('canvas');
tinted.width = atlas.width; tinted.height = cs * rows;
var tc = tinted.getContext('2d', { willReadFrequently: true });
if (!tc) return;
tc.drawImage(atlas, 0, 0, atlas.width, cs * rows, 0, 0, atlas.width, cs * rows);
var id;
try { id = tc.getImageData(0, 0, tinted.width, tinted.height); } catch (e) { return; }
var px = id.data; // white on black -> gold-light with alpha = luminance
for (var i = 0; i < px.length; i += 4) { var a = px[i]; px[i] = 244; px[i + 1] = 205; px[i + 2] = 114; px[i + 3] = a; }
tc.putImageData(id, 0, 0);
var sheet = document.createElement('canvas');
sheet.width = SHEET_W; sheet.height = SHEET_H;
var sc = sheet.getContext('2d');
var nx = SHEET_W / CELL, ny = SHEET_H / CELL, count = Math.min(46, ES.atlasMeta.blank || 46);
for (var y = 0; y < ny; y++) {
for (var x = 0; x < nx; x++) {
var r = Math.random();
if (r < 0.22) continue;                       // empty cell
var g = rnd(count);
sc.globalAlpha = r < 0.5 ? 0.45 : (r < 0.8 ? 0.75 : 1);
sc.drawImage(tinted, (g % cols) * cs, Math.floor(g / cols) * cs, cs, cs, x * CELL, y * CELL, CELL, CELL);
}
}
sc.globalAlpha = 1;
var url;
try { url = sheet.toDataURL('image/png'); } catch (e) { return; }
html.style.setProperty('--glyph-sheet', 'url("' + url + '")');
sheetBuilt = true;
}
function hashBand(band) { var c = isPhone() ? 20 : 24; band.style.backgroundPosition = (-rnd(51) * c) + 'px ' + (-rnd(15) * c) + 'px'; }
if (ES.rain && ES.rain.on) ES.rain.on('ready', buildSheet);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(buildSheet, 60); });
setTimeout(buildSheet, 3500);
var stage = {
eyebrow: document.getElementById('work-eyebrow'), title: document.getElementById('work-title'),
ghostLabel: document.getElementById('work-ghost-label'), nodes: Array.prototype.slice.call(section.querySelectorAll('#work-nodes a')),
cue: document.getElementById('work-cue'), moreLabel: document.getElementById('work-more-label'), done: false
};
var decodes = Array.prototype.slice.call(section.querySelectorAll('[data-decode]')).map(function (art, i) {
return {
el: art, slot: i % 2, frame: art.querySelector('[data-frame]'), img: art.querySelector('.decode__shot img'),
band: art.querySelector('.decode__band'), tag: art.querySelector('.decode__tag'), name: art.querySelector('.decode__name'),
tint: art.dataset.tint || '#E3A02A', srcD: art.dataset.shotD, srcM: art.dataset.shotM,
small: null, smallKind: '', loading: false, tex: null, texKey: '', owner: false, active: false, nearby: false,
span: 1, y: 0, P: 0, stage: 0, bleed: 0, sweep: -1, tall: -1, on: -1, hashT: 0, textDone: false, triggers: [],
rect: { x: 0, y: 0, w: 1, h: 1 }, imgH: 0, lastClip: '', lastBand: '', mosaic: null, mctx: null, mk: -1, mop: -1
};
});
var tiles = Array.prototype.slice.call(section.querySelectorAll('[data-tile]')).map(function (li) {
return {
el: li, frame: li.querySelector('.tile__frame'), reveal: li.querySelector('.tile__reveal'), band: li.querySelector('.tile__band'),
name: li.querySelector('.tile__name'), steps: Array.prototype.slice.call(li.querySelectorAll('.tile__step')),
imgs: Array.prototype.slice.call(li.querySelectorAll('img')),
shown: false, pending: false, hashI: 0, endT: 0, hoverT: -1e9, step: 0
};
});
var slots = [null, null];
var rain = ES.rain;
var webglOK = function () { return html.dataset.webgl === 'ok'; };
if (reduced) return; // CSS draws the poster: frames decoded, static bands, text final
ES.text.prime(stage.title);
decodes.forEach(function (d) {
ES.text.prime(d.name);
var cv = document.createElement('canvas');
cv.className = 'decode__mosaic'; cv.setAttribute('aria-hidden', 'true'); cv.width = 2; cv.height = 2;
d.frame.insertBefore(cv, d.frame.firstChild);
d.mosaic = cv; d.mctx = cv.getContext('2d');
});
function stageArrive() {
if (stage.done) return; stage.done = true;
ES.text.scramble(stage.eyebrow, { duration: 260 });
ES.text.solidify(stage.title, { delay: 60 });
if (stage.ghostLabel) ES.text.scramble(stage.ghostLabel, { delay: 180 });
stage.nodes.forEach(function (a, i) { ES.text.scramble(a, { delay: 300 + i * 120 }); });
if (stage.cue) stage.cue.classList.add('is-on');
}
function stageLeave() {
if (!stage.done) return; stage.done = false;
ES.text.prime(stage.title);
if (stage.cue) stage.cue.classList.remove('is-on');
}
function loadSmall(d, cb) {
var kind = isPhone() ? 'm' : 'd';
if (d.small && d.smallKind === kind) { cb(); return; }
if (d.loading === kind) { d.onLoaded = cb; return; }
d.loading = kind;
var im = new Image();
im.decoding = 'async';
im.onload = function () {
if (d.loading !== kind) return;
d.small = im; d.smallKind = kind; d.loading = false; d.tex = null; d.texKey = '';
cb(); if (d.onLoaded) { var f = d.onLoaded; d.onLoaded = null; f(); }
};
im.onerror = function () { d.loading = false; };
im.src = kind === 'm' ? d.srcM : d.srcD;
}
function makeTex(d) {
var im = d.small; if (!im) return null;
var fr = d.frame.getBoundingClientRect();
if (fr.width < 2 || fr.height < 2) return null;
var want = fr.width / fr.height, have = im.naturalWidth / im.naturalHeight;
var key = want.toFixed(3) + ':' + d.smallKind;
if (d.tex && d.texKey === key) return d.tex;
if (Math.abs(want - have) / have < 0.015) { d.tex = im; d.texKey = key; return im; }
var cw = im.naturalWidth, ch = Math.max(2, Math.min(im.naturalHeight, Math.round(cw / want)));
var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
cv.getContext('2d').drawImage(im, 0, 0, cw, ch, 0, 0, cw, ch);
d.tex = cv; d.texKey = key;
return cv;
}
function upload(d) {
if (!d.owner) return;
ric(function () {
if (!d.owner) return;
var t = makeTex(d); if (!t) return;
if (webglOK()) rain.frame(d.slot, { image: t, tint: d.tint, on: false });
d.on = -1; d.mk = -1; // force a push + a mosaic redraw
if (d.active) push(d);
mosaic(d);
});
}
function claim(d) {
d.nearby = true;
var prev = slots[d.slot];
if (prev && prev !== d) { prev.owner = false; prev.on = -1; rain.frame(d.slot, { on: false }); }
slots[d.slot] = d; d.owner = true;
if (d.img) { if (d.img.loading === 'lazy') d.img.loading = 'eager'; if (d.img.decode) d.img.decode().then(null, function () { /* not fatal */ }); }
loadSmall(d, function () { upload(d); });
}
function release(d) {
d.nearby = false;
if (d.owner) { d.owner = false; rain.frame(d.slot, { on: false }); d.on = 0; }
if (slots[d.slot] === d) slots[d.slot] = null;
}
function measure(d) {
H = window.innerHeight;
d.span = Math.max(1, d.el.offsetHeight - (d.el.querySelector('.decode__screen').offsetHeight || H));
}
function tallHeight(d, w) {
var im = d.img, ratio = 0;
if (im && im.complete && im.naturalWidth > 0) ratio = im.naturalHeight / im.naturalWidth;
if (!ratio) ratio = isPhone() ? 4800 / 720 : 2500 / 1200;
return w * ratio;
}
function measureRect(d) {
var r = d.frame.getBoundingClientRect();
d.rect.x = r.left; d.rect.y = r.top; d.rect.w = r.width; d.rect.h = r.height;
}
var glRect = { x: 0, y: 0, w: 1, h: 1 };
function push(d) {
measureRect(d);
var on = d.owner && d.active && !!d.tex && d.rect.w > 1;
glRect.x = d.rect.x; glRect.y = d.rect.y; glRect.w = Math.max(1, d.rect.w); glRect.h = Math.max(1, d.rect.h);
rain.frame(d.slot, { rect: glRect, stage: d.stage, bleed: d.bleed, sweep: 0.5, on: on });
d.on = on ? 1 : 0;
}
var MOSAIC_STEPS = [1, 0.69, 0.46, 0.31, 0.19, 0.115];
function mosaic(d) {
var cv = d.mosaic; if (!cv) return;
var st = d.stage, gl = webglOK();
var op = gl ? 0 : clamp(st / 0.12, 0, 1);
var k = st < 0.6 ? 0 : Math.min(5, Math.floor((st - 0.6) / 0.3 * 6));
if (op <= 0) { if (d.mop !== 0) { cv.style.opacity = '0'; d.mop = 0; } return; }
var tex = d.tex || (d.small ? makeTex(d) : null);
if (tex && (k !== d.mk || cv.width < 3)) {
var base = (isPhone() ? 20 : 26) * MOSAIC_STEPS[k];
var cols = Math.max(2, Math.round(d.rect.w / base)), rows = Math.max(2, Math.round(d.rect.h / base));
if (cv.width !== cols || cv.height !== rows) { cv.width = cols; cv.height = rows; }
try { d.mctx.drawImage(tex, 0, 0, cols, rows); d.mk = k; } catch (e) { /* not decoded yet */ }
}
if (op !== d.mop) { cv.style.opacity = op.toFixed(3); d.mop = op; }
}
function applyDecode(d, P) {
d.P = P;
var S = d.span, D = S + 2 * H, y = P * D;
d.y = y;
var q = clamp((y - H) / S, 0, 1), stage;
var sweep = clamp((q - 0.39) / 0.21, 0, 1);
var tall = clamp((q - 0.6) / 0.4, 0, 1);
var bIn = clamp((y - 0.9 * H) / (0.1 * H + 0.08 * S), 0, 1);
var bOut = 1 - clamp((y - (S + H)) / (0.6 * H), 0, 1);
if (isPhone()) {
var pre = clamp((y - 0.45 * H) / (0.55 * H), 0, 1);
bIn = Math.max(bIn, pre);
stage = q <= 0 ? 0.33 * pre : (q < 0.39 ? 0.33 + (q / 0.39) * 0.57 : 0.9 + ((q - 0.39) / 0.21) * 0.1);
} else stage = q < 0.39 ? (q / 0.39) * 0.9 : 0.9 + ((q - 0.39) / 0.21) * 0.1;
d.stage = clamp(stage, 0, 1); d.bleed = Math.min(bIn, bOut);
if (d.active) push(d); else measureRect(d);
mosaic(d);
if (!d.textDone && y > 0.35 * H && y < S + 1.5 * H) {
d.textDone = true;
ES.text.scramble(d.tag, { duration: 280 });
ES.text.solidify(d.name, { delay: 80 });
}
var w = d.rect.w, h = d.rect.h, img = d.img, band = d.band;
if (w > 1) {
if (sweep !== d.sweep) {
d.sweep = sweep;
if (sweep >= 1) { if (d.lastClip !== 'none') { img.style.clipPath = 'none'; d.lastClip = 'none'; } if (band.classList.contains('is-on')) band.classList.remove('is-on'); }
else {
var bw = bandWidth();
var x0 = (-RUN * h - bw) + sweep * (w + RUN * h + bw), xTop = x0 + RUN * h, xBot = x0;
var clip = sweep <= 0 ? 'polygon(0 0, 0 0, 0 100%, 0 100%)' : 'polygon(0 0, ' + xTop.toFixed(1) + 'px 0, ' + xBot.toFixed(1) + 'px 100%, 0 100%)';
if (clip !== d.lastClip) { img.style.clipPath = clip; d.lastClip = clip; }
if (sweep > 0) {
band.style.clipPath = 'polygon(' + xTop.toFixed(1) + 'px 0, ' + (xTop + bw).toFixed(1) + 'px 0, ' + (xBot + bw).toFixed(1) + 'px 100%, ' + xBot.toFixed(1) + 'px 100%)';
if (!band.classList.contains('is-on')) band.classList.add('is-on');
var now = performance.now();
if (now - d.hashT > 90) { d.hashT = now; hashBand(band); }
} else if (band.classList.contains('is-on')) band.classList.remove('is-on');
}
}
}
if (tall !== d.tall || tall > 0) {
d.tall = tall;
var travel = Math.max(0, Math.min(tallHeight(d, w) - h, isPhone() ? 800 : 1000));
var ty = -travel * tall;
img.style.transform = tall > 0 ? 'translate3d(0,' + ty.toFixed(1) + 'px,0)' : '';
}
}
function setActive(d, on) {
if (d.active === on) return;
d.active = on;
d.img.style.willChange = on ? 'transform, clip-path' : '';
if (!on) { if (d.on !== 0) { rain.frame(d.slot, { on: false }); d.on = 0; } d.textDone = false; ES.text.prime(d.name); }
else push(d);
}
function bindDecodes() {
decodes.forEach(function (d) {
measure(d);
d.triggers.push(ScrollTrigger.create({
trigger: d.el, invalidateOnRefresh: true,
start: function () { return 'top ' + (window.innerHeight * 2.1).toFixed(0) + 'px'; },
end: function () { return 'bottom ' + (-1.1 * window.innerHeight).toFixed(0) + 'px'; },
onEnter: function () { claim(d); }, onEnterBack: function () { claim(d); },
onLeave: function () { release(d); }, onLeaveBack: function () { release(d); },
onRefresh: function (self) { if (self.isActive && !d.owner) claim(d); else if (!self.isActive && d.owner) release(d); }
}));
d.triggers.push(ScrollTrigger.create({
trigger: d.el, start: 'top bottom', end: 'bottom top', invalidateOnRefresh: true,
onRefresh: function (self) { measure(d); applyDecode(d, self.progress); },
onToggle: function (self) { setActive(d, self.isActive); if (self.isActive) applyDecode(d, self.progress); },
onUpdate: function (self) { applyDecode(d, self.progress); }
}));
});
}
function tileGeom(t) {
var r = t.frame.getBoundingClientRect();
return { w: r.width, h: r.height, bw: bandWidth() };
}
function polys(g, e) {
var x0 = (-RUN * g.h - g.bw) + e * (g.w + RUN * g.h + g.bw), xTop = x0 + RUN * g.h, xBot = x0;
return {
reveal: 'polygon(0 0, ' + xTop.toFixed(1) + 'px 0, ' + xBot.toFixed(1) + 'px 100%, 0 100%)',
band: 'polygon(' + xTop.toFixed(1) + 'px 0, ' + (xTop + g.bw).toFixed(1) + 'px 0, ' + (xBot + g.bw).toFixed(1) + 'px 100%, ' + xBot.toFixed(1) + 'px 100%)'
};
}
function setInstant(t, p) {
t.reveal.classList.add('no-trans'); t.band.classList.add('no-trans');
t.reveal.style.clipPath = p.reveal; t.band.style.clipPath = p.band;
void t.reveal.offsetWidth; // commit without a transition
t.reveal.classList.remove('no-trans'); t.band.classList.remove('no-trans');
}
function tileHide(t) {
if (!t.shown) return;
var r = t.el.getBoundingClientRect();
if (r.bottom > 0 && r.top < window.innerHeight) return; // still on screen (e.g. #work pinned under the next front): never pop
t.shown = false;
clearInterval(t.hashI); t.hashI = 0; clearTimeout(t.endT);
t.el.classList.remove('is-shown');
t.band.classList.remove('is-on');
setInstant(t, polys(tileGeom(t), 0));
}
function tilePreload(t) {
t.imgs.forEach(function (im) { if (im.loading === 'lazy') im.loading = 'eager'; });
}
function tileReady(t, cb) {
var im = t.imgs[0];
if (!im) { cb(); return; }
var done = false, fin = function () { if (done) return; done = true; cb(); };
tilePreload(t);
if (im.decode) im.decode().then(fin, fin); // resolves once the pixels are ready to paint (waits for the load too)
else if (im.complete && im.naturalWidth > 0) fin();
else { im.addEventListener('load', fin, { once: true }); im.addEventListener('error', fin, { once: true }); }
setTimeout(fin, 1500);
}
function tileReveal(t) {
if (t.shown || t.pending) return;
t.pending = true;
tileReady(t, function () { t.pending = false; if (!t.shown) tileRevealNow(t); });
}
function tileRevealNow(t) {
if (t.shown) return;
t.shown = true;
var g = tileGeom(t);
setInstant(t, polys(g, 0));
var end = polys(g, 1);
t.band.classList.add('is-on'); hashBand(t.band);
requestAnimationFrame(function () {
t.reveal.style.clipPath = end.reveal; t.band.style.clipPath = end.band;
t.el.classList.add('is-shown');
});
clearInterval(t.hashI);
t.hashI = setInterval(function () { hashBand(t.band); }, 90);
clearTimeout(t.endT);
t.endT = setTimeout(function () { clearInterval(t.hashI); t.hashI = 0; t.band.classList.remove('is-on'); t.reveal.style.clipPath = ''; }, 720);
ES.text.scramble(t.name, { delay: 140, duration: 260 });
}
function setStep(t, i) {
if (i === t.step) return;
t.step = i;
t.steps.forEach(function (p, k) { p.classList.toggle('is-on', k === i); if (k === i) p.removeAttribute('aria-hidden'); else p.setAttribute('aria-hidden', 'true'); });
}
function bindTiles() {
tiles.forEach(function (t) {
ScrollTrigger.create({
trigger: t.el, invalidateOnRefresh: true,
start: function () { return 'top ' + (window.innerHeight * 2.5).toFixed(0) + 'px'; },
end: function () { return 'bottom ' + (-1.5 * window.innerHeight).toFixed(0) + 'px'; },
onEnter: function () { tilePreload(t); }, onEnterBack: function () { tilePreload(t); },
onRefresh: function (self) { if (self.isActive) tilePreload(t); }
});
ScrollTrigger.create({
trigger: t.el, start: 'top 88%', end: 'bottom top', invalidateOnRefresh: true,
onEnter: function () { tileReveal(t); }, onEnterBack: function () { tileReveal(t); },
onRefresh: function (self) { if (self.isActive && !t.shown) tileReveal(t); }
});
ScrollTrigger.create({
trigger: t.el, start: 'top bottom', end: 'bottom top', invalidateOnRefresh: true,
onLeave: function () { tileHide(t); }, onLeaveBack: function () { tileHide(t); }
});
if (t.steps.length > 1) ScrollTrigger.create({
trigger: t.el, start: 'top 85%', end: 'bottom 15%', invalidateOnRefresh: true,
onUpdate: function (self) { setStep(t, Math.min(t.steps.length - 1, Math.floor(self.progress * t.steps.length))); }
});
t.el.addEventListener('pointerenter', function () {
var now = performance.now();
if (now - t.hoverT < 2000 || !t.shown) return;
t.hoverT = now;
ES.text.scramble(t.name, { duration: 240 });
});
});
if (stage.moreLabel) ScrollTrigger.create({
trigger: stage.moreLabel, start: 'top 90%',
onEnter: function () { ES.text.scramble(stage.moreLabel, { duration: 260 }); }, onEnterBack: function () { ES.text.scramble(stage.moreLabel, { duration: 260 }); }
});
}
function boot() {
if (!hasGSAP) { // no GSAP: static page, images visible
decodes.forEach(function (d) { d.img.style.clipPath = 'none'; });
tiles.forEach(function (t) { t.el.classList.add('is-shown'); t.reveal.style.clipPath = 'none'; });
return;
}
ES.scroll.onSection(section, { enter: stageArrive, leave: function (dir) { if (dir === 'up') stageLeave(); } });
bindDecodes();
bindTiles();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
var rT = 0;
window.addEventListener('resize', function () {
clearTimeout(rT);
rT = setTimeout(function () {
H = window.innerHeight;
decodes.forEach(function (d) {
measure(d);
d.lastClip = ''; d.sweep = -1; d.tall = -1; d.mk = -1;
if (d.owner) { var kind = isPhone() ? 'm' : 'd'; if (d.smallKind !== kind) loadSmall(d, function () { upload(d); }); else { d.tex = null; d.texKey = ''; upload(d); } }
applyDecode(d, d.P);
});
tiles.forEach(function (t) { if (t.shown) { t.reveal.style.clipPath = ''; } });
}, 160);
});
if (ES.motion && ES.motion.on) ES.motion.on(function (r) {
if (!r) return;
decodes.forEach(function (d) {
d.active = false; d.owner = false;
d.img.style.clipPath = ''; d.img.style.transform = ''; d.band.classList.remove('is-on'); d.band.style.clipPath = '';
if (d.mosaic) d.mosaic.style.display = 'none';
});
rain.frame(0, { on: false }); rain.frame(1, { on: false });
slots[0] = slots[1] = null;
tiles.forEach(function (t) { clearInterval(t.hashI); clearTimeout(t.endT); t.el.classList.add('is-shown'); t.reveal.style.clipPath = ''; t.band.style.clipPath = ''; t.band.classList.remove('is-on'); });
if (stage.cue) stage.cue.classList.remove('is-on');
});
})();

/* 40-apps.js */
(function () {
'use strict';
var ES = window.ES, sec = document.getElementById('apps');
if (!ES || !sec) return;
var html = document.documentElement;
var reduced = html.dataset.motion === 'reduced';
var hasST = !!(window.gsap && window.ScrollTrigger);
var text = ES.text;
var eyebrow = document.getElementById('apps-label'), title = document.getElementById('apps-title');
var shelf = document.getElementById('apps-shelf');
var caps = Array.prototype.slice.call(sec.querySelectorAll('.apps__cap b'));
var headDone = false, eyebrowDone = false, shelfDone = false, shownAt = 0;
if (reduced || !hasST) { sec.classList.add('is-in'); return; }
text.prime(title);
function eyebrowIn() { if (eyebrowDone) return; eyebrowDone = true; text.scramble(eyebrow, { duration: 260 }); }
function headIn() {
if (headDone) return;
headDone = true; shownAt = performance.now();
eyebrowIn();
text.solidify(title, { delay: 80 });
}
function shelfIn() {
if (shelfDone) return;
shelfDone = true; shownAt = performance.now();
sec.classList.add('is-in');
caps.forEach(function (c, i) { text.scramble(c, { delay: 520 + i * 180, duration: 260, stagger: 12 }); });
}
function rearm() {
if ((!headDone && !shelfDone) || performance.now() - shownAt < 2000) return;
headDone = eyebrowDone = shelfDone = false;
sec.classList.remove('is-in');
text.prime(title);
}
function workWin() { var W = ES.scroll.windows || []; for (var i = 0; i < W.length; i++) if (W[i].A && W[i].A.id === 'work') return W[i]; return null; }
ES.scroll.onBoundary('work', function (p, f) {
if (f > 0.02 && !headDone) eyebrowIn();
if (f >= 0.2) headIn();
});
ES.scroll.onSection(sec, {
enter: function () { var w = workWin(); if (w && w.p > 0 && w.p < 1) return; headIn(); },
progress: function (p) { if (p <= 0.001 || p >= 0.999) rearm(); }
});
ScrollTrigger.create({
trigger: shelf, start: 'top 88%', end: 'bottom top',
onEnter: shelfIn, onEnterBack: shelfIn,
onRefresh: function (self) { if (self.isActive) shelfIn(); }
});
ES.motion.on(function (r) { if (r) { headDone = shelfDone = true; sec.classList.add('is-in'); text.solidify(title, { instant: true }); } });
})();

/* 41-systems.js */
(function () {
'use strict';
var ES = window.ES, sec = document.getElementById('systems');
if (!ES || !sec) return;
var html = document.documentElement;
var reduced = html.dataset.motion === 'reduced';
var hasST = !!(window.gsap && window.ScrollTrigger);
var text = ES.text;
var eyebrow = document.getElementById('systems-eyebrow'), title = document.getElementById('systems-title');
var grid = document.getElementById('panels');
var panels = Array.prototype.slice.call(sec.querySelectorAll('.panel')).map(function (el) {
var P = { el: el, name: el.dataset.panel, ran: false, at: 0, t: [], rows: Array.prototype.slice.call(el.querySelectorAll('[data-row]')),
scr: Array.prototype.slice.call(el.querySelectorAll('[data-scr]')), wipes: Array.prototype.slice.call(el.querySelectorAll('[data-row], [data-beat], [data-lead], [data-sms], .swap__new')) };
if (P.name === 'leads') {
P.lead = el.querySelector('[data-lead]'); P.slotN = el.querySelector('[data-slot="new"]'); P.slotC = el.querySelector('[data-slot="contacted"]');
P.sms = el.querySelector('[data-sms]'); P.smsText = el.querySelector('.sms__text'); P.timer = el.querySelector('[data-timer]');
P.cNew = el.querySelector('[data-count="new"]'); P.cCon = el.querySelector('[data-count="contacted"]');
P.steps = Array.prototype.slice.call(el.querySelectorAll('.step'));
}
if (P.name === 'party') { P.count = el.querySelector('[data-waivers]'); P.meter = el.querySelector('[data-meter]'); }
if (P.name === 'jarvis') { P.card = el.querySelector('[data-approval]'); P.status = el.querySelector('[data-status]'); }
return P;
});
panels.forEach(function (P) {
if (!P.card) return;
function decide(msg) {
P.card.classList.add('is-decided');
P.status.textContent = msg;
if (!reduced) text.scramble(P.status, { text: msg, duration: 240, stagger: 10 });
}
P.card.querySelector('[data-approve]').addEventListener('click', function () { decide('Approved · flats promotion goes live Friday 9:00'); });
P.card.querySelector('[data-hold]').addEventListener('click', function () { decide('On hold · Jarvis asks again tomorrow 9:00'); });
});
if (reduced || !hasST) { panels.forEach(function (P) { P.el.classList.add('is-in'); }); return; }
text.prime(title);
function measure() {
panels.forEach(function (P) {
P.el.style.setProperty('--ph', P.el.offsetHeight + 'px');
P.rows.forEach(function (r, i) { r.style.setProperty('--r', i); });
P.wipes.forEach(function (r) { r.style.setProperty('--rh', Math.max(16, r.offsetHeight) + 'px'); });
Array.prototype.forEach.call(P.el.querySelectorAll('.bars i'), function (b, k) { b.style.setProperty('--k', k); });
});
}
function step(P, name) { P.steps.forEach(function (s) { var k = s.dataset.step, order = ['new', 'reply', 'contacted', 'follow']; s.classList.toggle('is-active', k === name); s.classList.toggle('is-done', name !== null && order.indexOf(k) < order.indexOf(name)); }); }
function count(el, v) { if (el) { text.cancel(el); el.textContent = v; } }
function pre(P) {
P.el.classList.remove('is-in', 'is-settled', 'is-lead', 'is-sms', 'is-moved', 'is-timer', 'is-signed', 'is-restock');
if (P.name === 'leads') {
if (P.lead.parentNode !== P.slotN) P.slotN.appendChild(P.lead);
P.slotN.classList.add('has-lead'); P.slotC.classList.remove('has-lead');
P.lead.style.transform = '';
P.smsText.textContent = ''; P.sms.classList.remove('is-typing');
P.timer.textContent = '24:00:00';
P.cNew.textContent = '0'; P.cCon.textContent = '1';
step(P, null);
}
if (P.name === 'party') { P.count.textContent = '14'; P.meter.style.setProperty('--p', '.778'); }
if (P.name === 'jarvis') { P.card.classList.remove('is-decided'); P.status.textContent = ''; }
}
function final(P) {
P.el.classList.add('is-in', 'is-settled', 'is-lead', 'is-sms', 'is-moved', 'is-timer', 'is-signed', 'is-restock');
if (P.name === 'leads') {
if (P.lead.parentNode !== P.slotC) P.slotC.insertBefore(P.lead, P.slotC.firstChild);
P.slotC.classList.add('has-lead'); P.slotN.classList.remove('has-lead');
P.lead.style.transform = '';
P.smsText.textContent = P.smsText.dataset.type; P.sms.classList.remove('is-typing');
P.timer.textContent = 'Due tomorrow 2:14 pm';
P.cNew.textContent = '0'; P.cCon.textContent = '2';
step(P, 'follow');
}
if (P.name === 'party') { P.count.textContent = '15'; P.meter.style.setProperty('--p', '.833'); }
}
function still(P, fn) { P.el.classList.add('no-trans'); fn(); void P.el.offsetWidth; P.el.classList.remove('no-trans'); }
function later(P, ms, fn) { P.t.push(setTimeout(fn, ms)); }
function typeInto(P, done) {
var full = P.smsText.dataset.type, i = 0;
P.smsText.textContent = ''; P.sms.classList.add('is-typing');
(function tick() {
i++; P.smsText.textContent = full.slice(0, i);
if (i < full.length) later(P, 22, tick); else { P.sms.classList.remove('is-typing'); if (done) done(); }
})();
}
function moveLead(P) {
var lead = P.lead, from = lead.getBoundingClientRect();
P.slotC.insertBefore(lead, P.slotC.firstChild);
P.slotN.classList.remove('has-lead'); P.slotC.classList.add('has-lead');
var to = lead.getBoundingClientRect();
lead.style.transition = 'none';
lead.style.transform = 'translate3d(' + (from.left - to.left).toFixed(1) + 'px,' + (from.top - to.top).toFixed(1) + 'px,0)';
void lead.offsetWidth;
lead.style.transition = ''; lead.style.transform = '';
P.el.classList.add('is-moved');
}
function beats(P, rowMode) {
if (P.name === 'leads') return [
[1000, function () { P.el.classList.add('is-lead'); count(P.cNew, '1'); step(P, 'new'); }],
[1700, function () { P.el.classList.add('is-sms'); step(P, 'reply'); later(P, 260, function () { typeInto(P); }); }],
[3600, function () { moveLead(P); step(P, 'contacted'); count(P.cNew, '0'); count(P.cCon, '2'); }],
[4400, function () { P.el.classList.add('is-timer'); step(P, 'follow'); P.timer.textContent = '24:00:00'; }],
[5400, function () { P.timer.textContent = '23:59:59'; }],
[6400, function () { P.timer.textContent = '23:59:58'; }],
[6900, function () { P.timer.textContent = 'Due tomorrow 2:14 pm'; text.scramble(P.timer, { duration: 240, stagger: 8 }); }]
];
if (P.name === 'party') return [[rowMode ? 5000 : 1400, function () { P.el.classList.add('is-signed'); count(P.count, '15'); P.meter.style.setProperty('--p', '.833'); }]];
return [[rowMode ? 5700 : 1500, function () { P.el.classList.add('is-restock'); }]];
}
function sameRow(P) { var top = P.el.offsetTop; return panels.filter(function (Q) { return Q !== P && Math.abs(Q.el.offsetTop - top) < 4; }); }
function run(P) {
if (P.ran) return;
P.ran = true; P.at = performance.now();
var rowMode = sameRow(P).some(function (Q) { return Q.name === 'leads'; });
P.el.classList.add('is-in');
P.scr.forEach(function (el, i) { later(P, 320 + i * 120, function () { text.scramble(el, { duration: 240, stagger: 10 }); }); });
later(P, 1700, function () { P.el.classList.add('is-settled'); });
beats(P, rowMode).forEach(function (b) { later(P, b[0], b[1]); });
}
function rearm(P) {
if (!P.ran || performance.now() - P.at < 2000) return;
var r = P.el.getBoundingClientRect();
if (r.bottom > 0 && r.top < window.innerHeight) return;
P.ran = false;
P.t.forEach(clearTimeout); P.t.length = 0;
P.scr.forEach(function (el) { text.cancel(el); });
if (P.timer) text.cancel(P.timer);
still(P, function () { pre(P); });
}
var headDone = false, eyebrowDone = false, headAt = 0;
function eyebrowIn() { if (eyebrowDone) return; eyebrowDone = true; text.scramble(eyebrow, { duration: 260 }); }
function headIn() { if (headDone) return; headDone = true; headAt = performance.now(); eyebrowIn(); text.solidify(title, { delay: 80 }); }
function headRearm() { if (!headDone || performance.now() - headAt < 2000) return; headDone = eyebrowDone = false; text.prime(title); }
function appsWin() { var W = ES.scroll.windows || []; for (var i = 0; i < W.length; i++) if (W[i].A && W[i].A.id === 'apps') return W[i]; return null; }
ES.scroll.onBoundary('apps', function (p, f) { if (f > 0.02 && !headDone) eyebrowIn(); if (f >= 0.2) headIn(); });
ES.scroll.onSection(sec, {
enter: function () { var w = appsWin(); if (w && w.p > 0 && w.p < 1) return; headIn(); },
progress: function (p) { if (p <= 0.001 || p >= 0.999) headRearm(); }
});
panels.forEach(function (P) { still(P, function () { pre(P); }); });
measure();
panels.forEach(function (P) {
ScrollTrigger.create({
trigger: P.el, start: 'top 82%', end: 'bottom 18%', invalidateOnRefresh: true,
onEnter: function () { run(P); }, onEnterBack: function () { run(P); },
onRefresh: function (self) { if (self.isActive && !P.ran) run(P); }
});
ScrollTrigger.create({
trigger: P.el, start: 'top bottom', end: 'bottom top', invalidateOnRefresh: true,
onLeave: function () { rearm(P); }, onLeaveBack: function () { rearm(P); }
});
});
var rT = 0;
window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(measure, 160); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(measure, 40); });
ES.motion.on(function (r) {
if (!r) return;
headDone = true; text.solidify(title, { instant: true });
panels.forEach(function (P) { P.t.forEach(clearTimeout); P.t.length = 0; P.ran = true; still(P, function () { final(P); }); });
});
})();

/* 50-contact.js */
(function () {
'use strict';
var ES = window.ES, sec = document.getElementById('contact');
if (!ES || !sec) return;
var html = document.documentElement;
var reduced = html.dataset.motion === 'reduced';
var hasST = !!(window.gsap && window.ScrollTrigger);
var U = ES.util, text = ES.text, rain = ES.rain;
var $ = function (id) { return document.getElementById(id); };
var stage = sec.querySelector('.contact__stage'), head = sec.querySelector('.contact__head');
var eyebrow = $('contact-eyebrow'), title = $('contact-title');
var pin = $('contact-pin'), live = $('contact-live'), label = $('contact-label'), start = $('contact-start');
var num = $('contact-number');
var lines = num ? Array.prototype.slice.call(num.querySelectorAll('[data-line]')) : [];
var cta = $('contact-cta');
var copyBtn = $('contact-copy'), copyLabel = $('contact-copy-label'), copied = $('contact-copied');
var NUMBER = '313-300-6898';
if (copyBtn && copyLabel) {
var copyT = 0, COPY = 'Copy number';
function say(msg) { if (copied) { copied.textContent = ''; copied.textContent = msg; } }
function setLabel(t) { if (text && text.scramble) { text.finishAll(); text.scramble(copyLabel, { text: t, duration: 240, stagger: 14 }); } else copyLabel.textContent = t; }
function feedback(ok) {
clearTimeout(copyT);
copyBtn.classList.toggle('is-done', ok); copyBtn.classList.toggle('is-failed', !ok);
setLabel(ok ? 'Copied' : 'Number selected');
say(ok ? 'Number copied: 313-300-6898' : 'Copy is not available here. The number is selected; copy it from the selection.');
copyT = setTimeout(function () { copyBtn.classList.remove('is-done', 'is-failed'); setLabel(COPY); }, 1800);
}
function selectNumber() {
try { var sel = window.getSelection(), r = document.createRange(); r.selectNodeContents(num); sel.removeAllRanges(); sel.addRange(r); } catch (e) { /* noop */ }
}
function fallback() {
var ok = false;
try {
var ta = document.createElement('textarea');
ta.value = NUMBER; ta.setAttribute('readonly', ''); ta.setAttribute('aria-hidden', 'true'); ta.tabIndex = -1;
ta.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;padding:0;border:0;opacity:0;font-size:16px;pointer-events:none';
document.body.appendChild(ta);
ta.focus({ preventScroll: true }); ta.select(); ta.setSelectionRange(0, NUMBER.length);
ok = !!document.execCommand('copy');
document.body.removeChild(ta);
try { copyBtn.focus({ preventScroll: true }); } catch (e) { /* noop */ }
} catch (e) { ok = false; }
if (!ok) selectNumber();
return ok;
}
copyBtn.addEventListener('click', function () {
if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext !== false) {
navigator.clipboard.writeText(NUMBER).then(function () { feedback(true); }, function () { feedback(fallback()); });
} else feedback(fallback());
});
}
if (reduced || !hasST || !stage || !live) {
sec.classList.add('is-in'); if (live) live.classList.add('is-in');
return;
}
text.prime(title);
var playedA = false, playedAt = 0, scrubbedA = false;
function playA(timed) {
if (playedA) return;
playedA = true; playedAt = performance.now();
sec.classList.add('is-in');
text.scramble(eyebrow, { duration: 260 });
if (timed) text.solidify(title, { delay: 80 });
}
function rearmA() {
if (!playedA || performance.now() - playedAt < 2000) return;
playedA = false; scrubbedA = false; sec.classList.remove('is-in'); text.prime(title);
}
function contactWindow() { var W = ES.scroll.windows || []; for (var i = 0; i < W.length; i++) if (W[i].B === sec) return W[i]; return null; }
var prevId = sec.previousElementSibling && sec.previousElementSibling.id;
if (prevId) ES.scroll.onBoundary(prevId, function (p, f) {
if (f > -0.2 && f < 1.3 && head) {
var r = head.getBoundingClientRect();
var fHit = U.frontThrough(r.left + 36, r.top + r.height * 0.55);
var t = U.clamp((f - fHit) / 0.42, 0, 1);
if (t > 0 || scrubbedA) { scrubbedA = true; text.solidifyAt(title, t); }
if (t > 0) playA(false);
}
if (f <= -0.24) rearmA();
});
ES.scroll.onSection(stage, {
enter: function () { var w = contactWindow(); if (w && w.p > 0 && w.p < 1) return; if (scrubbedA) { playA(false); text.solidifyAt(title, 1); } else playA(true); },
progress: function (p) { if (p <= 0.001) rearmA(); }
});
var playedB = false, playedBAt = 0;
function playB() {
if (playedB) return;
playedB = true; playedBAt = performance.now();
live.classList.add('is-in'); sec.classList.add('is-live');
text.finishAll();
if (label) text.scramble(label, { duration: 260 });
if (start) text.scramble(start, { delay: 120, duration: 300, stagger: 14 });
if (cta) text.digits(cta, { delay: 220 });
}
function rearmB() {
if (!playedB || performance.now() - playedBAt < 2000) return;
playedB = false; live.classList.remove('is-in'); sec.classList.remove('is-live');
}
ES.scroll.onSection(pin, { enter: playB, progress: function (p) { if (p <= 0.001 || p >= 0.999) rearmB(); } });
var maskCv = null, maskUp = false, catchV = 0, bound = false;
var rectN = { x: 0, y: 0, w: 1, h: 1 };
var range = document.createRange();
function measureNum() { var r = num.getBoundingClientRect(); rectN.x = r.left; rectN.y = r.top; rectN.w = r.width; rectN.h = r.height; return r; }
function raster() {
if (!num || html.dataset.webgl !== 'ok') return false;
var r = measureNum();
if (r.width < 2 || r.height < 2) return false;
var cs = getComputedStyle(num), size = parseFloat(cs.fontSize) || 100, ls = parseFloat(cs.letterSpacing) || 0;
var scale = Math.min(2, 2048 / Math.max(1, r.width), 2048 / Math.max(1, r.height));
var cv = maskCv || (maskCv = document.createElement('canvas'));
cv.width = Math.max(2, Math.round(r.width * scale)); cv.height = Math.max(2, Math.round(r.height * scale));
var ctx = cv.getContext('2d'); if (!ctx) return false;
ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
ctx.font = '820 expanded ' + size + 'px "Archivo", "Helvetica Neue", Arial, sans-serif';
if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
var m = ctx.measureText('0'), asc = m.fontBoundingBoxAscent;
var phone = !!(rain.state && rain.state.phone), erode = phone ? 4 : 0;
function draw(stroke) {
for (var i = 0; i < lines.length; i++) {
var sp = lines[i];
range.selectNodeContents(sp);
var rr = range.getBoundingClientRect();
if (rr.width < 1 || rr.height < 1) continue;
var base = asc > 0 ? rr.top + asc : rr.top + rr.height * 0.807;
ctx.save();
ctx.translate((rr.left - r.left) * scale, (base - r.top) * scale);
ctx.scale(scale, scale);
var s = sp.textContent, x = 0;
for (var k = 0; k < s.length; k++) {
var ch = s.charAt(k);
if (ch !== ' ') { if (stroke) ctx.strokeText(ch, x, 0); else ctx.fillText(ch, x, 0); }
x += ctx.measureText(ch).width + ls;
}
ctx.restore();
}
}
draw(false);
if (erode > 0) { ctx.strokeStyle = '#000'; ctx.lineWidth = erode; ctx.lineJoin = 'round'; draw(true); }
rain.setNumber({ rect: rectN, maskCanvas: cv, catch: catchV });
maskUp = true;
sec.classList.add('is-numbercatch');
return true;
}
function pushRect() { if (!maskUp) return; measureNum(); rain.set({ numRect: rectN, catchNum: catchV }); }
function catchOf(p) {
var hold = Math.max(1, pin.offsetHeight - live.offsetHeight), k = window.innerHeight / (window.innerHeight + hold);
return p < k ? (p / k) * 0.35 : 0.35 + ((p - k) / (1 - k)) * 0.65;
}
function bindCatch() {
if (bound) return; bound = true;
ScrollTrigger.create({
trigger: pin, start: 'top bottom',
end: function () { return '+=' + Math.max(1, window.innerHeight + pin.offsetHeight - live.offsetHeight); },
invalidateOnRefresh: true,
onUpdate: function (s) { catchV = catchOf(s.progress); pushRect(); },
onRefresh: function (s) { catchV = catchOf(s.progress); pushRect(); }
});
ES.scroll.onSection(pin, { progress: function () { pushRect(); } });
}
function whenFonts(cb) {
var done = false, go = function () { if (!done) { done = true; cb(); } };
if (document.fonts && document.fonts.load) {
try { document.fonts.load('820 expanded 100px "Archivo"').then(function () { return document.fonts.ready; }).then(go, go); }
catch (e) { go(); }
setTimeout(go, 2500);
} else go();
}
rain.on('ready', function () {
if (html.dataset.webgl !== 'ok') return;
whenFonts(function () { if (raster()) { bindCatch(); ES.scroll.refresh(); } });
});
var rT = 0;
window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { if (maskUp) { raster(); pushRect(); } }, 220); });
if (window.MutationObserver) new MutationObserver(function () {
if (html.dataset.webgl === 'ok' && maskUp) { raster(); pushRect(); if (!bound) { bindCatch(); ES.scroll.refresh(); } }
if (html.dataset.webgl !== 'ok') sec.classList.remove('is-numbercatch');
}).observe(html, { attributes: true, attributeFilter: ['data-webgl'] });
document.addEventListener('pointerdown', function (e) {
var a = e.target.closest && e.target.closest('a[href^="sms:"], a[href^="tel:"]');
if (!a || a === num || catchV > 0.001) return;
var r = a.getBoundingClientRect();
rain.set({ numRect: { x: r.left, y: r.top, w: r.width, h: r.height } });
}, { capture: true, passive: true });
ES.motion.on(function (r) {
if (!r) return;
sec.classList.add('is-in'); live.classList.add('is-in'); sec.classList.remove('is-numbercatch');
catchV = 0; rain.set({ catchNum: 0 });
text.solidify(title, { instant: true });
text.solidifyAt(title, 1);
});
})();

/* 52-chrome.js */
(function () {
'use strict';
var ES = window.ES; if (!ES) return;
var html = document.documentElement;
var reduced = html.dataset.motion === 'reduced';
var coarse = html.dataset.input !== 'fine';
var ticking = false, lastY = window.scrollY, downAcc = 0, upAcc = 0, hidden = false, lastT = 0;
function setHidden(h) {
if (h === hidden) return;
hidden = h; ES.chrome.topbar(!h);
}
function tick() {
ticking = false;
var y = window.scrollY, H = window.innerHeight;
var scrolled = y > 24;
if ((html.dataset.scrolled === '1') !== scrolled) { if (scrolled) html.dataset.scrolled = '1'; else delete html.dataset.scrolled; }
if (!coarse || reduced) return;
var d = y - lastY; lastY = y;
if (d > 0) { downAcc += d; upAcc = 0; } else if (d < 0) { upAcc -= d; downAcc = 0; }
var inNumber = html.dataset.numberview === '1';
var nearBottom = y + H >= (document.documentElement.scrollHeight - 4);
if (y < H * 1.15 || inNumber || nearBottom) { setHidden(false); downAcc = 0; upAcc = 0; return; }
if (!hidden && downAcc > 72) setHidden(true);
else if (hidden && upAcc > 14) setHidden(false);
}
function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
window.addEventListener('scroll', onScroll, { passive: true });
tick();
var targets = [document.getElementById('contact-number'), document.getElementById('contact-cta')].filter(Boolean);
if (coarse && targets.length && 'IntersectionObserver' in window) {
var flags = targets.map(function () { return false; });
var io = new IntersectionObserver(function (entries) {
for (var i = 0; i < entries.length; i++) { var k = targets.indexOf(entries[i].target); if (k > -1) flags[k] = entries[i].isIntersecting; }
var any = false; for (var j = 0; j < flags.length; j++) if (flags[j]) any = true;
if (any) { html.dataset.numberview = '1'; setHidden(false); } else delete html.dataset.numberview;
}, { threshold: 0 });
for (var t = 0; t < targets.length; t++) io.observe(targets[t]);
}
ES.motion.on(function (r) { if (r) { reduced = true; setHidden(false); } });
})();
