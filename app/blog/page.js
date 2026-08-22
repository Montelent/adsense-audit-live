'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BlogIndex() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetch('/api/blogs')
      .then((r) => r.json())
      .then((d) => setBlogs(d.blogs || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center">A</div>
            <span className="font-bold text-xl">AdSense<span className="text-green-600">Audit</span> Pro</span>
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/">Home</Link>
            <Link href="/blog" className="text-green-600">Blog</Link>
            <Link href="/admin" className="text-xs px-2 py-1 bg-gray-100 rounded">Admin</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Blog</h1>
        <p className="text-gray-600 mb-10">Guides for AdSense readiness.</p>
        <div className="space-y-6">
          {blogs.map((b) => (
            <Link key={b.id} href={`/blog/${b.slug}`} className="block bg-white border rounded-xl p-6 hover:shadow-md transition">
              <div className="text-xs text-gray-400 mb-1">{b.createdAt?.slice(0, 10)} · {b.author}</div>
              <h2 className="font-bold text-xl">{b.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{b.excerpt}</p>
            </Link>
          ))}
          {!blogs.length && <p className="text-gray-500">No posts yet.</p>}
        </div>
      </main>
    </div>
  );
}
