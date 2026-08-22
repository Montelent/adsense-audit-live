'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RichEditor from '../components/RichEditor';

const TABS = [
  ['dashboard', 'Dashboard'],
  ['content', 'Homepage'],
  ['blogs', 'Blog'],
  ['ads', 'Ad codes'],
  ['scripts', 'Scripts / Meta'],
  ['users', 'Users'],
];

const AD_FIELDS = [
  ['header', 'Global header ad (all pages)'],
  ['homepage', 'Homepage top'],
  ['homepageMiddle', 'Homepage middle (after results)'],
  ['blog', 'Blog listing page'],
  ['postBegin', 'Beginning of blog posts'],
  ['postMiddle', 'Middle of blog posts'],
  ['postEnd', 'End of blog posts'],
  ['footer', 'Global footer ad'],
];

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [editor, setEditor] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [msg, setMsg] = useState('');
  const [settings, setSettings] = useState({});
  const [ads, setAds] = useState({});
  const [scripts, setScripts] = useState({});
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  function flash(t) {
    setMsg(t);
    setTimeout(() => setMsg(''), 2500);
  }

  async function loadAll() {
    const res = await fetch('/api/blogs?all=1');
    if (res.status === 401) {
      setUser(null);
      return false;
    }
    const data = await res.json();
    setBlogs(data.blogs || []);
    setStats(data.stats || null);
    const s = await fetch('/api/settings?type=all').then((r) => r.json());
    setSettings(s.settings || {});
    setAds(s.ads || {});
    setScripts(s.scripts || {});
    return true;
  }

  useEffect(() => {
    loadAll().then((ok) => {
      if (ok) setUser({ name: 'Admin', email: 'admin' });
    });
  }, []);

  function openEditor(post) {
    if (!post) {
      setEditor({ id: null, title: '', slug: '', excerpt: '', content: '', author: 'Admin', published: true });
      setPostContent('');
    } else {
      setEditor(post);
      setPostContent(post.content || '');
    }
  }

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
    loadAll();
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }

  async function saveSettings(e) {
    e.preventDefault();
    const form = e.target;
    const next = {};
    Array.from(form.elements).forEach((el) => {
      if (el.name) next[el.name] = el.value;
    });
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: next }) });
    setSettings((s) => ({ ...s, ...next }));
    flash('Homepage texts saved');
  }

  async function saveAds(e) {
    e.preventDefault();
    const form = e.target;
    const next = {};
    AD_FIELDS.forEach(([k]) => {
      next[k] = form.elements[k]?.value || '';
    });
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ads: next }) });
    setAds(next);
    flash('Ad codes saved');
  }

  async function saveScripts(e) {
    e.preventDefault();
    const form = e.target;
    const next = {
      head: form.elements.head.value,
      bodyStart: form.elements.bodyStart.value,
      bodyEnd: form.elements.bodyEnd.value,
    };
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scripts: next }) });
    setScripts(next);
    flash('Scripts saved');
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      flash('New passwords do not match');
      return;
    }
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'password',
        userId: 'admin-1',
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error || 'Failed');
      return;
    }
    setPwForm({ current: '', next: '', confirm: '' });
    flash('Password updated — use it next login');
  }

  async function savePost(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      title: form.title.value,
      slug: form.slug.value,
      excerpt: form.excerpt.value,
      content: postContent,
      author: form.author.value || 'Admin',
      published: form.published.checked,
    };
    if (editor?.id) {
      await fetch(`/api/blogs/${editor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch('/api/blogs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    setEditor(null);
    setPostContent('');
    flash('Post saved');
    loadAll();
  }

  async function deletePost(id) {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
    loadAll();
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center">A</div>
            <div><div className="font-bold text-lg">Admin Login</div><div className="text-xs text-gray-500">AdSense Audit Pro</div></div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border" placeholder="Username" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border" placeholder="Password" required />
            <p className="text-xs text-gray-400">Default: admin / admin123</p>
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl">Sign in</button>
          </form>
          <Link href="/" className="block text-center text-sm text-gray-500 mt-6">← Back to site</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center text-sm">A</div>
            <span className="font-bold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500 hidden sm:inline">{user.email}</span>
            <Link href="/" target="_blank" className="text-green-700 font-medium">View site ↗</Link>
            <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-3">
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === id ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-white'}`}>{label}</button>
          ))}
        </div>

        {msg && <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg">{msg}</div>}

        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border p-5 shadow-sm"><div className="text-sm text-gray-500">Posts</div><div className="text-3xl font-bold mt-1 text-green-700">{stats?.blogs ?? 0}</div></div>
              <div className="bg-white rounded-xl border p-5 shadow-sm"><div className="text-sm text-gray-500">Published</div><div className="text-3xl font-bold mt-1">{stats?.publishedBlogs ?? 0}</div></div>
              <div className="bg-white rounded-xl border p-5 shadow-sm"><div className="text-sm text-gray-500">Users</div><div className="text-3xl font-bold mt-1">{stats?.users ?? 1}</div></div>
              <div className="bg-white rounded-xl border p-5 shadow-sm"><div className="text-sm text-gray-500">Audits run</div><div className="text-3xl font-bold mt-1">{stats?.recentAudits ?? 0}</div></div>
            </div>
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h2 className="font-bold text-lg mb-2">Control center</h2>
              <p className="text-sm text-gray-600 mb-4">Manage content, ads, scripts, and users from the tabs above.</p>
            </div>
          </div>
        )}

        {tab === 'content' && (
          <form onSubmit={saveSettings} className="bg-white border rounded-xl p-6 space-y-3 shadow-sm">
            <h2 className="font-bold text-lg mb-2">Homepage texts</h2>
            {[ ['siteName', 'Site name'], ['heroBadge', 'Hero badge'], ['heroTitle', 'Hero title'], ['heroHighlight', 'Hero highlight'], ['heroSubtitle', 'Hero subtitle'], ['auditButton', 'Audit button'], ['howTitle', 'How title'], ['howSubtitle', 'How subtitle'], ['checklistTitle', 'Checklist title'], ['faqTitle', 'FAQ title'], ['footerNote', 'Footer note'] ].map(([name, label]) => (
              <div key={name}>
                <label className="text-xs font-medium text-gray-500">{label}</label>
                {name.includes('Subtitle') || name === 'footerNote' || name === 'heroSubtitle' ? (
                  <textarea name={name} defaultValue={settings[name] || ''} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
                ) : (
                  <input name={name} defaultValue={settings[name] || ''} className="w-full border rounded-lg px-3 py-2 text-sm" />
                )}
              </div>
            ))}
            <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium">Save homepage</button>
          </form>
        )}

        {tab === 'ads' && (
          <form onSubmit={saveAds} className="bg-white border rounded-xl p-6 space-y-4 shadow-sm">
            <h2 className="font-bold text-lg">Ad codes</h2>
            {AD_FIELDS.map(([name, label]) => (
              <div key={name}>
                <label className="text-sm font-medium">{label}</label>
                <textarea name={name} defaultValue={ads[name] || ''} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm font-mono mt-1" />
              </div>
            ))}
            <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium">Save ad codes</button>
          </form>
        )}

        {tab === 'scripts' && (
          <form onSubmit={saveScripts} className="bg-white border rounded-xl p-6 space-y-4 shadow-sm">
            <h2 className="font-bold text-lg">Analytics and verification scripts</h2>
            <div>
              <label className="text-sm font-medium">Head scripts / meta</label>
              <textarea name="head" defaultValue={scripts.head || ''} rows={5} className="w-full border rounded-lg px-3 py-2 text-sm font-mono mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Body start</label>
              <textarea name="bodyStart" defaultValue={scripts.bodyStart || ''} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm font-mono mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Body end</label>
              <textarea name="bodyEnd" defaultValue={scripts.bodyEnd || ''} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm font-mono mt-1" />
            </div>
            <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium">Save scripts</button>
          </form>
        )}

        {tab === 'blogs' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Blog posts</h2>
              <button onClick={() => openEditor(null)} className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl">+ New post</button>
            </div>
            {editor && (
              <form onSubmit={savePost} className="bg-white border rounded-xl p-6 mb-6 space-y-3 shadow-sm">
                <p className="text-sm text-gray-500">Rich editor (headings, lists, links, images, tables — similar to WordPress)</p>
                <input name="title" defaultValue={editor.title} required placeholder="Title" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input name="slug" defaultValue={editor.slug} placeholder="url-slug" className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
                <input name="author" defaultValue={editor.author} placeholder="Author" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <textarea name="excerpt" defaultValue={editor.excerpt} placeholder="Short excerpt" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Post body</label>
                  <RichEditor key={editor.id || 'new'} value={postContent} onChange={setPostContent} height={440} />
                </div>
                <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" defaultChecked={editor.published} /> Published</label>
                <div className="flex gap-2">
                  <button type="submit" className="px-5 py-2 bg-green-600 text-white text-sm rounded-xl">Save post</button>
                  <button type="button" onClick={() => { setEditor(null); setPostContent(''); }} className="px-5 py-2 bg-gray-100 text-sm rounded-xl">Cancel</button>
                </div>
              </form>
            )}
            <div className="space-y-3">
              {blogs.map((b) => (
                <div key={b.id} className="bg-white border rounded-xl p-4 flex flex-wrap justify-between gap-3 shadow-sm">
                  <div>
                    <div className="font-medium">{b.title}</div>
                    <div className="text-xs text-gray-500">{b.createdAt?.slice(0, 10)} · /{b.slug} · {b.published ? 'Published' : 'Draft'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditor(b)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100">Edit</button>
                    <button onClick={() => deletePost(b.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Admin account</h2>
            <div className="border rounded-lg p-4 flex justify-between items-center mb-6">
              <div><div className="font-medium">{user.name || 'Admin'}</div><div className="text-sm text-gray-500">{user.email} · role: admin</div></div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
            </div>
            <h3 className="font-semibold mb-3">Change password</h3>
            <form onSubmit={changePassword} className="space-y-3 max-w-md">
              <input type="password" placeholder="Current password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
              <input type="password" placeholder="New password (min 6)" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required minLength={6} />
              <input type="password" placeholder="Confirm new password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
              <button type="submit" className="px-5 py-2 bg-green-600 text-white text-sm rounded-xl">Update password</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
