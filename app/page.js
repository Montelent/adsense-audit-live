'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const FACTORS = [
  { t: 'Valuable original content', d: '15–30+ articles with real depth — not thin or scraped pages.' },
  { t: 'Privacy Policy', d: 'Disclose cookies and Google ads; link in the footer on every page.' },
  { t: 'About & Contact', d: 'Show who runs the site and how to reach you (E-E-A-T).' },
  { t: 'HTTPS + mobile', d: 'Valid SSL and responsive layout are required.' },
  { t: 'Clear navigation', d: 'Menus and internal links so users and reviewers can explore.' },
  { t: 'Publisher policy compliance', d: 'No prohibited content; follow Google AdSense policies.' },
];

const FAQS = [
  { q: 'Does a high score guarantee approval?', a: 'No. Google’s human review and your account history still decide. A high score means the common public checks look good.' },
  { q: 'Can this tool see password-protected pages?', a: 'No. It only fetches public URLs the same way a visitor would.' },
  { q: 'Why did it pass Privacy if I just added the page?', a: 'We request common paths like /privacy-policy and also look for privacy links on the homepage. Custom URLs may need a homepage link.' },
  { q: 'How long should I wait before applying?', a: 'Until you have solid content, legal pages, HTTPS, and a mobile-friendly site. Many publishers wait until 15–30 quality posts.' },
];

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [settings, setSettings] = useState(null);
  const [ads, setAds] = useState({});

  useEffect(() => {
    fetch('/api/settings?type=all')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
        if (d.ads) setAds(d.ads);
      })
      .catch(() => {});
  }, []);

  const s = settings || {};

  async function runAudit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!data.success) setError(data.error || 'Audit failed');
      else setResult(data);
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {ads.header ? <div dangerouslySetInnerHTML={{ __html: ads.header }} /> : null}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center">A</div>
            <span className="font-bold text-xl tracking-tight">AdSense<span className="text-green-600">Audit</span> Pro</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
            <a href="#how" className="hover:text-green-600 hidden sm:inline">How it works</a>
            <a href="#faq" className="hover:text-green-600 hidden sm:inline">FAQ</a>
            <Link href="/blog" className="hover:text-green-600">Blog</Link>
            <Link href="/admin" className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Admin</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-green-50 to-white pt-14 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {s.heroBadge || 'Live crawl · 2026 AdSense standards'}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            {s.heroTitle || 'Is your site ready for'}
            <br />
            <span className="text-green-600">{s.heroHighlight || 'Google AdSense?'}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            {s.heroSubtitle || 'We fetch your live pages and check HTTPS, Privacy, About, Contact, mobile readiness, and more.'}
          </p>
          <form onSubmit={runAudit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-3 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourwebsite.com" required
              className="flex-1 px-5 py-4 rounded-xl border border-gray-200 focus:border-green-500 outline-none" />
            <button type="submit" disabled={loading} className="px-8 py-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl">
              {loading ? 'Crawling…' : (s.auditButton || 'Run Live Audit')}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-3">Live HTTP fetch · Public pages only</p>
          {error && <p className="mt-4 text-red-600 text-sm font-medium">{error}</p>}
        </div>
      </section>

      {ads.homepage ? <div className="max-w-5xl mx-auto px-4 py-4" dangerouslySetInnerHTML={{ __html: ads.homepage }} /> : null}

      {result && (
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative w-40 h-40 flex-shrink-0">
                <div className="absolute inset-0 rounded-full score-ring" style={{ '--score': result.score, '--score-color': result.score >= 75 ? '#22c55e' : result.score >= 50 ? '#f59e0b' : '#ef4444' }} />
                <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold">{result.score}</span>
                  <span className="text-xs text-gray-500 uppercase">Score</span>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold">{result.hostname}</h2>
                <p className="text-sm text-gray-500 mb-3">{result.finalUrl}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="px-4 py-2 rounded-lg bg-green-50 border border-green-100"><div className="text-xs text-green-600 font-medium">Approval chance</div><div className="text-xl font-bold text-green-700">{result.approvalChance}%</div></div>
                  <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-100"><div className="text-xs text-red-600 font-medium">Rejection risk</div><div className="text-xl font-bold text-red-700">{result.rejectionRisk}%</div></div>
                  <div className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-100"><div className="text-xs text-amber-600 font-medium">Critical gaps</div><div className="text-xl font-bold text-amber-700">{result.criticalIssues}</div></div>
                </div>
              </div>
            </div>
          </div>
          {ads.homepageMiddle ? <div className="mb-8" dangerouslySetInnerHTML={{ __html: ads.homepageMiddle }} /> : null}
          <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8">
            <h3 className="text-xl font-bold mb-2">Detailed live checks</h3>
            <p className="text-sm text-gray-500 mb-6">Only failed items need action. Passed checks were verified on the live site.</p>
            <div className="space-y-5">
              {(result.checks || []).map((c) => (
                <div key={c.id} className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${c.pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{c.pass ? '✓' : '✗'}</span>
                      <div><span className="font-semibold">{c.label}</span>{c.critical && <span className="ml-2 text-xs text-red-600 font-medium">Critical</span>}</div>
                    </div>
                    {c.recommendedPage && !c.pass && <span className="text-xs font-mono bg-white border px-2 py-1 rounded">{c.recommendedPage}</span>}
                  </div>
                  <div className="p-5 space-y-2 text-sm">
                    <p className="text-gray-700">{c.detail}</p>
                    {!c.pass && c.fix && <p><span className="font-medium">Fix: </span>{c.fix}</p>}
                    {!c.pass && c.sampleText && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Sample text</div>
                        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 prose-sample max-h-40 overflow-auto">{c.sampleText}</pre>
                        <button type="button" className="mt-2 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg" onClick={() => navigator.clipboard.writeText(c.sampleText)}>Copy sample</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="how" className="py-20 bg-white border-t">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">{s.howTitle || 'How the live audit works'}</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">{s.howSubtitle || 'Real HTTP requests to your public URLs.'}</p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {['Enter your URL', 'We crawl public pages', 'Get score + fixes'].map((t, i) => (
              <div key={t}>
                <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center text-2xl font-bold mx-auto mb-4">{i + 1}</div>
                <h3 className="font-semibold mb-2">{t}</h3>
                <p className="text-sm text-gray-600">{i === 0 ? 'Any public website URL.' : i === 1 ? 'Homepage + Privacy, About, Contact paths.' : 'Approval estimate and actionable samples.'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">{s.checklistTitle || 'What Google reviewers look for'}</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Align your site with these factors before you apply.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FACTORS.map((f) => (
              <div key={f.t} className="bg-white rounded-xl border p-5 shadow-sm">
                <h3 className="font-semibold mb-2">{f.t}</h3>
                <p className="text-sm text-gray-600">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">{s.faqTitle || 'Frequently asked questions'}</h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="bg-gray-50 rounded-xl p-5 border">
                <summary className="font-semibold cursor-pointer">{f.q}</summary>
                <p className="mt-3 text-sm text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12 text-center text-sm">
        {ads.footer ? <div className="max-w-4xl mx-auto px-4 mb-6" dangerouslySetInnerHTML={{ __html: ads.footer }} /> : null}
        <div className="font-bold text-white mb-2">{s.siteName || 'AdSenseAudit Pro'}</div>
        <p>{s.footerNote || 'Independent readiness tool. Not affiliated with Google.'}</p>
        <div className="mt-3 flex justify-center gap-4">
          <Link href="/blog" className="hover:text-white">Blog</Link>
          <Link href="/admin" className="hover:text-white">Admin</Link>
        </div>
      </footer>
    </div>
  );
}
