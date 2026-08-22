'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RichEditor from '../components/RichEditor';
import PaymentSettings from './PaymentSettings';
import EmailSettings from './EmailSettings';
import UsersPanel from './UsersPanel';

const TABS = [
  ['dashboard', 'Dashboard'],
  ['content', 'Homepage'],
  ['blogs', 'Blog'],
  ['ads', 'Ad codes'],
  ['scripts', 'Scripts'],
  ['plans', 'Plans'],
  ['payments', 'Payments'],
  ['email', 'Email'],
  ['users', 'Users'],
];

const AD_FIELDS = [
  ['header', 'Global header ad'],
  ['homepage', 'Homepage top'],
  ['homepageMiddle', 'Homepage middle'],
  ['blog', 'Blog listing'],
  ['postBegin', 'Post beginning'],
  ['postMiddle', 'Post middle'],
  ['postEnd', 'Post end'],
  ['footer', 'Footer ad'],
];

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
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
  const [plan, setPlan] = useState({});
  const [payments, setPayments] = useState({});
  const [mail, setMail] = useState({});
  const [users, setUsers] = useState([]);
  const [payReqs, setPayReqs] = useState([]);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [booting, setBooting] = useState(true);

  function flash(t) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  async function loadAll() {
    const me = await fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((r) => r.json())
      .catch(() => ({}));
    if (!me.user || me.user.role !== 'admin') {
      setUser(null);
      return false;
    }
    setUser({
      id: me.user.id,
      name: me.user.name || 'Admin',
      email: me.user.email,
      role: 'admin',
      plan: me.user.plan || 'pro',
    });
    try {
      const res = await fetch('/api/blogs?all=1', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        setBlogs(data.blogs || []);
        setStats(data.stats || null);
      }
      const s = await fetch('/api/settings?type=all', { credentials: 'same-origin' }).then((r) => r.json());
      setSettings(s.settings || {});
      setAds(s.ads || {});
      setScripts(s.scripts || {});
      setPlan(s.plan || {});
      setPayments(s.payments || {});
      setMail(s.mail || {});
      const u = await fetch('/api/users', { credentials: 'same-origin' }).then((r) => r.json());
      setUsers(u.users || []);
      const pr = await fetch('/api/users?payments=1', { credentials: 'same-origin' }).then((r) => r.json());
      setPayReqs(pr.payments || []);
    } catch (err) {
      console.error('admin load', err);
    }
    return true;
  }

  useEffect(() => {
    loadAll().finally(() => setBooting(false));
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
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoginError(data.error || 'Login failed');
      return;
    }
    if (data.user?.role !== 'admin') {
      setLoginError('Admin access only');
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      return;
    }
    setUser(data.user);
    setPassword('');
    await new Promise((r) => setTimeout(r, 80));
    const ok = await loadAll();
    if (!ok) {
      setLoginError('Session cookie not accepted. Hard-refresh and try again.');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    setUser(null);
  }

  async function saveSettings(e) {
    e.preventDefault();
    const form = e.target;
    const next = {};
    Array.from(form.elements).forEach((el) => {
      if (el.name) next[el.name] = el.value;
    });
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ settings: next }) });
    setSettings((s) => ({ ...s, ...next }));
    flash('Homepage saved');
  }

  async function saveAds(e) {
    e.preventDefault();
    const form = e.target;
    const next = {};
    AD_FIELDS.forEach(([k]) => {
      next[k] = form.elements[k]?.value || '';
    });
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ ads: next }) });
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
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ scripts: next }) });
    setScripts(next);
    flash('Scripts saved');
  }

  async function savePlan(e) {
    e.preventDefault();
    const form = e.target;
    const next = {
      freeName: form.freeName.value,
      proName: form.proName.value,
      proPrice: form.proPrice.value,
      proCurrency: form.proCurrency.value,
      proInterval: form.proInterval.value,
      freeMaxSamples: Number(form.freeMaxSamples.value) || 20,
      proMaxSamples: Number(form.proMaxSamples.value) || 200,
      freeFeatures: form.freeFeatures.value.split('\n').map((x) => x.trim()).filter(Boolean),
      proFeatures: form.proFeatures.value.split('\n').map((x) => x.trim()).filter(Boolean),
      freeEnabled: form.freeEnabled.checked,
      proEnabled: form.proEnabled.checked,
    };
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ plan: next }) });
    setPlan(next);
    flash('Plans saved');
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      flash('Passwords do not match');
      return;
    }
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        action: 'password',
        userId: user?.id || 'admin-1',
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
    flash('Password updated');
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
      await fetch(`/api/blogs/${editor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) });
    } else {
      await fetch('/api/blogs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) });
    }
    setEditor(null);
    setPostContent('');
    flash('Post saved');
    loadAll();
  }

  async function deletePost(id) {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/blogs/${id}`, { method: 'DELETE', credentials: 'same-origin' });
    loadAll();
  }

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border">
          <div className="font-bold text-lg mb-4">Admin Login</div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border" placeholder="Username / email" required autoComplete="username" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border" placeholder="Password" required autoComplete="current-password" />
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl">Sign in</button>
          </form>
          <Link href="/" className="block text-center text-sm text-gray-500 mt-6">← Site</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold">Admin Panel</span>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-green-700">View site</Link>
            <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-gray-100">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-3">
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-3 py-2 rounded-lg text-sm font-medium ${tab === id ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-white'}`}>{label}</button>
          ))}
        </div>

        {msg && <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg">{msg}</div>}

        {tab === 'dashboard' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-5"><div className="text-sm text-gray-500">Users</div><div className="text-3xl font-bold">{stats?.users ?? users.length}</div></div>
            <div className="bg-white rounded-xl border p-5"><div className="text-sm text-gray-500">Posts</div><div className="text-3xl font-bold">{stats?.blogs ?? 0}</div></div>
            <div className="bg-white rounded-xl border p-5"><div className="text-sm text-gray-500">Audits</div><div className="text-3xl font-bold">{stats?.recentAudits ?? 0}</div></div>
            <div className="bg-white rounded-xl border p-5"><div className="text-sm text-gray-500">Pending payments</div><div className="text-3xl font-bold text-amber-600">{stats?.pendingPayments ?? payReqs.filter((p) => p.status === 'pending').length}</div></div>
          </div>
        )}

        {tab === 'content' && (
          <form onSubmit={saveSettings} className="bg-white border rounded-xl p-6 space-y-3">
            <h2 className="font-bold text-lg">Homepage texts</h2>
            {[['siteName', 'Site name'], ['heroBadge', 'Hero badge'], ['heroTitle', 'Hero title'], ['heroHighlight', 'Hero highlight'], ['heroSubtitle', 'Hero subtitle'], ['auditButton', 'Audit button'], ['howTitle', 'How title'], ['howSubtitle', 'How subtitle'], ['checklistTitle', 'Checklist'], ['faqTitle', 'FAQ'], ['footerNote', 'Footer']].map(([name, label]) => (
              <div key={name}>
                <label className="text-xs text-gray-500">{label}</label>
                {name.includes('Subtitle') || name === 'footerNote' || name === 'heroSubtitle' ? (
                  <textarea name={name} defaultValue={settings[name] || ''} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
                ) : (
                  <input name={name} defaultValue={settings[name] || ''} className="w-full border rounded-lg px-3 py-2 text-sm" />
                )}
              </div>
            ))}
            <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-xl">Save</button>
          </form>
        )}

        {tab === 'ads' && (
          <form onSubmit={saveAds} className="bg-white border rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-lg">Ad codes</h2>
            {AD_FIELDS.map(([name, label]) => (
              <div key={name}>
                <label className="text-sm font-medium">{label}</label>
                <textarea name={name} defaultValue={ads[name] || ''} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm font-mono mt-1" />
              </div>
            ))}
            <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-xl">Save</button>
          </form>
        )}

        {tab === 'scripts' && (
          <form onSubmit={saveScripts} className="bg-white border rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-lg">Scripts / verification</h2>
            <div><label className="text-sm">Head</label><textarea name="head" defaultValue={scripts.head || ''} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" /></div>
            <div><label className="text-sm">Body start</label><textarea name="bodyStart" defaultValue={scripts.bodyStart || ''} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" /></div>
            <div><label className="text-sm">Body end</label><textarea name="bodyEnd" defaultValue={scripts.bodyEnd || ''} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" /></div>
            <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-xl">Save</button>
          </form>
        )}

        {tab === 'plans' && (
          <form onSubmit={savePlan} className="bg-white border rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-lg">Free & Pro plans</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm"><input name="freeEnabled" type="checkbox" defaultChecked={plan.freeEnabled !== false} /> Free enabled</label>
              <label className="flex items-center gap-2 text-sm"><input name="proEnabled" type="checkbox" defaultChecked={plan.proEnabled !== false} /> Pro enabled</label>
              <div><label className="text-xs text-gray-500">Free name</label><input name="freeName" defaultValue={plan.freeName || 'Free'} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-500">Pro name</label><input name="proName" defaultValue={plan.proName || 'Pro'} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-500">Pro price</label><input name="proPrice" defaultValue={plan.proPrice || '29'} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-500">Currency</label><input name="proCurrency" defaultValue={plan.proCurrency || 'USD'} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-500">Interval</label><input name="proInterval" defaultValue={plan.proInterval || 'month'} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-500">Free max posts</label><input name="freeMaxSamples" type="number" defaultValue={plan.freeMaxSamples || 20} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-500">Pro max posts</label><input name="proMaxSamples" type="number" defaultValue={plan.proMaxSamples || 200} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div><label className="text-xs text-gray-500">Free features (one per line)</label><textarea name="freeFeatures" defaultValue={(plan.freeFeatures || []).join('\n')} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500">Pro features (one per line)</label><textarea name="proFeatures" defaultValue={(plan.proFeatures || []).join('\n')} rows={5} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-xl">Save plans</button>
          </form>
        )}

        {tab === 'payments' && (
          <PaymentSettings payments={payments} onSaved={setPayments} flash={flash} />
        )}

        {tab === 'email' && (
          <EmailSettings mail={mail} onSaved={setMail} flash={flash} />
        )}

        {tab === 'blogs' && (
          <div>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Blog</h2>
              <button onClick={() => openEditor(null)} className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl">+ New</button>
            </div>
            {editor && (
              <form onSubmit={savePost} className="bg-white border rounded-xl p-6 mb-6 space-y-3">
                <input name="title" defaultValue={editor.title} required placeholder="Title" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input name="slug" defaultValue={editor.slug} placeholder="slug" className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
                <input name="author" defaultValue={editor.author} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <textarea name="excerpt" defaultValue={editor.excerpt} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <RichEditor key={editor.id || 'new'} value={postContent} onChange={setPostContent} height={400} />
                <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" defaultChecked={editor.published} /> Published</label>
                <div className="flex gap-2">
                  <button type="submit" className="px-5 py-2 bg-green-600 text-white text-sm rounded-xl">Save</button>
                  <button type="button" onClick={() => setEditor(null)} className="px-5 py-2 bg-gray-100 text-sm rounded-xl">Cancel</button>
                </div>
              </form>
            )}
            <div className="space-y-3">
              {blogs.map((b) => (
                <div key={b.id} className="bg-white border rounded-xl p-4 flex justify-between gap-3">
                  <div><div className="font-medium">{b.title}</div><div className="text-xs text-gray-500">{b.slug}</div></div>
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
          <div className="space-y-6">
            <UsersPanel users={users} payReqs={payReqs} onRefresh={loadAll} flash={flash} />
            <div className="bg-white border rounded-xl p-6">
              <h3 className="font-semibold mb-3">Change your admin password</h3>
              <form onSubmit={changePassword} className="space-y-3 max-w-md">
                <input type="password" placeholder="Current" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                <input type="password" placeholder="New (min 6)" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required minLength={6} />
                <input type="password" placeholder="Confirm" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                <button type="submit" className="px-5 py-2 bg-green-600 text-white text-sm rounded-xl">Update password</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
