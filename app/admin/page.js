'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [editor, setEditor] = useState(null);
  const [msg, setMsg] = useState('');

  async function loadBlogs() {
    const res = await fetch('/api/blogs?all=1');
    if (res.status === 401) {
      setUser(null);
      return false;
    }
    const data = await res.json();
    setBlogs(data.blogs || []);
    setStats(data.stats || null);
    return true;
  }

  useEffect(() => {
    loadBlogs().then((ok) => {
      if (ok) setUser({ name: 'Admin', email: 'admin@local' });
    });
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoginError(data.error || 'Login failed');
      return;
    }
    setUser(data.user);
    setPassword('');
    loadBlogs();
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setBlogs([]);
  }

  async function savePost(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      title: form.title.value,
      slug: form.slug.value,
      excerpt: form.excerpt.value,
      content: form.content.value,
      author: form.author.value || 'Admin',
      published: form.published.checked,
    };
    if (editor?.id) {
      await fetch(`/api/blogs/${editor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setEditor(null);
    setMsg('Saved');
    setTimeout(() => setMsg(''), 2000);
    loadBlogs();
  }

  async function deletePost(id) {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
    loadBlogs();
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md border">
          <div className="font-bold text-lg mb-4">Admin Login</div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border" placeholder="Username" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border" placeholder="Password" required />
            <p className="text-xs text-gray-400">Demo: admin / admin123</p>
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl">Sign in</button>
          </form>
          <Link href="/" className="block text-center text-sm text-gray-500 mt-6">← Back to site</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold">Admin Panel</span>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" target="_blank" className="text-gray-600">View site</Link>
            <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-gray-100">Logout</button>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8 border-b pb-2">
          {[['dashboard', 'Dashboard'], ['blogs', 'Blog posts'], ['users', 'Users']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === id ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-100'}`}>{label}</button>
          ))}
        </div>
        {msg && <p className="text-green-600 text-sm mb-4">{msg}</p>}
        {tab === 'dashboard' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-5"><div className="text-sm text-gray-500">Total posts</div><div className="text-3xl font-bold mt-1">{stats?.blogs ?? blogs.length}</div></div>
            <div className="bg-white rounded-xl border p-5"><div className="text-sm text-gray-500">Published</div><div className="text-3xl font-bold mt-1">{stats?.publishedBlogs ?? 0}</div></div>
            <div className="bg-white rounded-xl border p-5"><div className="text-sm text-gray-500">Users</div><div className="text-3xl font-bold mt-1">{stats?.users ?? 1}</div></div>
            <div className="bg-white rounded-xl border p-5"><div className="text-sm text-gray-500">Recent audits</div><div className="text-3xl font-bold mt-1">{stats?.recentAudits ?? 0}</div></div>
            <div className="sm:col-span-2 lg:col-span-4 bg-white rounded-xl border p-6">
              <h2 className="font-bold text-lg mb-2">Live audit engine</h2>
              <p className="text-sm text-gray-600">The homepage runs a real HTTP crawl of HTTPS, Privacy, About, Contact, and mobile signals.</p>
            </div>
          </div>
        )}
        {tab === 'blogs' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Blog posts</h2>
              <button onClick={() => setEditor({ id: null, title: '', slug: '', excerpt: '', content: '', author: 'Admin', published: true })} className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl">+ New post</button>
            </div>
            {editor && (
              <form onSubmit={savePost} className="bg-white border rounded-xl p-6 mb-6 space-y-3">
                <input name="title" defaultValue={editor.title} required placeholder="Title" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input name="slug" defaultValue={editor.slug} placeholder="url-slug" className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
                <input name="author" defaultValue={editor.author} placeholder="Author" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <textarea name="excerpt" defaultValue={editor.excerpt} placeholder="Excerpt" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <textarea name="content" defaultValue={editor.content} placeholder="HTML content" rows={8} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
                <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" defaultChecked={editor.published} /> Published</label>
                <div className="flex gap-2">
                  <button type="submit" className="px-5 py-2 bg-green-600 text-white text-sm rounded-xl">Save</button>
                  <button type="button" onClick={() => setEditor(null)} className="px-5 py-2 bg-gray-100 text-sm rounded-xl">Cancel</button>
                </div>
              </form>
            )}
            <div className="space-y-3">
              {blogs.map((b) => (
                <div key={b.id} className="bg-white border rounded-xl p-4 flex flex-wrap justify-between gap-3">
                  <div>
                    <div className="font-medium">{b.title}</div>
                    <div className="text-xs text-gray-500">{b.createdAt?.slice(0, 10)} · /{b.slug} · {b.published ? 'Published' : 'Draft'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditor(b)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100">Edit</button>
                    <button onClick={() => deletePost(b.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'users' && (
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-bold text-lg mb-4">Users</h2>
            <div className="border rounded-lg p-4 flex justify-between items-center">
              <div><div className="font-medium">Admin</div><div className="text-sm text-gray-500">admin@local · role: admin</div></div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
            </div>
            <p className="text-sm text-gray-500 mt-4">Login: <code className="bg-gray-100 px-1">admin</code> / <code className="bg-gray-100 px-1">admin123</code></p>
          </div>
        )}
      </div>
    </div>
  );
}
