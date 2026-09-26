// System interfaces, recreated for illustration. Module names come from the real products (D'Moda Jarvis source,
// Bounce It Up's staff dashboard); every figure is sample data. Designed at 1280×800; 1em = 10 design px.
import type { ReactNode } from 'react';

const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="1.6em" height="1.6em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const P = {
  today: 'M4 6h16v14H4zM4 10h16M9 3v4m6-4v4', sales: 'M4 19V5m0 14h16M8 15l4-5 3 3 5-6', box: 'M4 8l8-4 8 4v8l-8 4-8-4V8Zm0 0 8 4 8-4M12 12v8',
  tag: 'M3 12V4h8l10 10-8 8L3 12Zm5-5h.01', users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 9a6 6 0 0 1 12 0m2-9a3 3 0 1 0 0-6m3 15a5 5 0 0 0-4-5',
  mega: 'M4 10v4h3l6 4V6L7 10H4Zm13-1a4 4 0 0 1 0 6', film: 'M4 5h16v14H4zM8 5v14M16 5v14M4 9h4m8 0h4M4 15h4m8 0h4', check: 'M5 12.5 10 17l9-10',
  spark: 'M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M6 18l2.5-2.5m7-7L18 6', cal: 'M4 6h16v14H4zM4 10h16M9 3v4m6-4v4', doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5',
  card: 'M3 7h18v11H3zM3 11h18', party: 'M4 20 9 7l8 8-13 5Zm9-15 1 2m4-1-2 1m3 4-2-1',
};

export function Console({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`cs ${className}`}>{children}</div>;
}

/* ───────────── D’Moda Jarvis: the operating system behind the store ───────────── */
export const Jarvis = ({ step = 0 }: { step?: number }) => (
  <Console className="jv">
    <aside className="jv-side">
      <b className="jv-brand">D’Moda <span>Jarvis</span></b>
      {[['today', 'Today'], ['sales', 'Sales'], ['box', 'Inventory'], ['tag', 'Catalog'], ['users', 'Customers'], ['mega', 'Campaigns'], ['film', 'Content'], ['check', 'Approvals'], ['spark', 'Jarvis']].map(([k, n], i) => (
        <span key={n} className={`jv-nav ${i === 0 ? 'on' : ''}`}><Ico d={P[k as keyof typeof P]} />{n}{n === 'Approvals' ? <i>2</i> : null}</span>
      ))}
      <span className="jv-ro">Read-only to Shopify · every change needs approval</span>
    </aside>
    <main className="jv-main">
      <header className="jv-head"><div><p className="jv-k">Today</p><h4>Good morning. Three things matter today.</h4></div><span className="jv-sync">● Synced 6 min ago</span></header>
      <div className="jv-kpis">
        {[['Sales this week', '$8,420', '+12%'], ['Orders', '164', '+9%'], ['Avg. order', '$51.34', '+3%'], ['Low stock', '7 styles', 'watch']].map(([l, v, d], i) => (
          <div key={l} className={`jv-kpi ${i === 3 ? 'is-warn' : ''}`}><p>{l}</p><b>{v}</b><i>{d}</i></div>
        ))}
      </div>
      <div className="jv-row">
        <section className="jv-plan">
          <p className="jv-k">Operating plan</p>
          {[
            ['Restock Berlin Edge, black 8.5', 'Sells through in about 6 days at the current pace.', 'High confidence'],
            ['Feature heels in Saturday’s post', 'Three styles above the margin floor, all in stock.', 'Medium'],
            ['Approve: flats promotion', 'Inside the discount guardrail. Needs your OK.', 'Needs approval'],
          ].map(([t, d, c], i) => (
            <div key={t} className={`jv-task ${step > i ? 'is-done' : ''}`}><span className="jv-tick"><Ico d={P.check} /></span><div><b>{t}</b><p>{d}</p></div><em>{c}</em></div>
          ))}
        </section>
        <section className="jv-chart">
          <p className="jv-k">Sales · last 14 days</p>
          <div className="jv-bars">{[42, 55, 38, 61, 70, 52, 88, 47, 58, 64, 49, 72, 81, 94].map((h, i) => <i key={i} style={{ height: `${h}%` }} className={i > 10 ? 'hi' : ''} />)}</div>
          <div className="jv-ask"><span className="jv-ask-q">What sold best this week?</span><span className="jv-ask-a"><b>Jarvis</b> Heels led: 38% of units, Berlin Edge first. <i>3 sources</i></span></div>
        </section>
      </div>
    </main>
  </Console>
);

/* ───────────── Bounce It Up: staff dashboard (bookings · waivers · memberships) ───────────── */
const ROOMS = [
  { r: 'Party Room A', blocks: [[1, 2.5, 'Ava’s 7th · 18 kids'], [4, 5.5, 'Mason · 12 kids']] },
  { r: 'Party Room B', blocks: [[2, 3.5, 'Leila · 22 kids'], [5, 6.5, 'Team party']] },
  { r: 'Open play', blocks: [[0, 7, 'Open play · walk-ins']] },
];
export const Bounce = ({ checked = 3 }: { checked?: number }) => (
  <Console className="bu">
    <header className="bu-top"><b>Bounce <span>It Up</span></b><em>Staff</em><nav>{['Today', 'Bookings', 'Waivers', 'Memberships'].map((n, i) => <span key={n} className={i === 0 ? 'on' : ''}>{n}</span>)}</nav><span className="bu-user">Front desk</span></header>
    <div className="bu-kpis">
      {[['Parties today', '4'], ['Waivers signed', '61'], ['Checked in', `${38 + checked}`], ['Members active', '112']].map(([l, v]) => (<div key={l}><p>{l}</p><b>{v}</b></div>))}
    </div>
    <section className="bu-sched">
      <div className="bu-hours">{['11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p'].map((h) => <span key={h}>{h}</span>)}</div>
      {ROOMS.map((room) => (
        <div className="bu-room" key={room.r}><p>{room.r}</p><div className="bu-lane">{room.blocks.map(([a, b, t]) => (
          <span key={t as string} className="bu-block" style={{ left: `${((a as number) / 7) * 100}%`, width: `${(((b as number) - (a as number)) / 7) * 100}%` }}>{t}</span>
        ))}</div></div>
      ))}
      <span className="bu-now" style={{ left: '38%' }}><i>Now</i></span>
    </section>
    <section className="bu-list">
      <p className="bu-k">Arrivals · Ava’s 7th</p>
      {['Ava M.', 'Noah R.', 'Zain K.', 'Maya T.', 'Ellie P.'].map((n, i) => (
        <div key={n} className={`bu-guest ${i < checked ? 'is-in' : ''}`}><span>{n}</span><em>{i < checked ? 'Checked in' : 'Waiver on file'}</em></div>
      ))}
    </section>
  </Console>
);

/* ───────────── Lead → pipeline → automation ───────────── */
export const LeadFlow = ({ stage = 0 }: { stage?: number }) => {
  void stage;
  const cols = ['New', 'Contacted', 'Proposal', 'Won'];
  return (
    <Console className="lf">
      <header className="lf-top"><b>Pipeline</b><span>All leads · this month</span></header>
      <div className="lf-board">
        {cols.map((c, ci) => (
          <div key={c} className={`lf-col ${ci === stage ? 'has-new' : ''}`}>
            <p>{c}<i>{[3, 2, 2, 1][ci]}</i></p>
            {/* the new lead: one copy per column, the scroll shows it in the column it has reached */}
            <div className="lf-card is-hot"><b>Corner café, Dearborn</b><span>Website + ordering</span><em>{['Just now', 'Texted back · 2 min', 'Proposal sent', 'Signed'][ci]}</em></div>
            {[['Barbershop', 'Booking site'], ['Food truck', 'Menu + app'], ['Boutique', 'Store + system']].slice(0, [2, 1, 1, 1][ci]).map(([n, s]) => (
              <div key={n} className="lf-card"><b>{n}</b><span>{s}</span></div>
            ))}
          </div>
        ))}
      </div>
      <div className="lf-auto">
        <p className="lf-k">Automations on this lead</p>
        {[['Instant text reply', 'Sent the moment the form arrives'], ['Owner alert', 'Text + email to the owner'], ['Follow-up', 'Reminder in 2 days if no reply']].map(([t, d], i) => (
          <div key={t} className={`lf-step ${stage > i ? 'is-done' : ''}`}><span /><div><b>{t}</b><p>{d}</p></div></div>
        ))}
      </div>
    </Console>
  );
};

/* the public side of the lead flow: a contact form, as a visitor sees it */
export const LeadForm = ({ sent = false }: { sent?: boolean }) => (
  <div className={`lf-form ${sent ? 'is-sent' : ''}`}>
    <p className="lf-k">Website · Contact</p>
    <b className="lf-form-t">Tell us about your project</b>
    <label><span>Name</span><i>Sara H.</i></label>
    <label><span>Business</span><i>Corner café, Dearborn</i></label>
    <label><span>What do you need?</span><i>Website + online ordering</i></label>
    <span className="lf-send">{sent ? 'Sent ✓' : 'Send'}</span>
  </div>
);
