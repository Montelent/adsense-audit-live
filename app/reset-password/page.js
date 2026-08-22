'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import SiteChrome from '../components/SiteChrome';

function ResetForm() {
  const search = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const token = search.get('token') || '';
  const email = search.get('email') || '';

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed');
        return;
      }
      setMsg(data.message);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border rounded-2xl shadow-lg p-8">
      <h1 className="text-2xl font-bold mb-1">Set new password</h1>
      <p className="text-sm text-gray-500 mb-6">{email || 'Use the link from your email'}</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full border rounded-xl px-4 py-3" />
        <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" className="w-full border rounded-xl px-4 py-3" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <button type="submit" disabled={loading || !token} className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-60">
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-6 text-center">
        <Link href="/login" className="text-green-700 font-medium">Log in</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <SiteChrome>
      <main className="max-w-md mx-auto px-4 py-16">
        <Suspense fallback={<div className="text-center text-gray-500">Loading…</div>}>
          <ResetForm />
        </Suspense>
      </main>
    </SiteChrome>
  );
}
