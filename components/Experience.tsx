'use client';
// The ElaSystems experience: one stage, three gateways, four worlds.
// Intro: the ES mark, alive in 3D. Opening: the S lets go as tiles that lift toward the camera; the three bars of
// the E travel out to become the gateways (Websites / Apps / Systems); mid-flight every tile turns over, and its
// back is a slice of the window — so the tiles assemble the preview window where the S was.
// Hub: hover/focus previews a world in that window; click pushes the camera through the bar into the world.
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { BARS, S_BOX, S_PATH, SLASH, TILE_COLS, TILE_ROWS, hubFrame, markFrame, type Rect } from '@/lib/mark';
import { CONTACT, PILLARS, type WorldId } from '@/lib/content';
import { Previews } from './Previews';
import { Wordmark } from './ui/Wordmark';

const load = {
  websites: () => import('./worlds/WebsitesWorld'),
  apps: () => import('./worlds/AppsWorld'),
  systems: () => import('./worlds/SystemsWorld'),
  contact: () => import('./worlds/ContactWorld'),
};
const Worlds = {
  websites: dynamic(load.websites, { ssr: false }),
  apps: dynamic(load.apps, { ssr: false }),
  systems: dynamic(load.systems, { ssr: false }),
  contact: dynamic(load.contact, { ssr: false }),
};
const WORLD_BG: Record<WorldId, string> = { websites: '#F2EEE6', apps: '#ECE3D4', systems: '#0D1117', contact: '#0B1528' };
const WORLD_TONE: Record<WorldId, 'light' | 'dark'> = { websites: 'light', apps: 'light', systems: 'dark', contact: 'dark' };
const ORDER: WorldId[] = ['websites', 'apps', 'systems', 'contact'];
type Phase = 'intro' | 'opening' | 'hub' | 'entering' | 'world' | 'leaving';

const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const TILES = Array.from({ length: TILE_COLS * TILE_ROWS }, (_, i) => ({ c: i % TILE_COLS, r: Math.floor(i / TILE_COLS) }));

export default function Experience() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [world, setWorld] = useState<WorldId | null>(null);
  const [active, setActive] = useState(0);
  const [veiled, setVeiled] = useState(false);
  const [geo, setGeo] = useState<null | { vw: number; vh: number; hub: ReturnType<typeof hubFrame>; mark: ReturnType<typeof markFrame> }>(null);
  const reduced = useRef(false);
  const byKey = useRef(false);

  const stage = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const bars = useRef<(HTMLButtonElement | null)[]>([]);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const sWhole = useRef<SVGSVGElement>(null);
  const slash = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const introUI = useRef<HTMLDivElement>(null);
  const hubUI = useRef<HTMLDivElement>(null);
  const portal = useRef<HTMLDivElement>(null);
  const worldEl = useRef<HTMLDivElement>(null);
  const idle = useRef<gsap.core.Tween | null>(null);
  const phaseRef = useRef<Phase>('intro');
  phaseRef.current = phase;

  /* ── geometry ───────────────────────────────────────────────────────────── */
  const measure = useCallback(() => {
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    setGeo({ vw, vh, hub: hubFrame(vw, vh), mark: markFrame(vw, vh) });
  }, []);
  useIso(() => {
    reduced.current = document.documentElement.dataset.motion === 'reduced';
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    measure();
    const on = () => measure();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [measure]);

  const introRects = useMemo(() => {
    if (!geo) return null;
    const { map } = geo.mark;
    const tw = S_BOX.w / TILE_COLS, th = S_BOX.h / TILE_ROWS;
    return {
      bars: BARS.map(map),
      tiles: TILES.map(({ c, r }) => map({ x: S_BOX.x + c * tw, y: S_BOX.y + r * th, w: tw, h: th })),
      slash: map({ x: SLASH.cx - SLASH.thick / 2, y: SLASH.cy - SLASH.len / 2, w: SLASH.thick, h: SLASH.len }),
      s: map({ x: S_BOX.x, y: S_BOX.y, w: S_BOX.w, h: S_BOX.h }),
    };
  }, [geo]);
  const hubTiles = useMemo(() => {
    if (!geo) return [];
    const p = geo.hub.panel, tw = p.w / TILE_COLS, th = p.h / TILE_ROWS;
    return TILES.map(({ c, r }) => ({ x: p.x + c * tw, y: p.y + r * th, w: tw, h: th }));
  }, [geo]);
  // tiles leave the S in order of distance from the slash (nearest first): the break starts at the cut
  const tileOrder = useMemo(() => {
    if (!introRects) return TILES.map((_, i) => i);
    const a = (SLASH.angle * Math.PI) / 180, nx = Math.cos(a), ny = Math.sin(a);
    const c = introRects.slash, cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    return TILES.map((_, i) => { const t = introRects.tiles[i]; return { i, d: Math.abs((t.x + t.w / 2 - cx) * nx + (t.y + t.h / 2 - cy) * ny) }; }).sort((p, q) => p.d - q.d).map((o) => o.i);
  }, [introRects]);

  const fit = (from: Rect, to: Rect) => ({ x: from.x - to.x, y: from.y - to.y, scaleX: from.w / to.w, scaleY: from.h / to.h });
  const showLabels = () => { gsap.set('.gate-word', { clipPath: 'inset(0 0% 0 0)' }); gsap.set('.gate-line', { opacity: 1, y: 0 }); };

  /* ── lay out: intro = everything on the mark; hub = identity ─────────────── */
  useIso(() => {
    if (!geo || !introRects) return;
    const inIntro = phaseRef.current === 'intro';
    bars.current.forEach((b, i) => { if (!b) return; gsap.set(b, inIntro ? { ...fit(introRects.bars[i], geo.hub.bars[i]), transformOrigin: '0 0' } : { x: 0, y: 0, scaleX: 1, scaleY: 1, transformOrigin: '0 0' }); });
    tiles.current.forEach((t, i) => { if (!t) return; gsap.set(t, { x: introRects.tiles[i].x, y: introRects.tiles[i].y, width: introRects.tiles[i].w + 0.5, height: introRects.tiles[i].h + 0.5, opacity: 0, rotationX: 0, rotationY: 0, z: 0 }); });
    if (sWhole.current) gsap.set(sWhole.current, { x: introRects.s.x, y: introRects.s.y, width: introRects.s.w, height: introRects.s.h, opacity: inIntro ? 1 : 0 });
    if (slash.current) {
      const hs = geo.hub.slash;
      if (inIntro) gsap.set(slash.current, { x: introRects.slash.x, y: introRects.slash.y, width: introRects.slash.w, height: introRects.slash.h, rotation: SLASH.angle, opacity: 1 });
      else if (hs) gsap.set(slash.current, { x: (hs.x0 + hs.x1) / 2 - 1, y: hs.y0, width: 2, height: Math.hypot(hs.x1 - hs.x0, hs.y1 - hs.y0), rotation: SLASH.angle, opacity: 1 });
      else gsap.set(slash.current, { opacity: 0 });
    }
    if (panel.current) gsap.set(panel.current, { opacity: inIntro ? 0 : 1 });
  }, [geo, introRects]);

  /* ── intro life: the mark follows the pointer; the light crosses the bars every few seconds ── */
  useEffect(() => {
    if (phase !== 'intro' || !tilt.current || reduced.current) return;
    const rx = gsap.quickTo(tilt.current, 'rotationX', { duration: 1.2, ease: 'power3' });
    const ry = gsap.quickTo(tilt.current, 'rotationY', { duration: 1.2, ease: 'power3' });
    const move = (e: PointerEvent) => { if (phaseRef.current !== 'intro') return; rx(6 + (e.clientY / innerHeight - 0.5) * -10); ry(-10 + (e.clientX / innerWidth - 0.5) * 18); };
    const settle = gsap.fromTo(tilt.current, { rotationX: 16, rotationY: -26 }, { rotationX: 6, rotationY: -10, duration: 2.4, ease: 'power3.out' });
    idle.current = gsap.fromTo('.gate-sheen', { xPercent: -120 }, { xPercent: 120, duration: 1.3, ease: 'power2.inOut', stagger: 0.08, repeat: -1, repeatDelay: 3.2, delay: 1.2 });
    window.addEventListener('pointermove', move);
    return () => { window.removeEventListener('pointermove', move); idle.current?.kill(); settle.kill(); };
  }, [phase]);

  /* ── opening: the system unfolds (~2.2 s) ────────────────────────────────── */
  const open = useCallback((viaKey = false) => {
    if (phaseRef.current !== 'intro' || !geo || !introRects) return;
    byKey.current = viaKey;
    phaseRef.current = 'opening';
    setPhase('opening');
    idle.current?.kill();
    gsap.killTweensOf(tilt.current);
    const H = geo.hub;
    const finish = () => { setPhase('hub'); if (byKey.current) requestAnimationFrame(() => bars.current[0]?.focus({ preventScroll: true })); };
    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: finish });
    const slashTo = H.slash ? { x: (H.slash.x0 + H.slash.x1) / 2 - 1, y: H.slash.y0, width: 2, height: Math.hypot(H.slash.x1 - H.slash.x0, H.slash.y1 - H.slash.y0) } : null;
    if (reduced.current) {
      tl.to(introUI.current, { opacity: 0, duration: 0.25 })
        .add(() => { bars.current.forEach((b) => b && gsap.set(b, { x: 0, y: 0, scaleX: 1, scaleY: 1 })); gsap.set(sWhole.current, { opacity: 0 }); showLabels(); if (slash.current && slashTo) gsap.set(slash.current, slashTo); })
        .to([panel.current, hubUI.current], { opacity: 1, duration: 0.3 });
      return;
    }
    // 0 — the S becomes tiles in the same frame (no seams at rest), the mark squares up to camera, light sweeps
    tl.set(sWhole.current, { opacity: 0 }, 0).set(tiles.current, { opacity: 1 }, 0)
      .to(introUI.current, { opacity: 0, y: 12, duration: 0.35, ease: 'power2.in' }, 0)
      .to(tilt.current, { rotationX: 0, rotationY: 0, duration: 0.6 }, 0)
      .fromTo('.gate-sheen', { xPercent: -120 }, { xPercent: 120, duration: 0.8, ease: 'power2.inOut', stagger: 0.05 }, 0);
    // 1 — the S lets go: tiles lift toward the camera, nearest the slash first, and turn
    tileOrder.forEach((ti, k) => {
      const t = tiles.current[ti];
      if (!t) return;
      tl.to(t, { z: 180 + ((ti * 53) % 200), rotationX: ((ti * 37) % 110) - 55, rotationY: ((ti * 71) % 110) - 55, duration: 0.55, ease: 'power2.out' }, 0.03 + k * 0.012);
    });
    // 2 — the bars separate and travel to their gateway positions
    bars.current.forEach((b, i) => {
      if (!b) return;
      const f = fit(introRects.bars[i], H.bars[i]);
      tl.to(b, { y: f.y + (i - 1) * geo.vh * 0.045, duration: 0.4, ease: 'power2.out' }, 0.2 + i * 0.04)
        .to(b, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.95, ease: 'expo.inOut' }, 0.5 + i * 0.06);
    });
    tl.to('.gate-word', { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'expo.out', stagger: 0.07 }, 1.3)
      .to('.gate-line', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07 }, 1.45);
    if (slash.current && slashTo) tl.to(slash.current, { ...slashTo, duration: 1.0, ease: 'expo.inOut' }, 0.45);
    else if (slash.current) tl.to(slash.current, { opacity: 0, duration: 0.4 }, 0.45);
    // 3 — the tiles fly to the window and turn over mid-flight: their backs are the window, so it assembles
    if (!H.mobile) {
      tileOrder.forEach((ti, k) => {
        const t = tiles.current[ti];
        if (!t) return;
        tl.to(t, { x: hubTiles[ti].x, y: hubTiles[ti].y, width: hubTiles[ti].w + 0.5, height: hubTiles[ti].h + 0.5, z: 0, rotationX: 0, rotationY: 180, duration: 0.7, ease: 'expo.inOut' }, 0.5 + k * 0.008);
      });
      tl.to(panel.current, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 1.8).set(tiles.current, { opacity: 0 }, 2.1);
    } else {
      tl.to(tiles.current, { opacity: 0, z: 420, duration: 0.5, ease: 'power2.in', stagger: 0.01 }, 0.5).to(panel.current, { opacity: 1, duration: 0.4 }, 1.6);
    }
    tl.fromTo(hubUI.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.55);
  }, [geo, introRects, hubTiles, tileOrder]);

  // anything counts as "begin": wheel, touch, a key, a click
  useEffect(() => {
    if (phase !== 'intro') return;
    const go = (e: Event) => {
      if (e.type === 'keydown') { if (['Tab', 'Shift', 'Alt', 'Control', 'Meta'].includes((e as KeyboardEvent).key)) return; open(true); return; }
      open(false);
    };
    const opts = { passive: true } as AddEventListenerOptions;
    window.addEventListener('wheel', go, opts); window.addEventListener('touchmove', go, opts); window.addEventListener('keydown', go);
    return () => { window.removeEventListener('wheel', go); window.removeEventListener('touchmove', go); window.removeEventListener('keydown', go); };
  }, [phase, open]);

  /* ── entering and leaving worlds ─────────────────────────────────────────── */
  // the portal starts as exactly the bar's face (same parallelogram as .gate-face)
  const barPoly = (i: number) => {
    const f = bars.current[i]?.querySelector('.gate-face')?.getBoundingClientRect();
    if (!f) return 'polygon(0px 0px, 0px 0px, 0px 0px, 0px 0px)';
    const h = f.height;
    return `polygon(${f.left + h * 0.6}px ${f.top}px, ${f.right}px ${f.top}px, ${f.right - h * 0.545}px ${f.bottom}px, ${f.left}px ${f.bottom}px)`;
  };
  const fullPoly = () => `polygon(0px 0px, ${innerWidth}px 0px, ${innerWidth}px ${innerHeight}px, 0px ${innerHeight}px)`;
  const rectPoly = (el: Element | null) => {
    const b = el?.getBoundingClientRect();
    return b ? `polygon(${b.left}px ${b.top}px, ${b.right}px ${b.top}px, ${b.right}px ${b.bottom}px, ${b.left}px ${b.bottom}px)` : fullPoly();
  };
  const fromPoly = (id: WorldId) => (id === 'contact' ? rectPoly(document.querySelector('.hub-contact')) : barPoly(ORDER.indexOf(id)));
  const originOf = (id: WorldId) => {
    const el = id === 'contact' ? document.querySelector('.hub-contact') : bars.current[ORDER.indexOf(id)];
    const b = el?.getBoundingClientRect();
    return b ? `${b.left + b.width / 2}px ${b.top + b.height / 2}px` : '50% 50%';
  };
  const setWorldAttrs = (id: WorldId | null) => {
    const html = document.documentElement;
    if (id) { html.dataset.world = id; html.dataset.tone = WORLD_TONE[id]; } else { delete html.dataset.world; delete html.dataset.tone; }
  };
  const worldRef = useRef<WorldId | null>(null);
  const busy = useRef(false);
  const mount = (id: WorldId) => { window.scrollTo(0, 0); worldRef.current = id; setWorld(id); };
  // the world is in place: colours, scroll and focus hand over to it
  const arrived = (id: WorldId) => {
    phaseRef.current = 'world';
    setPhase('world');
    setVeiled(false);
    setWorldAttrs(id);
    busy.current = false;
    requestAnimationFrame(() => { const h = document.querySelector<HTMLElement>('.world h1'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } });
  };

  // hub → world: the chosen bar's face opens into the world; the world is already there when it has
  const enter = useCallback((id: WorldId, opts: { instant?: boolean; push?: boolean } = {}) => {
    if (!portal.current || busy.current) return;
    if (opts.push !== false) history.pushState({ w: id }, '', `#${id}`);
    load[id]();
    if (id !== 'contact') setActive(ORDER.indexOf(id));
    const p = portal.current;
    gsap.killTweensOf(p);
    if (opts.instant) { gsap.set(p, { display: 'none' }); mount(id); arrived(id); return; }
    busy.current = true;
    phaseRef.current = 'entering';
    setPhase('entering');
    setVeiled(true);
    gsap.set(p, { display: 'block', zIndex: 50, backgroundColor: WORLD_BG[id], clipPath: reduced.current ? fullPoly() : fromPoly(id), opacity: 0 });
    const tl = gsap.timeline();
    if (reduced.current) {
      tl.to(p, { opacity: 1, duration: 0.25 }).add(() => mount(id)).add(() => arrived(id), '+=0.12').to(p, { opacity: 0, duration: 0.3 }).set(p, { display: 'none' });
      return;
    }
    tl.to(p, { opacity: 1, duration: 0.12, ease: 'none' }, 0)
      .to(bars.current.filter((_, i) => ORDER[i] !== id), { x: -80, autoAlpha: 0, duration: 0.45, ease: 'power2.in', stagger: 0.04 }, 0)
      .to([panel.current, hubUI.current], { autoAlpha: 0, duration: 0.35 }, 0)
      // a camera push toward the chosen bar while its face opens
      .fromTo(stage.current, { scale: 1, transformOrigin: originOf(id) }, { scale: 1.12, duration: 0.95, ease: 'power2.in' }, 0)
      .to(p, { clipPath: fullPoly(), duration: 0.8, ease: 'expo.inOut' }, 0.1)
      .add(() => mount(id), 0.3)
      .add(() => arrived(id), 0.8)
      .to(p, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0.8)
      .set(p, { display: 'none' });
  }, []);

  // world → world ("Next", "Start a project"): the button opens straight into the next world, no hub stopover
  const go = useCallback((to: WorldId, from?: Element | null, push = true) => {
    const cur = worldRef.current;
    if (!portal.current || busy.current || phaseRef.current !== 'world' || !cur || cur === to) return;
    busy.current = true;
    if (push) history.pushState({ w: to }, '', `#${to}`);
    load[to]();
    if (to !== 'contact') setActive(ORDER.indexOf(to));
    const p = portal.current;
    gsap.killTweensOf(p);
    const fade = reduced.current || !from;
    gsap.set(p, { display: 'block', zIndex: 50, backgroundColor: WORLD_BG[to], clipPath: fade ? fullPoly() : rectPoly(from!), opacity: fade ? 0 : 1 });
    const tl = gsap.timeline();
    if (fade) tl.to(p, { opacity: 1, duration: 0.3 });
    else tl.to(p, { clipPath: fullPoly(), duration: 0.7, ease: 'expo.inOut' });
    tl.add(() => { setWorldAttrs(null); mount(to); }, fade ? 0.3 : 0.62)
      .add(() => arrived(to), fade ? 0.42 : 0.7)
      .to(p, { opacity: 0, duration: 0.3, ease: 'power1.out' }, fade ? 0.45 : 0.72)
      .set(p, { display: 'none' });
  }, []);

  // world → hub: the world lets go from wherever the visitor is; the portal closes back into its bar
  const leave = useCallback(() => {
    const id = worldRef.current;
    if (!portal.current || busy.current || phaseRef.current !== 'world' || !id) return;
    busy.current = true;
    phaseRef.current = 'leaving';
    setPhase('leaving');
    setWorldAttrs(null);
    const p = portal.current;
    gsap.killTweensOf(p);
    gsap.set(p, { display: 'block', zIndex: 30, backgroundColor: WORLD_BG[id], clipPath: fullPoly(), opacity: 1 });
    gsap.set(bars.current, { x: 0, autoAlpha: 1 });
    const back = () => {
      worldRef.current = null;
      setWorld(null);
      phaseRef.current = 'hub';
      setPhase('hub');
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        gsap.to([panel.current, hubUI.current], { autoAlpha: 1, duration: 0.5, delay: 0.25 });
        const end = () => {
          gsap.set(p, { display: 'none' });
          busy.current = false;
          const t = id === 'contact' ? document.querySelector<HTMLElement>('.hub-contact') : bars.current[ORDER.indexOf(id)];
          t?.focus({ preventScroll: true });
        };
        gsap.set(stage.current, { scale: 1 });
        const target = fromPoly(id), origin = originOf(id);
        if (reduced.current) { gsap.to(p, { opacity: 0, duration: 0.3, onComplete: end }); return; }
        gsap.fromTo(stage.current, { scale: 1.12, transformOrigin: origin }, { scale: 1, duration: 0.95, ease: 'power3.out' });
        gsap.timeline({ onComplete: end })
          .fromTo(p, { clipPath: fullPoly() }, { clipPath: target, duration: 0.85, ease: 'expo.inOut' }, 0)
          .to(p, { opacity: 0, duration: 0.25, ease: 'power1.in' }, 0.6);
      });
    };
    gsap.to(worldEl.current, { autoAlpha: 0, y: -24, duration: 0.34, ease: 'power2.in', onComplete: back });
  }, []);

  // browser back / forward and deep links
  useEffect(() => {
    const onPop = () => {
      const h = location.hash.slice(1) as WorldId;
      const inWorld = phaseRef.current === 'world';
      if (inWorld && !ORDER.includes(h)) leave();
      else if (inWorld && ORDER.includes(h) && h !== worldRef.current) go(h, null, false);
      else if (phaseRef.current === 'hub' && ORDER.includes(h)) enter(h, { push: false });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [enter, leave, go]);
  useEffect(() => {
    if (!geo) return;
    const deep = document.documentElement.dataset.deep as WorldId | undefined;
    if (deep && phaseRef.current === 'intro') {
      delete document.documentElement.dataset.deep;
      gsap.set(introUI.current, { opacity: 0 });
      gsap.set(hubUI.current, { opacity: 1 });
      phaseRef.current = 'hub';
      setPhase('hub');
      requestAnimationFrame(() => { bars.current.forEach((b) => b && gsap.set(b, { x: 0, y: 0, scaleX: 1, scaleY: 1 })); showLabels(); gsap.set(sWhole.current, { opacity: 0 }); gsap.set(panel.current, { opacity: 1 }); enter(deep, { instant: true, push: false }); });
    }
  }, [geo, enter]);

  useEffect(() => {
    // the page scrolls only inside a world (and while leaving one, so the exit starts where the visitor was)
    document.documentElement.classList.toggle('is-locked', phase !== 'world' && phase !== 'leaving');
    document.documentElement.dataset.phase = phase;
  }, [phase]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && phaseRef.current === 'world') history.back(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  const W = world ? Worlds[world] : null;
  const nextOf = (id: WorldId) => ORDER[(ORDER.indexOf(id) + 1) % ORDER.length];
  const inWorld = phase === 'world' || phase === 'leaving';

  return (
    <>
      <div ref={stage} className={`stage phase-${phase}`} aria-hidden={inWorld} style={geo?.hub.mobile ? { ['--stage-min' as string]: `${geo.hub.bars[2].y + geo.hub.bars[2].h + 44 + 120}px` } : undefined}>
        <div className="stage-light" aria-hidden="true" />
        <div ref={tilt} className="stage-tilt">
          {/* the S: one shape at rest; tiles (front: the S, back: the window) the moment it breaks */}
          <svg ref={sWhole} className="s-whole" viewBox={`${S_BOX.x} ${S_BOX.y} ${S_BOX.w} ${S_BOX.h}`} preserveAspectRatio="none" aria-hidden="true"><path d={S_PATH} fill="#F3EEE4" /></svg>
          {geo && TILES.map(({ c, r }, i) => {
            const p = geo.hub.panel;
            return (
              <div key={i} ref={(el) => { tiles.current[i] = el; }} className="tile" aria-hidden="true">
                <svg className="tile-f" viewBox={`${S_BOX.x + (c * S_BOX.w) / TILE_COLS} ${S_BOX.y + (r * S_BOX.h) / TILE_ROWS} ${S_BOX.w / TILE_COLS} ${S_BOX.h / TILE_ROWS}`} preserveAspectRatio="none"><path d={S_PATH} fill="#F3EEE4" /></svg>
                <span className="tile-b" style={{ backgroundSize: `${p.w}px ${p.h}px`, backgroundPosition: `${(-c * p.w) / TILE_COLS}px ${(-r * p.h) / TILE_ROWS}px` }} />
              </div>
            );
          })}
          <div ref={slash} className="slash" aria-hidden="true" />
          {PILLARS.map((p, i) => {
            const r = geo?.hub.bars[i];
            return (
              <button
                key={p.id}
                ref={(el) => { bars.current[i] = el; }}
                className={`gate gate-${i} ${active === i ? 'is-active' : ''}`}
                style={r ? { left: r.x, top: r.y, width: r.w, height: r.h, ['--h' as string]: `${r.h}px` } : { visibility: 'hidden' }}
                onClick={() => (phase === 'hub' ? enter(p.id) : open(false))}
                onPointerEnter={() => { if (phase === 'hub') { setActive(i); load[p.id](); } }}
                onFocus={() => { setActive(i); load[p.id](); }}
                tabIndex={phase === 'hub' ? 0 : -1}
                aria-label={`${p.enter}: ${p.line}`}
              >
                <span className="gate-inner" aria-hidden="true">
                  <span className="gate-depth"><i /><i /><i /><i /></span>
                  <span className="gate-face"><span className="gate-sheen" /></span>
                  <span className="gate-word">{p.word}</span>
                </span>
                <span className="gate-line" aria-hidden="true">{p.line}</span>
              </button>
            );
          })}
        </div>

        {geo && (
          <div ref={panel} className="panel" style={{ left: geo.hub.panel.x, top: geo.hub.panel.y, width: geo.hub.panel.w, height: geo.hub.panel.h, ['--lean' as string]: `${geo.hub.panel.lean}px` }} aria-hidden="true">
            <Previews active={active} />
          </div>
        )}

        <div ref={introUI} className="intro-ui">
          <p className="intro-name"><Wordmark /></p>
          <p className="intro-sub">Websites · Apps · Systems</p>
          <button className="intro-cue" onClick={() => open(false)} tabIndex={phase === 'intro' ? 0 : -1}>
            <span className="intro-cue-bar" aria-hidden="true"><i /></span>
            <span>Scroll to open the system</span>
          </button>
        </div>

        <div ref={hubUI} className="hub-ui" style={geo?.hub.mobile ? { ['--ctop' as string]: `${geo.hub.bars[2].y + geo.hub.bars[2].h + 44}px` } : undefined}>
          <p className="hub-kicker label">ElaSystems — Detroit</p>
          <h1 className="hub-title">We build the front of your business, <span>and everything behind it.</span></h1>
          <button className="hub-contact" onClick={() => enter('contact')} tabIndex={phase === 'hub' ? 0 : -1} onPointerEnter={() => load.contact()}>
            <span className="label">Start here</span><b>Start a project</b><i aria-hidden="true" />
          </button>
        </div>
      </div>

      <header className={`topbar phase-${phase}`}>
        <button className="topbar-brand" onClick={() => (inWorld ? history.back() : undefined)} aria-label={inWorld ? 'Back to the hub' : 'ElaSystems'} tabIndex={phase === 'intro' ? -1 : 0}>
          <svg viewBox="10 20 660 400" className="topbar-mark" aria-hidden="true"><path d="M62 65H365L332.3 125H26Z M62 198H292.5L259.8 258H26Z M62 322H225.1L192.4 382H26Z" fill="#E3A83E" /><path fill="#E3A83E" d="M402.5 20h4L188.5 420h-4Z" /><path fill="#F3EEE4" d={S_PATH} /></svg>
          {inWorld ? <span className="topbar-back">Hub</span> : <Wordmark />}
        </button>
        <nav className="topbar-cta">
          {inWorld ? (
            <>
              <a className="cut cut-line topbar-text" style={{ ['--h' as string]: '42px' }} href={CONTACT.sms} aria-label={`Text ElaSystems at ${CONTACT.phone}`}>
                <span className="wide">Text {CONTACT.phone}</span><span className="narrow">Text us</span>
              </a>
              {world !== 'contact' && <button className="cut cut-gold topbar-start" style={{ ['--h' as string]: '42px' }} onClick={(e) => go('contact', e.currentTarget)}>Start a project</button>}
            </>
          ) : (
            <a className="cut cut-line topbar-text" style={{ ['--h' as string]: '42px' }} href={CONTACT.sms} aria-label={`Text ElaSystems at ${CONTACT.phone}`} tabIndex={phase === 'intro' ? -1 : 0}>
              <span className="wide">Text {CONTACT.phone}</span><span className="narrow">Text us</span>
            </a>
          )}
        </nav>
      </header>

      <div ref={portal} className="portal" aria-hidden="true" />
      {W && world && (
        <div ref={worldEl} className={`world world-${world} ${veiled ? 'is-veiled' : ''}`} key={world}>
          <W onBack={() => history.back()} onNext={() => go(nextOf(world), document.querySelector('.w-next'))} next={nextOf(world)} />
        </div>
      )}
      <noscript><p className="noscript">ElaSystems builds websites, apps and business systems in Detroit. Text {CONTACT.phone} or email {CONTACT.email}.</p></noscript>
    </>
  );
}
