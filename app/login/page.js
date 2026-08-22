'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteChrome from '../components/SiteChrome';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      if (data.user?.role === 'admin') router.push('/admin');
      else router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteChrome>
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-1">Log in</h1>
          <p className="text-sm text-gray-500 mb-6">Access your account and Pro features</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border rounded-xl px-4 py-3" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full border rounded-xl px-4 py-3" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-6 text-center">
            No account? <Link href="/register" className="text-green-700 font-medium">Create one</Link>
          </p>
          <p className="text-xs text-gray-400 mt-2 text-center">Admin? Use /admin with admin credentials</p>
        </div>
      </main>
    </SiteChrome>
  );
}
