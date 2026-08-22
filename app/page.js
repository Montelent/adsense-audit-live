'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteChrome from './components/SiteChrome';

const FACTORS = [
  { t: 'Valuable original content', d: '15–30+ articles with real depth — not thin or scraped pages.' },
  { t: 'Privacy Policy', d: 'Disclose cookies and Google ads; link in the footer on every page.' },
  { t: 'About & Contact', d: 'Show who runs the site and how to reach you (E-E-A-T).' },
  { t: 'HTTPS + mobile', d: 'Valid SSL and responsive layout are required.' },
  { t: 'Clear navigation', d: 'Menus and internal links so users and reviewers can explore.' },
  { t: 'Publisher policy compliance', d: 'No nulled, adult, malware, or other prohibited content.' },
];

const FAQS = [
  { q: 'Does a high score guarantee approval?', a: 'No. Google human review still decides. A high score means public checks and sampled content look healthy.' },
  { q: 'Free vs Pro?', a: 'Free samples fewer posts. Pro (and logged-in admin) samples up to 10 posts in parallel within Vercel Hobby time limits for deeper quality analysis.' },
  { q: 'What about nulled sites?', a: 'We flag piracy/nulled/crack language. Those categories are typically rejected under AdSense policies.' },
  { q: 'Can this tool see private pages?', a: 'No. Only public URLs.' },
];

function ratingColor(r) {
  if (r === 'high' || r === 'good') return 'bg-green-100 text-green-800';
  if (r === 'medium' || r === 'moderate') return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

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
  const ca = result?.contentAnalysis;

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
        credentials: 'include',
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
    <SiteChrome ads={ads}>
      <section className="bg-gradient-to-b from-green-50 via-white to-white pt-14 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {s.heroBadge || 'Live crawl · content quality · policy risk'}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            {s.heroTitle || 'Is your site ready for'}
            <br />
            <span className="text-green-600">{s.heroHighlight || 'Google AdSense?'}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            {s.heroSubtitle || 'Live crawl of legal pages plus content quality scoring and policy-risk detection.'}
          </p>
          <form onSubmit={runAudit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-3 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourwebsite.com" required
              className="flex-1 px-5 py-4 rounded-xl border border-gray-200 focus:border-green-500 outline-none" />
            <button type="submit" disabled={loading} className="px-8 py-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl">
              {loading ? 'Crawling pages…' : (s.auditButton || 'Run Live Audit')}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-3">
            Free: fewer posts · Pro / admin login: up to 10 posts in parallel ·{' '}
            <Link href="/pricing" className="text-green-700 underline">See pricing</Link>
          </p>
          {error && <p className="mt-4 text-red-600 text-sm font-medium">{error}</p>}
        </div>
      </section>

      {ads.homepage ? <div className="max-w-5xl mx-auto px-4 py-4" dangerouslySetInnerHTML={{ __html: ads.homepage }} /> : null}

      {result && (
        <section className="max-w-5xl mx-auto px-4 py-12 space-y-8">
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {result.planUsed && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${result.planUsed === 'pro' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                {result.planUsed === 'pro' ? 'Pro analysis' : 'Free analysis'} · max {result.maxSamples} posts
              </span>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8">
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
                  {ca && <div className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-100"><div className="text-xs text-blue-600 font-medium">Avg content quality</div><div className="text-xl font-bold text-blue-700">{ca.averageQuality}/100</div></div>}
                </div>
              </div>
            </div>
          </div>

          {ads.homepageMiddle ? <div dangerouslySetInnerHTML={{ __html: ads.homepageMiddle }} /> : null}

          {ca && (
            <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8">
              <h3 className="text-xl font-bold mb-2">Content quality analysis</h3>
              <p className="text-sm text-gray-500 mb-4">
                Sampled {ca.pagesSampled} page(s) · {ca.highQualityPages} high · {ca.lowQualityPages} low
                {ca.siteRiskCategories?.length ? ` · Policy risks: ${ca.siteRiskCategories.join(', ')}` : ' · No major policy-risk categories detected'}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="py-2 pr-3">Page</th>
                      <th className="py-2 pr-3">Words</th>
                      <th className="py-2 pr-3">Quality</th>
                      <th className="py-2 pr-3">AdSense fit</th>
                      <th className="py-2">Type / notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ca.pages || []).map((p) => (
                      <tr key={p.url} className="border-b border-gray-100 align-top">
                        <td className="py-3 pr-3">
                          <div className="font-medium line-clamp-1">{p.title || p.url}</div>
                          <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-green-700 break-all">{p.url}</a>
                        </td>
                        <td className="py-3 pr-3">{p.wordCount}</td>
                        <td className="py-3 pr-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded ${ratingColor(p.qualityRating)}`}>{p.qualityRating} ({p.qualityScore})</span></td>
                        <td className="py-3 pr-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded ${ratingColor(p.adsenseFit)}`}>{p.adsenseFit}</span></td>
                        <td className="py-3 text-gray-600">{p.contentType}{p.riskCategories?.length ? <span className="block text-xs text-red-600 mt-1">Risk: {p.riskCategories.join(', ')}</span> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.planUsed === 'free' && (
                <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                  Free plan samples fewer posts. <Link href="/pricing" className="font-semibold underline">Upgrade to Pro</Link> or log in as admin for up to 10 sampled posts.
                </p>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8">
            <h3 className="text-xl font-bold mb-2">Detailed live checks</h3>
            <div className="space-y-5 mt-6">
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
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">{s.howSubtitle || 'We crawl your homepage, legal pages, and sample posts.'}</p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[['1', 'Enter URL', 'Any public site'], ['2', 'Crawl + sample posts', 'Legal pages + articles'], ['3', 'Score quality and risk', 'Thin, spam, nulled, adult']].map(([n, t, d]) => (
              <div key={n}>
                <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center text-2xl font-bold mx-auto mb-4">{n}</div>
                <h3 className="font-semibold mb-2">{t}</h3>
                <p className="text-sm text-gray-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">{s.checklistTitle || 'What Google reviewers look for'}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {FACTORS.map((f) => (
              <div key={f.t} className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition">
                <h3 className="font-semibold mb-2">{f.t}</h3>
                <p className="text-sm text-gray-600">{f.d}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/pricing" className="inline-flex px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">Compare Free vs Pro</Link>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">{s.faqTitle || 'FAQ'}</h2>
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
    </SiteChrome>
  );
}
