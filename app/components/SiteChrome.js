'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SiteChrome({ children, ads = {} }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {ads.header ? <div dangerouslySetInnerHTML={{ __html: ads.header }} /> : null}
      <header className="bg-white/95 backdrop-blur border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center shadow-sm">A</div>
            <span className="font-bold text-xl tracking-tight">AdSense<span className="text-green-600">Audit</span> Pro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600">
            <a href="/#how" className="hover:text-green-600">How it works</a>
            <a href="/#features" className="hover:text-green-600">Features</a>
            <Link href="/pricing" className="hover:text-green-600">Pricing</Link>
            <Link href="/blog" className="hover:text-green-600">Blog</Link>
            <a href="/#faq" className="hover:text-green-600">FAQ</a>
            <Link href="/contact" className="hover:text-green-600">Contact</Link>
            <Link href="/admin" className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200">Admin</Link>
            <Link href="/pricing" className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700">Go Pro</Link>
          </nav>
          <button type="button" className="md:hidden p-2 rounded-lg border" onClick={() => setOpen(!open)} aria-label="Menu">
            <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-700" />
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-3 text-sm font-medium">
            <a href="/#how" onClick={() => setOpen(false)}>How it works</a>
            <a href="/#features" onClick={() => setOpen(false)}>Features</a>
            <Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
            <Link href="/blog" onClick={() => setOpen(false)}>Blog</Link>
            <a href="/#faq" onClick={() => setOpen(false)}>FAQ</a>
            <Link href="/about" onClick={() => setOpen(false)}>About</Link>
            <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
            <Link href="/privacy-policy" onClick={() => setOpen(false)}>Privacy</Link>
            <Link href="/admin" onClick={() => setOpen(false)}>Admin</Link>
          </div>
        )}
      </header>
      {children}
      <footer className="bg-gray-900 text-gray-400 pt-14 pb-8 text-sm">
        {ads.footer ? <div className="max-w-6xl mx-auto px-4 mb-10" dangerouslySetInnerHTML={{ __html: ads.footer }} /> : null}
        <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="font-bold text-white text-lg mb-3">AdSenseAudit Pro</div>
            <p className="leading-relaxed">Live AdSense readiness audits with content quality and policy-risk checks. Independent tool — not affiliated with Google.</p>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Product</div>
            <ul className="space-y-2">
              <li><a href="/#how" className="hover:text-white">How it works</a></li>
              <li><a href="/#features" className="hover:text-white">Features</a></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Company</div>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/blog" className="hover:text-white">Resources</Link></li>
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
        <div className="border-t border-gray-800 max-w-6xl mx-auto px-4 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs">
          <span>© {new Date().getFullYear()} AdSense Audit Pro. All rights reserved.</span>
          <span>Use responsibly. Google AdSense has the final say on approvals.</span>
        </div>
      </footer>
    </div>
  );
}
