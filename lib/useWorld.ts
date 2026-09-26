'use client';
// One motion owner per world: GSAP ScrollTrigger scrubbed by native scroll (smoothed by Lenis on desktop pointers).
// Everything is built in a gsap.context and reverted when the world unmounts, so leaving a world leaves nothing behind.
import { useEffect, useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export type Env = { mobile: boolean; reduced: boolean };

export function useWorld(root: RefObject<HTMLElement | null>, build: (env: Env, q: gsap.utils.SelectorFunc) => void, deps: unknown[] = []) {
  useIso(() => {
    const el = root.current;
    if (!el) return;
    const reduced = document.documentElement.dataset.motion === 'reduced';
    const mobile = window.innerWidth < 900;
    const fine = matchMedia('(pointer: fine)').matches;
    let lenis: Lenis | null = null;
    let tick: ((t: number) => void) | null = null;
    if (!reduced && fine && !mobile) {
      lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
      lenis.on('scroll', ScrollTrigger.update);
      tick = (t: number) => lenis!.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }
    const ctx = gsap.context(() => {
      build({ mobile, reduced }, gsap.utils.selector(el));
      const html = document.documentElement, base = el.dataset.tone || 'light';
      html.dataset.tone = base;
      el.querySelectorAll<HTMLElement>('[data-tone]').forEach((sec) => {
        if (sec === el) return;
        ScrollTrigger.create({ trigger: sec, start: 'top 64px', end: 'bottom 64px', onToggle: (st) => { if (st.isActive) html.dataset.tone = sec.dataset.tone!; else if (html.dataset.tone === sec.dataset.tone) html.dataset.tone = base; } });
      });
    }, el);
    // images change layout as they arrive; re-measure the triggers once they have
    const imgs = [...el.querySelectorAll('img')];
    let pending = imgs.filter((i) => !i.complete).length;
    const onImg = () => { if (--pending <= 0) ScrollTrigger.refresh(); };
    imgs.forEach((i) => { if (!i.complete) { i.addEventListener('load', onImg, { once: true }); i.addEventListener('error', onImg, { once: true }); } });
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      ctx.revert();
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// entrance for a world's opening block (not scroll-driven: it plays as the world arrives)
export function arrive(q: gsap.utils.SelectorFunc, reduced: boolean) {
  if (reduced) return;
  // the world mounts under the portal, so this is already under way when the portal lifts
  gsap.from(q('[data-arrive]'), { y: 30, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.07 });
  gsap.from(q('[data-arrive-line]'), { yPercent: 105, duration: 0.85, ease: 'expo.out', stagger: 0.06 });
}
