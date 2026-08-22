'use client';

import { useState } from 'react';
import Link from 'next/link';
import SiteChrome from '../components/SiteChrome';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed');
        return;
      }
      setMsg(data.message || 'Check your email for a reset link.');
      if (data.mailError) setError('Note: ' + data.mailError);
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
          <h1 className="text-2xl font-bold mb-1">Forgot password</h1>
          <p className="text-sm text-gray-500 mb-6">We will email you a reset link (SMTP must be configured).</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your account email" className="w-full border rounded-xl px-4 py-3" />
            {error && <p className="text-sm text-amber-700">{error}</p>}
            {msg && <p className="text-sm text-green-700">{msg}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-60">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-6 text-center">
            <Link href="/login" className="text-green-700 font-medium">Back to login</Link>
          </p>
        </div>
      </main>
    </SiteChrome>
  );
}
