// Contact form endpoint. Email via Resend (required to deliver), optional SMS to the owner via Twilio.
// Configuration lives in environment variables (see .env.example); nothing secret is in the code.
//   RESEND_API_KEY, CONTACT_EMAIL, CONTACT_FROM            → email
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, PHONE_NUMBER → SMS (optional)
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NEEDS = ['Website', 'App', 'System', 'Not sure yet'] as const;
type Payload = { name: string; business: string; contact: string; needs: string[]; message: string; website?: string };

// best-effort rate limit per instance: 5 submissions / 10 minutes / IP
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '');
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function parse(body: unknown): Payload | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const p: Payload = {
    name: clean(b.name, 100),
    business: clean(b.business, 150),
    contact: clean(b.contact, 150),
    message: clean(b.message, 4000),
    needs: Array.isArray(b.needs) ? b.needs.filter((n): n is string => typeof n === 'string' && (NEEDS as readonly string[]).includes(n)) : [],
    website: clean(b.website, 200), // honeypot
  };
  if (!p.name || p.contact.length < 3 || !p.message) return null;
  return p;
}

async function sendEmail(p: Payload) {
  const key = process.env.RESEND_API_KEY, to = process.env.CONTACT_EMAIL;
  if (!key || !to) return { configured: false, ok: false };
  const from = process.env.CONTACT_FROM || 'ElaSystems Site <onboarding@resend.dev>';
  const rows = [['Name', p.name], ['Business', p.business || '—'], ['Reach them at', p.contact], ['Needs', p.needs.join(', ') || '—']];
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#0B1220">
    <h2 style="margin:0 0 12px">New project enquiry</h2>
    <table style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#6B7280">${k}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join('')}</table>
    <p style="margin:16px 0 0;white-space:pre-wrap">${esc(p.message)}</p></div>`;
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${p.message}`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: `New enquiry: ${p.name}${p.business ? ` — ${p.business}` : ''}`, html, text, ...(isEmail(p.contact) ? { reply_to: p.contact } : {}) }),
  });
  return { configured: true, ok: res.ok };
}

async function sendSms(p: Payload) {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM, to = process.env.PHONE_NUMBER;
  if (!sid || !token || !from || !to) return { configured: false, ok: false };
  const body = `ElaSystems: new enquiry from ${p.name}${p.business ? ` (${p.business})` : ''}. ${p.needs.join(', ')}. Reach: ${p.contact}`.slice(0, 320);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  return { configured: true, ok: res.ok };
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (limited(ip)) return NextResponse.json({ ok: false, reason: 'rate-limited' }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 }); }
  const p = parse(body);
  if (!p) return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 });
  if (p.website) return NextResponse.json({ ok: true }); // bots fill the hidden field; pretend success

  const [email, sms] = await Promise.all([sendEmail(p).catch(() => ({ configured: true, ok: false })), sendSms(p).catch(() => ({ configured: true, ok: false }))]);
  if (!email.configured && !sms.configured) return NextResponse.json({ ok: false, reason: 'not-configured' }, { status: 503 });
  if (email.ok || sms.ok) return NextResponse.json({ ok: true, email: email.ok, sms: sms.ok });
  console.error('[contact] delivery failed', { email, sms });
  return NextResponse.json({ ok: false, reason: 'delivery-failed' }, { status: 502 });
}
