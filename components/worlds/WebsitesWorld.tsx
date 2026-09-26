'use client';
// World 01 — Websites. One scene per project. Each scene is already composed when it pins (it arrives while it
// scrolls into view), then: the desktop is browsed → the camera turns and the phone swings out from behind the
// display → both show the same brand, composed twice → the next scene is already arriving. No empty frames.
import { useRef } from 'react';
import gsap from 'gsap';
import { Display, Phone, work } from '../devices';
import { MORE_SITES, SITES, WORLD_COPY, type Site } from '@/lib/content';
import { useWorld, arrive } from '@/lib/useWorld';
import { WorldEnd, WorldIntro, type WorldProps } from './shared';

const travel = (inner: Element | null, frame: Element | null, k = 1) => {
  if (!inner || !frame) return 0;
  return -Math.max(0, (inner as HTMLElement).scrollHeight - (frame as HTMLElement).clientHeight) * k;
};

// story sites (scroll-driven, pinned sections) are shown as clean frames that crossfade; others scroll a tall page
function Frames({ list, alt, sizes }: { list: string[]; alt: string; sizes: string }) {
  return (
    <div className="dev-frames">
      {list.map((src, i) => (<img key={src} src={src} alt={i === 0 ? alt : ''} sizes={sizes} className="dev-frame" loading="lazy" decoding="async" draggable={false} style={i ? { opacity: 0 } : undefined} />))}
    </div>
  );
}
const dFrames = (s: string) => [0, 1, 2].map((i) => `/work/${s}-f${i}-1600.webp`);
const mFrames = (s: string) => [0, 1, 2].map((i) => `/work/${s}-mf${i}-720.webp`);

function Scene({ site, first }: { site: Site; first: boolean }) {
  return (
    <section className="ws-scene" data-story={site.story ? '1' : undefined} style={{ ['--tint' as string]: site.tint, ['--ink2' as string]: site.ink }} aria-labelledby={`ws-${site.slug}`}>
      <div className="ws-stage">
        <div className="ws-copy">
          <p className="label ws-kind">{site.kind}</p>
          <h2 id={`ws-${site.slug}`} className="ws-name">{site.name}</h2>
          <p className="ws-line">{site.line}</p>
          <p className="ws-mode label" aria-hidden="true"><span>Composed for</span> <span className="ws-mode-roll"><b>Desktop<br />Mobile</b></span></p>
          {site.url ? (
            <a className="ws-visit" href={site.url} target="_blank" rel="noopener" aria-label={`Visit ${site.name}'s website (opens in a new tab)`}>Visit {site.url.replace('https://', '')} <i aria-hidden="true" /></a>
          ) : null}
        </div>
        <div className="ws-rig">
          {site.story ? (
            <Display className="ws-display"><Frames list={dFrames(site.slug)} alt={`${site.name} website on desktop`} sizes="(max-width: 899px) 92vw, 52vw" /></Display>
          ) : (
            <Display className="ws-display" shot={{ ...work.dt(site.slug), sizes: '(max-width: 899px) 92vw, 52vw', alt: `${site.name} website on desktop`, eager: first }} />
          )}
          {site.story ? (
            <Phone className="ws-phone" dark><Frames list={mFrames(site.slug)} alt={`${site.name} website on mobile`} sizes="(max-width: 899px) 44vw, 230px" /></Phone>
          ) : (
            <Phone className="ws-phone" dark shot={{ ...work.mt(site.slug), sizes: '(max-width: 899px) 44vw, 230px', alt: `${site.name} website on mobile` }} />
          )}
        </div>
      </div>
    </section>
  );
}

export default function WebsitesWorld(props: WorldProps) {
  const root = useRef<HTMLDivElement>(null);
  useWorld(root, ({ mobile, reduced }, q) => {
    arrive(q, reduced);
    if (reduced) return;
    q('.ws-scene').forEach((scene) => {
      const s = gsap.utils.selector(scene);
      const story = (scene as HTMLElement).dataset.story === '1';
      const disp = s('.ws-display')[0], phone = s('.ws-phone')[0], rig = s('.ws-rig')[0];
      const dIn = s('.ws-display .dev-scroll')[0], dFr = s('.ws-display .dev-display-screen')[0];
      const pIn = s('.ws-phone .dev-scroll')[0], pFr = s('.ws-phone .dev-phone-screen')[0];
      const dF = s('.ws-display .dev-frame'), pF = s('.ws-phone .dev-frame');
      // browse: a tall page scrolls, or story frames crossfade
      const browse = (tl: gsap.core.Timeline, frames: Element[], inner: Element, frame: Element, at: number, span: number, k: number) => {
        if (story) frames.slice(1).forEach((f, i) => tl.to(f, { opacity: 1, duration: 0.05, ease: 'power1.inOut' }, at + (span * (i + 1)) / frames.length));
        else tl.fromTo(inner, { y: 0 }, { y: () => travel(inner, frame, k), duration: span }, at);
      };
      if (mobile) {
        const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: rig, start: 'top 80%', end: 'bottom 20%', scrub: true, invalidateOnRefresh: true } });
        browse(tl, dF, dIn, dFr, 0, 0.5, 0.45);
        browse(tl, pF, pIn, pFr, 0.3, 0.6, 0.45);
        gsap.from(s('.ws-copy > *'), { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: scene, start: 'top 72%' } });
        return;
      }
      // arrival, while the scene scrolls into view (the pinned part starts fully composed)
      gsap.timeline({ scrollTrigger: { trigger: scene, start: 'top 88%', end: 'top 8%', scrub: 0.6 } })
        .fromTo(disp, { y: 140, rotationX: 16, autoAlpha: 0 }, { y: 0, rotationX: 0, autoAlpha: 1, ease: 'power2.out' }, 0)
        .fromTo(s('.ws-copy > *'), { y: 44, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.07, ease: 'power2.out' }, 0.15);
      // the phone waits hidden behind the display: opaque from its first visible pixel
      gsap.set(phone, { xPercent: -70, z: -320, rotationY: 40 });
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: scene, start: 'top top', end: '+=200%', pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
      tl.fromTo(rig, { rotationY: -4, rotationX: 4 }, { rotationY: -12, rotationX: 1, duration: 1, ease: 'sine.inOut' }, 0);
      browse(tl, dF, dIn, dFr, 0, 0.36, 0.42);
      tl.to(disp, { xPercent: -15, z: -170, rotationY: 24, duration: 0.2, ease: 'power2.inOut' }, 0.38)
        .to(phone, { xPercent: 0, z: 90, rotationY: -8, duration: 0.22, ease: 'power3.out' }, 0.4)
        .to(s('.ws-mode b'), { yPercent: -50, duration: 0.06, ease: 'power2.inOut' }, 0.46);
      browse(tl, pF, pIn, pFr, 0.6, 0.36, 0.55);
      if (!story) tl.to(dIn, { y: () => travel(dIn, dFr, 0.62), duration: 0.36 }, 0.6);
    });
    gsap.from(q('.ws-more li'), { y: 40, autoAlpha: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: q('.ws-more')[0], start: 'top 75%' } });
  });

  const c = WORLD_COPY.websites;
  return (
    <div ref={root} className="ws" data-tone="light">
      <WorldIntro kicker={c.kicker} title={c.title} lede={c.lede} aside={<Display className="w-aside-display"><Frames list={dFrames('fudge-fix').slice(0, 1)} alt="" sizes="50vw" /></Display>} />
      {SITES.map((site, i) => <Scene key={site.slug} site={site} first={i === 0} />)}
      <section className="ws-more" aria-labelledby="ws-more-t">
        <h2 id="ws-more-t" className="ws-more-t">More work, live now.</h2>
        <ul>
          {MORE_SITES.map((m) => (
            <li key={m.slug}>
              <a href={m.url} target="_blank" rel="noopener" aria-label={`Visit ${m.name}'s website (opens in a new tab)`}>
                <Phone className="ws-more-phone" dark shot={{ ...work.m(m.slug), sizes: '200px', alt: `${m.name} website on mobile` }} />
                <b>{m.name}</b><span>{m.url.replace('https://', '')}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <WorldEnd {...props} line="Same brand, two compositions: one for the desk, one for the hand." />
    </div>
  );
}
