'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SiteChrome({ children, ads = {} }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  }

  return (
    <div>
      {ads.header ? <div dangerouslySetInnerHTML={{ __html: ads.header }} /> : null}
      <header className="bg-white/95 backdrop-blur border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center shadow-sm">A</div>
            <span className="font-bold text-xl tracking-tight">AdSense<span className="text-green-600">Audit</span> Pro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
            <a href="/#how" className="hover:text-green-600">How it works</a>
            <a href="/#features" className="hover:text-green-600">Features</a>
            <Link href="/pricing" className="hover:text-green-600">Pricing</Link>
            <Link href="/blog" className="hover:text-green-600">Blog</Link>
            <Link href="/contact" className="hover:text-green-600">Contact</Link>
            {user ? (
              <>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{user.plan === 'pro' || user.role === 'admin' ? 'Pro' : 'Free'} · {user.email}</span>
                {user.role === 'admin' && <Link href="/admin" className="text-xs px-2.5 py-1 rounded-lg bg-gray-100">Admin</Link>}
                <button type="button" onClick={logout} className="text-xs px-2.5 py-1 rounded-lg border">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-green-600">Log in</Link>
                <Link href="/register" className="px-3 py-1.5 rounded-lg border border-green-600 text-green-700 hover:bg-green-50">Sign up</Link>
                <Link href="/pricing" className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700">Go Pro</Link>
              </>
            )}
          </nav>
          <button type="button" className="md:hidden p-2 rounded-lg border" onClick={() => setOpen(!open)} aria-label="Menu">
            <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-700" />
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-3 text-sm font-medium">
            <Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
            <Link href="/blog" onClick={() => setOpen(false)}>Blog</Link>
            <Link href="/about" onClick={() => setOpen(false)}>About</Link>
            <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
            <Link href="/privacy-policy" onClick={() => setOpen(false)}>Privacy</Link>
            {user ? (
              <>
                <span className="text-xs text-gray-500">{user.email} ({user.plan || 'free'})</span>
                {user.role === 'admin' && <Link href="/admin" onClick={() => setOpen(false)}>Admin</Link>}
                <button type="button" onClick={logout} className="text-left">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
                <Link href="/register" onClick={() => setOpen(false)}>Sign up</Link>
              </>
            )}
          </div>
        )}
      </header>
      {children}
      <footer className="bg-gray-900 text-gray-400 pt-14 pb-8 text-sm">
        {ads.footer ? <div className="max-w-6xl mx-auto px-4 mb-10" dangerouslySetInnerHTML={{ __html: ads.footer }} /> : null}
        <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="font-bold text-white text-lg mb-3">AdSenseAudit Pro</div>
            <p className="leading-relaxed">Live AdSense readiness audits. Independent — not affiliated with Google.</p>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Product</div>
            <ul className="space-y-2">
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/register" className="hover:text-white">Create account</Link></li>
              <li><Link href="/login" className="hover:text-white">Log in</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Company</div>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Legal</div>
            <ul className="space-y-2">
              <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/admin" className="hover:text-white">Admin</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 max-w-6xl mx-auto px-4 pt-6 text-xs">
          © {new Date().getFullYear()} AdSense Audit Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
