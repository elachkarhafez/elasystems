'use client';
// World 03 — Systems. Front → back. Each scene starts on the public side (a storefront, a booking site, a contact
// form) and turns it around to show the system that runs behind it. States change on scroll (class toggles, not
// re-renders), and every figure is sample data.
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Display, Phone, work } from '../devices';
import { Bounce, Jarvis, LeadFlow, LeadForm } from '../systems/consoles';
import { WORLD_COPY } from '@/lib/content';
import { useWorld, arrive } from '@/lib/useWorld';
import { WorldEnd, WorldIntro, type WorldProps } from './shared';
import './systems-world.css';

const SCENES = [
  { id: 'jarvis', client: 'D’Moda Shoes', name: 'D’Moda Jarvis', kind: 'Private operating system · built for the store',
    front: 'The storefront', back: 'The system behind it',
    points: ['Sales, inventory and customers mirrored from the store, read-only', 'A daily plan with evidence and confidence', 'Nothing changes without an approval and an audit trail'] },
  { id: 'bounce', client: 'Bounce It Up', name: 'Staff dashboard', kind: 'Bookings · waivers · memberships',
    front: 'Parents book online', back: 'The front desk sees it land',
    points: ['Party bookings from the website, on one schedule', 'Waivers signed before families arrive', 'Check-in in a tap, memberships at a glance'] },
  { id: 'lead', client: 'Any business', name: 'Lead → pipeline', kind: 'Forms · CRM · automations',
    front: 'A customer fills in a form', back: 'The business answers in seconds',
    points: ['Every enquiry becomes a card on a pipeline', 'An instant text reply and an owner alert', 'Follow-ups that don’t depend on memory'] },
];

// where the public side steps to once the system behind it comes forward
const INSET: Record<string, gsap.TweenVars> = { jarvis: { xPercent: -10, yPercent: 30, scale: 0.4 }, bounce: { xPercent: -30, yPercent: 16, scale: 0.6 }, lead: { xPercent: -20, yPercent: 26, scale: 0.56 } };

const CAPS = ['Dashboards & operating systems', 'Order & inventory management', 'Booking & scheduling', 'CRM & pipelines', 'Reporting & analytics', 'Automations & AI assistants'];

export default function SystemsWorld(props: WorldProps) {
  const root = useRef<HTMLDivElement>(null);
  useWorld(root, ({ mobile, reduced }, q) => {
    arrive(q, reduced);
    const tick = (els: Element[], cls: string, n: number) => els.forEach((e, i) => e.classList.toggle(cls, i < n));
    if (reduced) {
      // the finished state of each scene: the public side inset, the system behind it in full view
      q('.sy-scene').forEach((sc) => {
        const s = gsap.utils.selector(sc), id = (sc as HTMLElement).dataset.sys!;
        tick(s('.jv-task'), 'is-done', 3); tick(s('.bu-guest'), 'is-in', 5); tick(s('.lf-step'), 'is-done', 3); s('.lf-form').forEach((f) => f.classList.add('is-sent'));
        if (!mobile) { gsap.set(s('.sy-front'), { ...INSET[id], z: 160 }); gsap.set(s('.sy-side, .sy-point'), { autoAlpha: 1, y: 0 }); }
      });
      return;
    }
    q('.sy-scene').forEach((scene) => {
      const s = gsap.utils.selector(scene);
      const id = (scene as HTMLElement).dataset.sys!;
      const front = s('.sy-front')[0], back = s('.sy-back')[0];
      const panels = s('.jv-kpi, .jv-plan, .jv-chart, .bu-kpis > div, .bu-sched, .bu-list, .lf-col, .lf-auto');
      // progress-driven states (reverse scroll replays them)
      const states = (p: number) => {
        if (id === 'jarvis') tick(s('.jv-task'), 'is-done', p > 0.86 ? 3 : p > 0.76 ? 2 : p > 0.66 ? 1 : 0);
        if (id === 'bounce') tick(s('.bu-guest'), 'is-in', Math.max(0, Math.min(5, Math.floor((p - 0.55) / 0.07))));
        if (id === 'lead') {
          s('.lf-form').forEach((f) => f.classList.toggle('is-sent', p > 0.3));
          tick(s('.lf-step'), 'is-done', p > 0.82 ? 3 : p > 0.72 ? 2 : p > 0.62 ? 1 : 0);
          const stage = p > 0.86 ? 1 : 0;
          s('.lf-col').forEach((col, i) => col.classList.toggle('has-new', i === stage));
        }
      };
      if (mobile) {
        ScrollTriggerOnce(scene, (p) => states(p));
        gsap.from(s('.sy-copy > *'), { y: 24, autoAlpha: 0, stagger: 0.07, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: scene, start: 'top 72%' } });
        return;
      }
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: scene, start: 'top top', end: '+=260%', pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: (st) => states(st.progress) },
      });
      gsap.timeline({ scrollTrigger: { trigger: scene, start: 'top 85%', end: 'top 15%', scrub: 0.6 } })
        .fromTo(s('.sy-copy > :not(.sy-points)'), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, ease: 'power2.out' }, 0.1)
        .fromTo(front, { y: 110, autoAlpha: 0, rotationX: 12 }, { y: 0, autoAlpha: 1, rotationX: 0, ease: 'power2.out' }, 0)
        .fromTo(s('.sy-side-front'), { autoAlpha: 0 }, { autoAlpha: 1 }, 0.4);
      // the turn: the public side steps down to an inset over the system's corner; the system assembles behind it
      tl.to(front, { ...INSET[id], z: 160, rotationY: 0, duration: 0.22, ease: 'power3.inOut' }, 0.06)
        .to(s('.sy-side-front'), { autoAlpha: 0.5, duration: 0.1 }, 0.08)
        .fromTo(back, { xPercent: 8, z: -220, rotationY: -16, autoAlpha: 0 }, { xPercent: 0, z: 0, rotationY: -4, autoAlpha: 1, duration: 0.22, ease: 'power3.out' }, 0.12)
        .fromTo(panels, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, stagger: 0.012, ease: 'power2.out' }, 0.2)
        .to(s('.sy-side-back'), { autoAlpha: 1, duration: 0.05 }, 0.24)
        .to(s('.sy-point'), { autoAlpha: 1, y: 0, duration: 0.06, stagger: 0.07, ease: 'power2.out' }, 0.32)
        .to({}, { duration: 0.07 }, 0.93); // hold the finished system; the next scene scrolls in over it
    });
    gsap.from(q('.sy-caps li'), { y: 30, autoAlpha: 0, stagger: 0.06, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: q('.sy-caps')[0], start: 'top 78%' } });
  });

  const c = WORLD_COPY.systems;
  return (
    <div ref={root} className="sy" data-tone="dark">
      <WorldIntro kicker={c.kicker} title={c.title} lede={c.lede} note={c.note} aside={
        <div className="sy-aside">
          <div className="sy-aside-console"><Jarvis /></div>
          <Display className="sy-aside-front" shot={{ ...work.d('dmoda-shoes'), sizes: '20vw', alt: '' }} />
        </div>
      } />
      {SCENES.map((sc) => (
        <section key={sc.id} className={`sy-scene sy-${sc.id}`} data-sys={sc.id} data-tone="dark" aria-labelledby={`sy-${sc.id}`}>
          <div className="sy-stage">
            <div className="sy-copy">
              <p className="label sy-client">{sc.client}</p>
              <h2 id={`sy-${sc.id}`} className="sy-name">{sc.name}</h2>
              <p className="sy-kind">{sc.kind}</p>
              <ul className="sy-points">{sc.points.map((pt) => <li key={pt} className="sy-point">{pt}</li>)}</ul>
            </div>
            <div className="sy-rig">
              <span className="sy-side sy-side-front label">{sc.front}</span>
              <span className="sy-side sy-side-back label">{sc.back}</span>
                            {sc.id === 'jarvis' && <Display className="sy-front" shot={{ ...work.d('dmoda-shoes'), sizes: '40vw', alt: 'D’Moda Shoes storefront website' }} />}
              {sc.id === 'bounce' && <Phone className="sy-front sy-front-phone" dark shot={{ ...work.m('bounce-it-up'), sizes: '240px', alt: 'Bounce It Up website on a phone' }} />}
              {sc.id === 'lead' && <div className="sy-front sy-front-form"><LeadForm /></div>}
              <div className="sy-back sy-screen">
                {sc.id === 'jarvis' && <Jarvis />}
                {sc.id === 'bounce' && <Bounce checked={0} />}
                {sc.id === 'lead' && <LeadFlow stage={0} />}
              </div>
            </div>
          </div>
        </section>
      ))}
      <section className="sy-caps-wrap" aria-labelledby="sy-caps-t">
        <h2 id="sy-caps-t" className="sy-caps-t">What we build behind the site.</h2>
        <ul className="sy-caps">{CAPS.map((cap) => (<li key={cap}><i aria-hidden="true" />{cap}</li>))}</ul>
      </section>
      <WorldEnd {...props} line="The site brings the customer in. The system is what makes the business easier to run once they’re there." />
    </div>
  );
}

// mobile: states follow the scene through the viewport, no pinning
function ScrollTriggerOnce(trigger: Element, onP: (p: number) => void) {
  ScrollTrigger.create({ trigger, start: 'top 70%', end: 'bottom 30%', onUpdate: (st) => onP(st.progress) });
}
