// App concept screens. Designed at 390×844; 1em = 10 design px (the phone screen sets font-size from its width),
// so every screen renders crisp at any device size. Product names, prices and menu items are the clients' own
// (captured from their live sites 2026-09-24); the apps themselves are concepts.
import type { ReactNode } from 'react';

const Status = ({ dark }: { dark?: boolean }) => (
  <div className={`as-status ${dark ? 'is-dark' : ''}`} aria-hidden="true">
    <span>9:41</span>
    <span className="as-status-icons"><i /><i /><b /></span>
  </div>
);
const Icon = ({ d, size = 2.2 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={`${size}em`} height={`${size}em`} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const I = {
  bag: 'M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2',
  search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 4 4',
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  menu: 'M4 7h16M4 12h16M4 17h10',
  back: 'M15 5 8 12l7 7',
  pin: 'M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11Zm0-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  check: 'M5 12.5 10 17l9-10',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Zm4 4h4',
  star: 'm12 4 2.4 5 5.5.6-4.1 3.8 1.1 5.4L12 16.1 7.1 18.8l1.1-5.4L4.1 9.6 9.6 9 12 4Z',
  cup: 'M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8Zm11 2h2a2 2 0 0 1 0 4h-2M8 3v2m3-2v2',
};

export function Screen({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`as ${className}`}>{children}</div>;
}

/* ─────────────────────────────── D’MODA SHOES ─────────────────────────────── */
const DM_TABS = (active: number) => (
  <nav className="dm-tabs" aria-hidden="true">
    {[I.home, I.search, I.heart, I.bag].map((d, i) => (<span key={i} className={i === active ? 'on' : ''}><Icon d={d} /></span>))}
  </nav>
);
export const DmodaHome = () => (
  <Screen className="dm">
    <Status />
    <header className="dm-top"><Icon d={I.menu} /><b className="dm-logo">D’MODA</b><span className="dm-bagicon"><Icon d={I.bag} /><i>1</i></span></header>
    <div className="dm-search"><Icon d={I.search} size={1.8} /> Search heels, boots, sandals</div>
    <div className="dm-hero">
      <div><p className="dm-eyebrow">New in · Heels</p><p className="dm-hero-t">The detail that sets the mood.</p><span className="dm-link">Shop heels →</span></div>
      <img src="/apps/dmoda-berlin-edge.webp" alt="" />
    </div>
    <div className="dm-chips">{['Heels', 'Boots', 'Sandals', 'Flats', 'Sale'].map((c, i) => <span key={c} className={i === 0 ? 'on' : ''}>{c}</span>)}</div>
    <div className="dm-grid">
      {[['chaya-pulse', 'Chaya Pulse', '$49.99'], ['celina-muse', 'Celina Muse', '$59.99'], ['nicky-mode', 'Nicky Mode', '$59.99'], ['cynthia-sculpt', 'Cynthia Sculpt', '$44.99']].map(([s, n, p]) => (
        <div className="dm-card" key={s}><div className="dm-card-img"><img src={`/apps/dmoda-${s}.webp`} alt="" /><span className="dm-heart"><Icon d={I.heart} size={1.6} /></span></div><p>{n}</p><b>{p}</b></div>
      ))}
    </div>
    {DM_TABS(0)}
  </Screen>
);
export const DmodaProduct = () => (
  <Screen className="dm">
    <Status />
    <header className="dm-top"><Icon d={I.back} /><b className="dm-logo">D’MODA</b><span className="dm-bagicon"><Icon d={I.heart} /></span></header>
    <div className="dm-pdp-img"><img src="/apps/dmoda-berlin-edge.webp" alt="" /><span className="dm-dots"><i className="on" /><i /><i /><i /></span></div>
    <div className="dm-pdp">
      <p className="dm-eyebrow">Heels</p>
      <div className="dm-pdp-row"><h4>Berlin Edge</h4><b>$49.99</b></div>
      <p className="dm-stock">● In stock</p>
      <p className="dm-lbl">Color</p>
      <div className="dm-sw">{['#171717', '#C9CBD0', '#D9B36C', '#E3A9B6'].map((c, i) => <i key={c} className={i === 0 ? 'on' : ''} style={{ background: c }} />)}</div>
      <p className="dm-lbl">Size</p>
      <div className="dm-sizes">{['6', '6.5', '7', '7.5', '8', '8.5', '9', '10'].map((s) => <span key={s} className={s === '8.5' ? 'on' : ''}>{s}</span>)}</div>
      <button className="dm-cta" tabIndex={-1}>Add to bag</button>
      <p className="dm-pick"><Icon d={I.pin} size={1.5} /> Pick up at Franklin Park Mall</p>
    </div>
  </Screen>
);
export const DmodaBag = ({ ready = false }: { ready?: boolean }) => (
  <Screen className="dm">
    <Status />
    <header className="dm-top"><Icon d={I.back} /><b className="dm-logo">Your bag</b><span /></header>
    <div className="dm-line"><img src="/apps/dmoda-berlin-edge.webp" alt="" /><div><b>Berlin Edge</b><p>Black · Size 8.5</p><p>Qty 1</p></div><b>$49.99</b></div>
    <p className="dm-lbl dm-pad">How do you want it?</p>
    <div className="dm-seg"><span className="on">Pick up in store</span><span>Ship to me</span></div>
    <div className="dm-store"><Icon d={I.pin} size={1.8} /><div><b>D’Moda Shoes</b><p>Franklin Park Mall · Toledo, OH</p></div></div>
    <div className="dm-total"><span>Total</span><b>$49.99</b></div>
    <button className="dm-cta dm-red" tabIndex={-1}>Place order</button>
    <div className={`as-toast ${ready ? 'is-on' : ''}`}>
      <span className="as-toast-app">D’MODA</span>
      <b>Ready for pickup</b>
      <p>Your Berlin Edge is waiting at Franklin Park Mall.</p>
    </div>
  </Screen>
);

/* ─────────────────────────────── FREE APPAREL ─────────────────────────────── */
const Tee = ({ color = '#141414', ink = '#F1ECE2', label = 'FREE' }: { color?: string; ink?: string; label?: string }) => (
  <svg viewBox="0 0 200 210" className="fa-tee" aria-hidden="true">
    <path d="M62 14 40 22 6 46l18 38 20-10v126h112V74l20 10 18-38-34-24-22-8c-4 14-20 24-38 24S66 28 62 14Z" fill={color} />
    <path d="M62 14c4 14 20 24 38 24s34-10 38-24" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="3" />
    <text x="100" y="112" textAnchor="middle" fontSize="34" fontWeight="900" fill={ink} style={{ fontStretch: '125%', letterSpacing: '.02em' }}>{label}</text>
    <text x="100" y="132" textAnchor="middle" fontSize="8" fontWeight="600" fill={ink} opacity=".7" style={{ letterSpacing: '.3em' }}>APPAREL · 04</text>
  </svg>
);
export const FreeDrop = ({ t = '02:14:37' }: { t?: string }) => (
  <Screen className="fa fa-dark">
    <Status dark />
    <header className="fa-top"><b>FREE</b><span>Drop 04</span></header>
    <div className="fa-drop">
      <p className="fa-k">Next drop in</p>
      <p className="fa-clock">{t.split(':').map((n, i) => (<span key={i}><b data-clock={i}>{n}</b><i>{['hrs', 'min', 'sec'][i]}</i></span>))}</p>
      <div className="fa-stage"><Tee /></div>
      <p className="fa-name">Signal Tee</p>
      <p className="fa-sub">Heavyweight cotton · limited run</p>
    </div>
    <button className="fa-cta" tabIndex={-1}><Icon d={I.bell} size={1.8} /> Notify me</button>
    <p className="fa-note">Members shop 24 hours early.</p>
  </Screen>
);
export const FreeProduct = () => (
  <Screen className="fa">
    <Status />
    <header className="fa-top"><Icon d={I.back} /><b>FREE</b><Icon d={I.bag} /></header>
    <div className="fa-pdp"><Tee color="#1B1B1B" /></div>
    <div className="fa-colors">{['#1B1B1B', '#E9E4D8', '#6E7B5C', '#C8452E'].map((c, i) => <i key={c} className={i === 0 ? 'on' : ''} style={{ background: c }} />)}</div>
    <div className="fa-body">
      <div className="fa-row"><h4>Signal Tee</h4><b>$38</b></div>
      <p className="fa-sub">Washed black · boxy fit</p>
      <div className="fa-sizes">{['S', 'M', 'L', 'XL'].map((s) => <span key={s} className={s === 'L' ? 'on' : ''}>{s}</span>)}</div>
      <button className="fa-cta fa-cta-ink" tabIndex={-1}>Add to bag</button>
      <p className="fa-note">Early access unlocked · Member</p>
    </div>
  </Screen>
);
export const FreeMember = () => (
  <Screen className="fa">
    <Status />
    <header className="fa-top"><span /><b>Membership</b><Icon d={I.user} /></header>
    <div className="fa-card">
      <b className="fa-card-logo">FREE</b>
      <span className="fa-card-tier">Member · Level 2</span>
      <div className="fa-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" /><circle cx="50" cy="50" r="42" className="fa-ring-on" /></svg><p><b>640</b><i>/ 1000 pts</i></p></div>
    </div>
    <ul className="fa-perks">
      <li><Icon d={I.bell} size={1.8} /><div><b>24h early access</b><p>Every drop, before it goes public.</p></div></li>
      <li><Icon d={I.star} size={1.8} /><div><b>Points on every order</b><p>360 more to Level 3.</p></div></li>
      <li><Icon d={I.heart} size={1.8} /><div><b>Saved pieces</b><p>We’ll tell you when your size restocks.</p></div></li>
    </ul>
  </Screen>
);

/* ─────────────────────────────── THE SNUG MUG ─────────────────────────────── */
export const SnugMenu = () => (
  <Screen className="sm">
    <Status />
    <header className="sm-top"><img src="/apps/snug-bear.webp" alt="" /><div><p>Good morning</p><b>Order ahead</b></div><span className="sm-bag"><Icon d={I.cup} /></span></header>
    <div className="sm-chips">{['Specialty', 'Lattes', 'Matcha', 'Refreshers', 'Treats'].map((c, i) => <span key={c} className={i === 0 ? 'on' : ''}>{c}</span>)}</div>
    <div className="sm-feature">
      <img src="/apps/snug-honey-bear.webp" alt="" />
      <div className="sm-feature-t"><p className="sm-k">Signature drink</p><h4>Honey Bear Latte</h4><p className="sm-i">Served iced or warm</p><b>from $7.50</b></div>
    </div>
    <p className="sm-lbl">Made to order</p>
    <ul className="sm-list">
      {['Brown butter', 'Wildflower honey', 'Vanilla bean', 'Honey cold foam'].map((x) => <li key={x}>{x}</li>)}
    </ul>
    <nav className="sm-tabs" aria-hidden="true"><span className="on"><Icon d={I.cup} /></span><span><Icon d={I.star} /></span><span><Icon d={I.pin} /></span><span><Icon d={I.user} /></span></nav>
  </Screen>
);
export const SnugCustomize = () => (
  <Screen className="sm">
    <Status />
    <header className="sm-top sm-top-bar"><Icon d={I.back} /><b>Honey Bear Latte</b><span /></header>
    <div className="sm-hero"><img src="/apps/snug-honey-bear.webp" alt="" /></div>
    <div className="sm-body">
      <p className="sm-lbl">Size</p>
      <div className="sm-seg"><span className="on"><b>16 oz</b><i>$7.50</i></span><span><b>20 oz</b><i>$8.50</i></span></div>
      <p className="sm-lbl">Served</p>
      <div className="sm-seg"><span className="on"><b>Iced</b></span><span><b>Warm</b></span></div>
      <p className="sm-lbl">Milk</p>
      <div className="sm-pills"><span className="on">Oat milk</span><span>Whole</span><span>Almond</span></div>
      <button className="sm-cta" tabIndex={-1}>Add to order · $7.50</button>
    </div>
  </Screen>
);
export const SnugRewards = ({ stamps = 7, ready = false }: { stamps?: number; ready?: boolean }) => (
  <Screen className="sm">
    <Status />
    <header className="sm-top sm-top-bar"><span /><b>Rewards</b><span /></header>
    <div className="sm-card">
      <p className="sm-k">The Snug Mug</p>
      <p className="sm-card-t">{10 - stamps} more for a free drink</p>
      <div className="sm-stamps">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < stamps ? 'on' : ''}>{i < stamps ? <img src="/apps/snug-bear.webp" alt="" /> : null}</i>)}</div>
    </div>
    <div className={`sm-ready ${ready ? 'is-on' : ''}`}>
      <span className="sm-ready-dot" />
      <div><b>Ready at the counter</b><p>Honey Bear Latte · 16 oz · iced</p></div>
      <span className="sm-code">A-27</span>
    </div>
    <p className="sm-lbl sm-pad">Recent</p>
    <ul className="sm-recent"><li><span>Honey Bear Latte</span><b>+1 stamp</b></li><li><span>Iced matcha</span><b>+1 stamp</b></li></ul>
  </Screen>
);
