'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteChrome from '../components/SiteChrome';

export default function PricingPage() {
  const [plan, setPlan] = useState(null);
  const [payments, setPayments] = useState(null);
  const [ads, setAds] = useState({});

  useEffect(() => {
    fetch('/api/settings?type=all')
      .then((r) => r.json())
      .then((d) => {
        setPlan(d.plan);
        setPayments(d.payments);
        setAds(d.ads || {});
      })
      .catch(() => {});
  }, []);

  const p = plan || {};
  const pay = payments || {};
  const methods = ['paypal', 'paystack', 'monnify', 'usdt', 'usdc', 'bank', 'wire']
    .map((k) => ({ key: k, ...(pay[k] || {}) }))
    .filter((m) => m.enabled);

  return (
    <SiteChrome ads={ads}>
      <main className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold mb-3">Simple pricing</h1>
          <p className="text-gray-600 max-w-xl mx-auto">Free audits for essentials. Pro unlocks deeper post sampling and full content-quality reports.</p>
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
            <Link href="/" className="mt-8 inline-block w-full text-center py-3 rounded-xl border font-medium hover:bg-gray-50">Run free audit</Link>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-4 right-4 text-xs bg-white/20 px-2 py-1 rounded-full">Recommended</div>
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
            <a href="#pay" className="mt-8 inline-block w-full text-center py-3 rounded-xl bg-white text-green-700 font-semibold hover:bg-green-50">Upgrade to Pro</a>
          </div>
        </div>

        <section id="pay" className="bg-white border rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-2">Payment methods</h2>
          <p className="text-sm text-gray-600 mb-6">{pay.instructions || 'Pay using any method below, then send proof to support for Pro activation.'}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {methods.map((m) => (
              <div key={m.key} className="border rounded-xl p-4">
                <div className="font-semibold text-green-700">{m.label || m.key}</div>
                <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap font-sans">{m.details || 'Contact admin for details'}</pre>
              </div>
            ))}
            {!methods.length && <p className="text-gray-500 text-sm">Payment details will appear here once configured in Admin.</p>}
          </div>
          <p className="text-xs text-gray-400 mt-6">Admin accounts always receive Pro analysis while logged in — no payment required for the site owner.</p>
        </section>
      </main>
    </SiteChrome>
  );
}
