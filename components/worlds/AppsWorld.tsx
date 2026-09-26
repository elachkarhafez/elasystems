'use client';
// World 02 — Apps. Three concepts, one pinned scene each. Three phones carry the flow; as you scroll the camera
// moves focus from one phone to the next (the focused screen comes forward, the others recede), the story line
// beside it advances, and one live moment lands (a pickup notice, a countdown, a "ready" card).
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { Phone } from '../devices';
import { DmodaBag, DmodaHome, DmodaProduct, FreeDrop, FreeMember, FreeProduct, SnugCustomize, SnugMenu, SnugRewards } from '../apps/screens';
import { WORLD_COPY } from '@/lib/content';
import { useWorld, arrive } from '@/lib/useWorld';
import { WorldEnd, WorldIntro, type WorldProps } from './shared';
import './apps-world.css';

type Step = { t: string; d: string };
const APPS: { id: string; name: string; kind: string; bg: string; ink: string; accent: string; dark?: boolean; steps: Step[] }[] = [
  {
    id: 'dmoda', name: 'D’Moda Shoes', kind: 'Shopping app · concept', bg: '#EDE6DC', ink: '#141414', accent: '#D71920',
    steps: [
      { t: 'Browse the edit', d: 'Heels, boots, sandals and flats from the real catalogue, one thumb away.' },
      { t: 'Every size, one tap', d: 'Colour, size and stock on a single screen. Add to bag without hunting.' },
      { t: 'Pick up at the mall', d: 'Order in the app, collect at Franklin Park Mall. The phone tells you when it’s ready.' },
    ],
  },
  {
    id: 'free', name: 'Free Apparel', kind: 'Drops & membership · concept', bg: '#111112', ink: '#F1ECE2', accent: '#FF4D1A', dark: true,
    steps: [
      { t: 'The drop is the event', d: 'A countdown that customers set alarms for, and a notification when it opens.' },
      { t: 'Members shop first', d: 'Early access turns a mailing list into a reason to join.' },
      { t: 'Points that bring them back', d: 'Every order moves them closer to the next level.' },
    ],
  },
  {
    id: 'snug', name: 'The Snug Mug', kind: 'Order ahead & rewards · concept', bg: '#EFE2C6', ink: '#20120D', accent: '#B69A3A',
    steps: [
      { t: 'Order ahead', d: 'The real menu, led by the Honey Bear Latte. Skip the line on the way in.' },
      { t: 'Made the way they like it', d: 'Size, iced or warm, milk. Priced as they build it.' },
      { t: 'Every cup counts', d: 'A stamp card that lives on the phone, and a ping when the order is ready.' },
    ],
  },
];

function Screens({ id, live, t }: { id: string; live: boolean; t: string }) {
  if (id === 'dmoda') return [<DmodaHome key="a" />, <DmodaProduct key="b" />, <DmodaBag key="c" ready={live} />];
  if (id === 'free') return [<FreeDrop key="a" t={t} />, <FreeProduct key="b" />, <FreeMember key="c" />];
  return [<SnugMenu key="a" />, <SnugCustomize key="b" />, <SnugRewards key="c" ready={live} />];
}

export default function AppsWorld(props: WorldProps) {
  const root = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<Record<string, boolean>>({});

  useWorld(root, ({ mobile, reduced }, q) => {
    arrive(q, reduced);
    if (reduced) {
      setLive({ dmoda: true, snug: true });
      // a still fan: all three screens visible, every step readable
      if (!mobile) q('.ap-scene').forEach((scene) => {
        const s = gsap.utils.selector(scene);
        s('.ap-phone').forEach((ph, i) => { const d = i - 1; gsap.set(ph, { xPercent: d * 64, z: -Math.abs(d) * 260, rotationY: -d * 16, scale: 1 - Math.abs(d) * 0.06, zIndex: 10 - Math.abs(d) * 3 }); });
        s('.ap-step').forEach((st) => st.classList.add('is-on'));
      });
      return;
    }
    q('.ap-scene').forEach((scene) => {
      const s = gsap.utils.selector(scene);
      const id = (scene as HTMLElement).dataset.app!;
      const phones = s('.ap-phone');
      const steps = s('.ap-step');
      if (mobile) {
        gsap.from(s('.ap-copy > *'), { y: 24, autoAlpha: 0, stagger: 0.07, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: scene, start: 'top 72%' } });
        gsap.from(phones, { y: 60, autoAlpha: 0, stagger: 0.1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: s('.ap-rig')[0], start: 'top 80%', onEnter: () => setLive((l) => ({ ...l, [id]: true })) } });
        return;
      }
      // focus: which phone the camera is on (0 → 1 → 2), eased between
      const focus = { f: 0 };
      const layout = () => {
        phones.forEach((ph, i) => {
          const d = i - focus.f, a = Math.abs(d);
          gsap.set(ph, { xPercent: d * 64, z: -a * 260, rotationY: -d * 16, scale: 1 - Math.min(a, 1.4) * 0.06, zIndex: 10 - Math.round(a * 3), filter: `brightness(${1 - Math.min(a, 1) * 0.22})` });
        });
        const k = Math.round(focus.f);
        steps.forEach((st, i) => st.classList.toggle('is-on', i === k));
      };
      layout();
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: scene, start: 'top top', end: '+=240%', pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (st) => {
            if (id === 'free') {
              // the countdown runs with the scroll (written straight to the DOM: no re-render per frame)
              const secs = Math.round(8077 - st.progress * 1800);
              const v = [Math.floor(secs / 3600), Math.floor((secs % 3600) / 60), secs % 60].map((n) => String(n).padStart(2, '0'));
              s('[data-clock]').forEach((el) => { const i = +(el as HTMLElement).dataset.clock!; if (el.textContent !== v[i]) el.textContent = v[i]; });
            }
            const on = st.progress > 0.78;
            setLive((l) => (l[id] === on ? l : { ...l, [id]: on }));
          },
        },
      });
      gsap.timeline({ scrollTrigger: { trigger: scene, start: 'top 85%', end: 'top 15%', scrub: 0.6 } })
        .fromTo(s('.ap-rig')[0], { y: 120, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: 'power2.out' }, 0)
        .fromTo(s('.ap-copy > *'), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, ease: 'power2.out' }, 0.1);
      tl.to(focus, { f: 1, duration: 0.22, ease: 'power2.inOut', onUpdate: layout }, 0.2)
        .to(focus, { f: 2, duration: 0.22, ease: 'power2.inOut', onUpdate: layout }, 0.52)
        .to({}, { duration: 0.08 }, 0.92); // hold the last app; the next scene scrolls in over it
    });
  });

  const c = WORLD_COPY.apps;
  return (
    <div ref={root} className="ap" data-tone="light">
      <WorldIntro kicker={c.kicker} title={c.title} lede={c.lede} note={c.note} aside={
        <div className="ap-aside">
          <Phone className="ap-aside-p ap-aside-1" dark><SnugMenu /></Phone>
          <Phone className="ap-aside-p ap-aside-2" dark><DmodaProduct /></Phone>
          <Phone className="ap-aside-p ap-aside-3" dark><FreeDrop /></Phone>
        </div>
      } />
      {APPS.map((app) => (
        <section key={app.id} className={`ap-scene ${app.dark ? 'is-dark' : ''}`} data-app={app.id} data-tone={app.dark ? 'dark' : 'light'} style={{ ['--bg' as string]: app.bg, ['--ink3' as string]: app.ink, ['--acc' as string]: app.accent }} aria-labelledby={`ap-${app.id}`}>
          <div className="ap-stage">
            <div className="ap-copy">
              <p className="label ap-kind">{app.kind}</p>
              <h2 id={`ap-${app.id}`} className="ap-name">{app.name}</h2>
              <ol className="ap-steps">
                {app.steps.map((st, i) => (
                  <li key={st.t} className={`ap-step ${i === 0 ? 'is-on' : ''}`}><span className="ap-step-n">0{i + 1}</span><div><b>{st.t}</b><p>{st.d}</p></div></li>
                ))}
              </ol>
            </div>
            <div className="ap-rig">
              {Screens({ id: app.id, live: !!live[app.id], t: '02:14:37' }).map((scr, i) => (
                <Phone key={i} className="ap-phone" dark>{scr}</Phone>
              ))}
            </div>
          </div>
        </section>
      ))}
      <WorldEnd {...props} line="An app earns a place on the home screen when it saves the customer a step. That’s the brief we design to." />
    </div>
  );
}
