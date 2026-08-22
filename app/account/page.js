'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteChrome from '../components/SiteChrome';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/account')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.push('/login');
          return;
        }
        setUser(d.user);
        setName(d.user.name || '');
        setEmail(d.user.email || '');
      })
      .catch(() => router.push('/login'));
  }, [router]);

  async function saveProfile(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    const res = await fetch('/api/account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed');
      return;
    }
    setUser(data.user);
    setMsg('Profile saved');
  }

  async function savePassword(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    if (pw.next !== pw.confirm) {
      setError('New passwords do not match');
      return;
    }
    const res = await fetch('/api/account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'password',
        currentPassword: pw.current,
        newPassword: pw.next,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed');
      return;
    }
    setPw({ current: '', next: '', confirm: '' });
    setMsg('Password updated');
  }

  if (!user) {
    return (
      <SiteChrome>
        <main className="max-w-lg mx-auto px-4 py-16 text-center text-gray-500">Loading…</main>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
      <main className="max-w-lg mx-auto px-4 py-14 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">My account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Plan: <strong className="text-green-700">{user.plan || 'free'}</strong>
            {' · '}Credits: <strong>{user.credits || 0}</strong>
          </p>
        </div>

        {msg && <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg">{msg}</div>}
        {error && <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

        <form onSubmit={saveProfile} className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold">Profile</h2>
          <div>
            <label className="text-xs text-gray-500">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-xl px-4 py-2.5 mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-xl px-4 py-2.5 mt-1" />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium">Save profile</button>
        </form>

        <form onSubmit={savePassword} className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold">Change password</h2>
          <input type="password" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="w-full border rounded-xl px-4 py-2.5" required />
          <input type="password" placeholder="New password (min 6)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="w-full border rounded-xl px-4 py-2.5" required minLength={6} />
          <input type="password" placeholder="Confirm new password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className="w-full border rounded-xl px-4 py-2.5" required />
          <button type="submit" className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium">Update password</button>
        </form>

        <p className="text-sm text-gray-500">
          Need Pro? <Link href="/pricing" className="text-green-700 font-medium">View pricing</Link>
        </p>
      </main>
    </SiteChrome>
  );
}
