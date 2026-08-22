'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SiteChrome from '../components/SiteChrome';

function PricingInner() {
  const search = useSearchParams();
  const [plan, setPlan] = useState(null);
  const [payments, setPayments] = useState(null);
  const [ads, setAds] = useState({});
  const [user, setUser] = useState(null);
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');

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

  // Auto-verify after gateway redirect
  useEffect(() => {
    const paid = search.get('paid');
    const ref = search.get('reference') || search.get('trxref') || search.get('paymentReference');
    if (!paid || !ref) return;
    (async () => {
      setBusy('Verifying payment…');
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: paid, reference: ref }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Payment verified — Pro is active on your account.');
        const me = await fetch('/api/auth/me').then((r) => r.json());
        setUser(me.user);
      } else {
        setMsg(data.error || 'Could not verify payment');
      }
      setBusy('');
    })();
  }, [search]);

  const p = plan || {};
  const pay = payments || {};
  const methods = Object.entries(pay)
    .filter(([k, v]) => k !== 'instructions' && v && v.enabled)
    .map(([key, v]) => ({ key, ...v }));

  const autoMethods = methods.filter((m) => m.auto || ['paystack', 'monnify', 'paypal'].includes(m.key));
  const manualMethods = methods.filter((m) => !m.auto && !['paystack', 'monnify', 'paypal'].includes(m.key));

  async function startAuto(m) {
    if (!user) {
      setMsg('Please log in or create an account first.');
      return;
    }
    setBusy(m);
    setMsg('');
    try {
      const res = await fetch('/api/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: m }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Could not start payment');
        setBusy('');
        return;
      }
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }
      setMsg(data.note || 'Follow the payment instructions for this method.');
    } catch (err) {
      setMsg(err.message);
    }
    setBusy('');
  }

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
    setMsg('Request sent. Admin will activate Pro after verifying your manual payment.');
    setNote('');
  }

  return (
    <SiteChrome ads={ads}>
      <main className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold mb-3">Simple pricing</h1>
          <p className="text-gray-600 max-w-xl mx-auto">Pay with card/gateway for instant Pro, or use bank/crypto for manual approval.</p>
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
              {' · '}
              <Link href="/account" className="text-green-700 underline">Account</Link>
            </p>
          )}
          {busy && <p className="mt-3 text-sm text-amber-700">{busy}</p>}
          {msg && <p className="mt-3 text-sm text-green-800 bg-green-50 border border-green-100 rounded-lg inline-block px-3 py-2">{msg}</p>}
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

        <section id="pay" className="space-y-10">
          <div className="bg-white border rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Instant activation</h2>
            <p className="text-sm text-gray-600 mb-6">Paystack & Monnify verify automatically and unlock Pro immediately. PayPal opens your configured link.</p>
            <div className="flex flex-wrap gap-3">
              {autoMethods.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  disabled={!!busy}
                  onClick={() => startAuto(m.key)}
                  className="px-5 py-3 rounded-xl bg-green-600 text-white font-medium text-sm disabled:opacity-50"
                >
                  {busy === m.key ? 'Redirecting…' : `Pay with ${m.label || m.key}`}
                </button>
              ))}
              {!autoMethods.length && <p className="text-sm text-gray-500">Configure Paystack/Monnify keys in Admin → Payments.</p>}
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Manual payment</h2>
              <p className="text-sm text-gray-600">{pay.instructions}</p>
              <p className="text-xs text-amber-700 mt-2">Bank, wire, and crypto require admin approval after you submit proof.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {manualMethods.map((m) => (
                <div key={m.key} className="border rounded-xl p-4">
                  <div className="font-semibold text-green-700 mb-3">{m.label || m.key}</div>
                  <dl className="space-y-2 text-sm">
                    {(m.lines || []).map((line) => (
                      <div key={line.label}>
                        <dt className="text-xs text-gray-500">{line.label}</dt>
                        <dd className="font-medium break-all">{line.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>

            <form onSubmit={submitPaid} className="border-t pt-6 space-y-3 max-w-lg">
              <h3 className="font-semibold">I paid manually — request activation</h3>
              {!user && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <Link href="/register" className="underline font-medium">Create an account</Link> or <Link href="/login" className="underline font-medium">log in</Link> first.
                </p>
              )}
              <select value={method} onChange={(e) => setMethod(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" disabled={!user}>
                <option value="">Select method used</option>
                {manualMethods.map((m) => (
                  <option key={m.key} value={m.key}>{m.label || m.key}</option>
                ))}
              </select>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Transaction ID, amount, date…" rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" disabled={!user} />
              <button type="submit" disabled={!user} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium disabled:opacity-50">Submit for admin approval</button>
            </form>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-gray-500">Loading pricing…</div>}>
      <PricingInner />
    </Suspense>
  );
}
