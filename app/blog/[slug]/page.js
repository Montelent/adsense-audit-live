'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug;
  const [post, setPost] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch('/api/blogs')
      .then((r) => r.json())
      .then((d) => {
        const found = (d.blogs || []).find((b) => b.slug === slug);
        if (found) setPost(found);
        else setMissing(true);
      })
      .catch(() => setMissing(true));
  }, [slug]);

  return (
    <div>
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center">A</div>
            <span className="font-bold text-xl">AdSense<span className="text-green-600">Audit</span> Pro</span>
          </Link>
          <Link href="/blog" className="text-sm text-green-600">← Blog</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12">
        {missing && <p className="text-gray-500">Post not found.</p>}
        {post && (
          <article>
            <div className="text-sm text-gray-500 mb-2">{post.createdAt?.slice(0, 10)} · {post.author}</div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-6">{post.title}</h1>
            <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content || '' }} />
          </article>
        )}
        {!post && !missing && <p className="text-gray-400">Loading…</p>}
      </main>
    </div>
  );
}
