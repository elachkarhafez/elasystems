'use client';
// The core. The light changes: dark, focused, gold. The mark assembles one last time — the three bars lock into the
// E, the slash draws, and the form stands where the S would be. Direct text / call / email are always one tap away.
import { useRef, useState, type FormEvent } from 'react';
import gsap from 'gsap';
import { CONTACT, WORLD_COPY } from '@/lib/content';
import { useWorld } from '@/lib/useWorld';
import type { WorldProps } from './shared';
import './contact-world.css';

const NEEDS = ['Website', 'App', 'System', 'Not sure yet'];
type Status = 'idle' | 'sending' | 'sent' | 'error' | 'offline';

export default function ContactWorld({ onBack }: WorldProps) {
  const root = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [needs, setNeeds] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [draft, setDraft] = useState('');

  useWorld(root, ({ reduced }, q) => {
    if (reduced) return;
    // the world mounts under the portal: words first, so there is something to read the moment it lifts
    const tl = gsap.timeline();
    tl.from(q('.ct-copy > *'), { y: 24, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05 }, 0)
      .from(q('.ct-bar'), { xPercent: -140, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07 }, 0.05)
      .from(q('.ct-slash'), { scaleY: 0, duration: 0.8, ease: 'expo.inOut' }, 0.15)
      .from(q('.ct-panel'), { xPercent: 8, autoAlpha: 0, duration: 0.9, ease: 'expo.out' }, 0.2)
      .from(q('.ct-field, .ct-needs, .ct-submit'), { y: 14, autoAlpha: 0, duration: 0.6, ease: 'expo.out', stagger: 0.04 }, 0.35);
  });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = { name: f.get('name'), business: f.get('business'), contact: f.get('contact'), message: f.get('message'), website: f.get('website'), needs };
    setName(String(f.get('name') || '').split(' ')[0]);
    // if the site can't send it, the same words go by text instead
    setDraft([f.get('name') && `Hi, this is ${f.get('name')}${f.get('business') ? ` from ${f.get('business')}` : ''}.`, needs.length ? `Looking for: ${needs.join(', ')}.` : '', String(f.get('message') || '')].filter(Boolean).join(' '));
    // static hosting (no server route): hand the message straight to text or email, already written
    if (process.env.NEXT_PUBLIC_FORM === 'handoff') { setStatus('offline'); return; }
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setStatus('sent');
      else setStatus(data.reason === 'not-configured' ? 'offline' : 'error');
    } catch { setStatus('error'); }
  }

  const c = WORLD_COPY.contact;
  return (
    <div ref={root} className="ct" data-tone="dark">
      <div className="ct-core" aria-hidden="true" />
      <div className="ct-stage">
        <div className="ct-left">
          <div className="ct-mark" aria-hidden="true"><i className="ct-bar" /><i className="ct-bar" /><i className="ct-bar" /><i className="ct-slash" /></div>
          <div className="ct-copy">
            <p className="label ct-kicker">{c.kicker}</p>
            <h1 className="ct-title">{c.title}</h1>
            <p className="ct-lede">{c.lede}</p>
            <a className="ct-number" href={CONTACT.sms} aria-label={`Text ElaSystems at ${CONTACT.phone}`}>{CONTACT.phone}</a>
            <p className="ct-direct">
              <a className="cut cut-gold" href={CONTACT.sms} aria-label={`Text ElaSystems at ${CONTACT.phone}`}>Text us</a>
              <a className="cut cut-line" href={CONTACT.tel} aria-label={`Call ElaSystems at ${CONTACT.phone}`}>Call</a>
              <a className="cut cut-line" href={`mailto:${CONTACT.email}`} aria-label={`Email ElaSystems at ${CONTACT.email}`}>Email</a>
            </p>
            <p className="ct-mail">{CONTACT.email.replace('@', '​@')} · {CONTACT.city}</p>
          </div>
        </div>

        <div className="ct-panel">
          {status === 'sent' ? (
            <div className="ct-done" role="status">
              <span className="ct-check" aria-hidden="true" />
              <h2>Got it{name ? `, ${name}` : ''}.</h2>
              <p>Your message is on its way to our phone and inbox. We’ll reply by text or email.</p>
              <button className="cut cut-line" onClick={onBack}>Back to the hub</button>
            </div>
          ) : (
            <form className="ct-form" onSubmit={submit} noValidate={false}>
              <p className="label ct-form-k">Tell us about the project</p>
              <div className="ct-row">
                <label className="ct-field"><span>Your name</span><input name="name" required autoComplete="name" maxLength={100} /></label>
                <label className="ct-field"><span>Business <em>(optional)</em></span><input name="business" autoComplete="organization" maxLength={150} /></label>
              </div>
              <label className="ct-field"><span>Phone or email</span><input name="contact" required autoComplete="tel email" maxLength={150} placeholder="Where should we reply?" /></label>
              <fieldset className="ct-needs">
                <legend>What do you need?</legend>
                {NEEDS.map((n) => (
                  <label key={n} className={needs.includes(n) ? 'on' : ''}>
                    <input type="checkbox" checked={needs.includes(n)} onChange={() => setNeeds((v) => (v.includes(n) ? v.filter((x) => x !== n) : [...v, n]))} />
                    {n}
                  </label>
                ))}
              </fieldset>
              <label className="ct-field"><span>What’s going on?</span><textarea name="message" required rows={4} maxLength={4000} placeholder="What the business does, and what isn’t working yet." /></label>
              <label className="ct-hp" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
              <div className="ct-submit">
                <button type="submit" className="cut cut-gold" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send message'}</button>
                <p className="ct-status" role="status" aria-live="polite">
                  {(status === 'error' || status === 'offline') && <>
                    {process.env.NEXT_PUBLIC_FORM === 'handoff' ? 'Your message is written. Send it by text and it comes straight to us.' : 'Couldn’t send from the site. Text it instead — your message is already filled in.'}
                    <a className="cut cut-gold ct-fallback" style={{ ['--h' as string]: '46px' }} href={`${CONTACT.sms}?&body=${encodeURIComponent(draft)}`}>Text {CONTACT.phone}</a>
                    <a className="ct-fallback-mail" href={`mailto:${CONTACT.email}?subject=${encodeURIComponent('New project')}&body=${encodeURIComponent(draft)}`}>or email it</a>
                  </>}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
      <footer className="ct-foot">
        <span>ElaSystems · Websites, Apps &amp; Systems · Detroit, MI</span>
        <button onClick={onBack}>← Back to the hub</button>
      </footer>
    </div>
  );
}
