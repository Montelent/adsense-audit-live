'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

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
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center">A</div>
            <span className="font-bold text-xl tracking-tight">
              AdSense<span className="text-green-600">Audit</span> Pro
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
            <Link href="/blog" className="hover:text-green-600">Blog</Link>
            <Link href="/admin" className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Admin</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-green-50 to-white pt-14 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live crawl · Accurate page checks
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Is your site ready for
            <br />
            <span className="text-green-600">Google AdSense?</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            We fetch your live homepage and common legal paths (Privacy, About, Contact) and report what is actually present.
          </p>

          <form onSubmit={runAudit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-3 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              required
              className="flex-1 px-5 py-4 rounded-xl border border-gray-200 focus:border-green-500 outline-none text-base"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl"
            >
              {loading ? 'Crawling…' : 'Run Live Audit'}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-3">Live HTTP fetch of your public pages. No login required.</p>
          {error && <p className="mt-4 text-red-600 text-sm font-medium">{error}</p>}
        </div>
      </section>

      {result && (
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative w-40 h-40 flex-shrink-0">
                <div
                  className="absolute inset-0 rounded-full score-ring"
                  style={{
                    '--score': result.score,
                    '--score-color': result.score >= 75 ? '#22c55e' : result.score >= 50 ? '#f59e0b' : '#ef4444',
                  }}
                />
                <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold">{result.score}</span>
                  <span className="text-xs text-gray-500 uppercase">Score</span>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold">{result.hostname}</h2>
                <p className="text-sm text-gray-500 mb-3">{result.finalUrl}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="px-4 py-2 rounded-lg bg-green-50 border border-green-100">
                    <div className="text-xs text-green-600 font-medium">Approval chance</div>
                    <div className="text-xl font-bold text-green-700">{result.approvalChance}%</div>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-100">
                    <div className="text-xs text-red-600 font-medium">Rejection risk</div>
                    <div className="text-xl font-bold text-red-700">{result.rejectionRisk}%</div>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="text-xs text-amber-600 font-medium">Critical gaps</div>
                    <div className="text-xl font-bold text-amber-700">{result.criticalIssues}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8">
            <h3 className="text-xl font-bold mb-2">Live check results</h3>
            <p className="text-sm text-gray-500 mb-6">Based on fetching your homepage and common paths. Only failed items need action.</p>
            <div className="space-y-5">
              {(result.checks || []).map((c) => (
                <div key={c.id} className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${c.pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {c.pass ? '✓' : '✗'}
                      </span>
                      <div>
                        <span className="font-semibold">{c.label}</span>
                        {c.critical && <span className="ml-2 text-xs text-red-600 font-medium">Critical</span>}
                      </div>
                    </div>
                    {c.recommendedPage && !c.pass && (
                      <span className="text-xs font-mono bg-white border px-2 py-1 rounded">{c.recommendedPage}</span>
                    )}
                  </div>
                  <div className="p-5 space-y-2 text-sm">
                    <p className="text-gray-700">{c.detail}</p>
                    {!c.pass && c.fix && (
                      <p><span className="font-medium">Fix: </span>{c.fix}</p>
                    )}
                    {!c.pass && c.sampleText && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Sample text</div>
                        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 prose-sample max-h-40 overflow-auto">{c.sampleText}</pre>
                        <button type="button" className="mt-2 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg" onClick={() => navigator.clipboard.writeText(c.sampleText)}>
                          Copy sample
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-gray-900 text-gray-400 py-10 text-center text-sm mt-12">
        <div className="font-bold text-white mb-2">AdSenseAudit Pro</div>
        <p>Live crawler · Independent tool · Not affiliated with Google</p>
        <div className="mt-3 flex justify-center gap-4">
          <Link href="/blog" className="hover:text-white">Blog</Link>
          <Link href="/admin" className="hover:text-white">Admin</Link>
        </div>
      </footer>
    </div>
  );
}
