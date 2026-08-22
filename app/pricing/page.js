'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteChrome from '../components/SiteChrome';

export default function PricingPage() {
  const [plan, setPlan] = useState(null);
  const [payments, setPayments] = useState(null);
  const [ads, setAds] = useState({});
  const [user, setUser] = useState(null);
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/settings?type=all')
      .then((r) => r.json())
      .then((d) => {
        setPlan(d.plan);
        setPayments(d.payments);
        setAds(d.ads || {});
      })
      .catch(() => {});
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  const p = plan || {};
  const pay = payments || {};
  // Public API returns methods as objects with lines[]
  const methods = Object.entries(pay)
    .filter(([k, v]) => k !== 'instructions' && v && v.enabled)
    .map(([key, v]) => ({ key, ...v }));

  async function submitPaid(e) {
    e.preventDefault();
    if (!user) {
      setMsg('Please log in or create an account first.');
      return;
    }
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'payment_request', method, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Failed');
      return;
    }
    setMsg('Request sent. Admin will activate Pro after verifying payment.');
    setNote('');
  }

  return (
    <SiteChrome ads={ads}>
      <main className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold mb-3">Simple pricing</h1>
          <p className="text-gray-600 max-w-xl mx-auto">Create a free account, pay with any method below, then request Pro activation.</p>
          {!user && (
            <p className="mt-4 text-sm">
              <Link href="/register" className="text-green-700 font-semibold underline">Sign up</Link>
              {' · '}
              <Link href="/login" className="text-green-700 font-semibold underline">Log in</Link>
            </p>
          )}
          {user && (
            <p className="mt-4 text-sm text-gray-600">
              Logged in as <strong>{user.email}</strong> · plan: <strong>{user.plan || 'free'}</strong>
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white border rounded-2xl p-8 shadow-sm">
            <div className="text-sm font-semibold text-gray-500 uppercase">{p.freeName || 'Free'}</div>
            <div className="text-4xl font-extrabold mt-2">$0</div>
            <ul className="mt-6 space-y-2 text-sm text-gray-700">
              {(p.freeFeatures || []).map((f) => (
                <li key={f} className="flex gap-2"><span className="text-green-600">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/" className="mt-8 inline-block w-full text-center py-3 rounded-xl border font-medium">Run free audit</Link>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl p-8 shadow-lg">
            <div className="text-sm font-semibold uppercase opacity-90">{p.proName || 'Pro'}</div>
            <div className="text-4xl font-extrabold mt-2">
              {p.proCurrency || 'USD'} {p.proPrice || '29'}
              <span className="text-base font-medium opacity-80">/{p.proInterval || 'month'}</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {(p.proFeatures || []).map((f) => (
                <li key={f} className="flex gap-2"><span>✓</span>{f}</li>
              ))}
            </ul>
            <a href="#pay" className="mt-8 inline-block w-full text-center py-3 rounded-xl bg-white text-green-700 font-semibold">Upgrade to Pro</a>
          </div>
        </div>

        <section id="pay" className="bg-white border rounded-2xl p-8 shadow-sm space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Payment methods</h2>
            <p className="text-sm text-gray-600">{pay.instructions}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {methods.map((m) => (
              <div key={m.key} className="border rounded-xl p-4">
                <div className="font-semibold text-green-700 mb-3">{m.label || m.key}</div>
                {(m.lines || []).length === 0 && (
                  <p className="text-xs text-gray-400">Details coming soon</p>
                )}
                <dl className="space-y-2 text-sm">
                  {(m.lines || []).map((line) => (
                    <div key={line.label}>
                      <dt className="text-xs text-gray-500">{line.label}</dt>
                      <dd className="font-medium text-gray-900 break-all">{line.value}</dd>
                    </div>
                  ))}
                </dl>
                {m.paymentLink && (
                  <a href={m.paymentLink} target="_blank" rel="noreferrer" className="inline-block mt-3 text-sm text-green-700 font-medium underline">
                    Open payment link
                  </a>
                )}
              </div>
            ))}
            {!methods.length && <p className="text-sm text-gray-500">No payment methods configured yet.</p>}
          </div>

          <form onSubmit={submitPaid} className="border-t pt-6 space-y-3 max-w-lg">
            <h3 className="font-semibold">I have paid — request Pro activation</h3>
            {!user && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                You must <Link href="/register" className="underline font-medium">create an account</Link> or <Link href="/login" className="underline font-medium">log in</Link> first.
              </p>
            )}
            <select value={method} onChange={(e) => setMethod(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" disabled={!user}>
              <option value="">Select payment method used</option>
              {methods.map((m) => (
                <option key={m.key} value={m.key}>{m.label || m.key}</option>
              ))}
            </select>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Transaction ID, amount, date…" rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" disabled={!user} />
            <button type="submit" disabled={!user} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">Submit request</button>
            {msg && <p className="text-sm text-green-800">{msg}</p>}
          </form>
        </section>
      </main>
    </SiteChrome>
  );
}
