'use client';
// The hub's window (where the S was). Each gateway previews its world here: real work on a display and a phone,
// app concepts in hand, and the operating system behind a storefront.
import { Display, Phone, work } from './devices';
import { DmodaProduct, SnugMenu, FreeDrop } from './apps/screens';
import { Jarvis } from './systems/consoles';

export function Previews({ active }: { active: number }) {
  return (
    <div className="pv" data-active={active}>
      <div className={`pv-scene pv-web ${active === 0 ? 'is-on' : ''}`}>
        <Display className="pv-display" shot={{ src: '/work/fudge-fix-f1-1600.webp', sizes: '40vw', alt: '', eager: true }} />
        <Phone className="pv-phone" dark shot={{ src: '/work/fudge-fix-mf0-720.webp', sizes: '160px', alt: '' }} />
        <span className="pv-cap label">The Fudge Fix · desktop &amp; mobile</span>
      </div>
      <div className={`pv-scene pv-apps ${active === 1 ? 'is-on' : ''}`}>
        <Phone className="pv-a pv-a1"><SnugMenu /></Phone>
        <Phone className="pv-a pv-a2" dark><DmodaProduct /></Phone>
        <Phone className="pv-a pv-a3" dark><FreeDrop /></Phone>
        <span className="pv-cap label">Concepts · D’Moda · The Snug Mug · Free</span>
      </div>
      <div className={`pv-scene pv-sys ${active === 2 ? 'is-on' : ''}`}>
        <div className="pv-console"><Jarvis /></div>
        <span className="pv-cap label">D’Moda Jarvis · sample data</span>
      </div>
    </div>
  );
}
