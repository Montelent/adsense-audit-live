'use client';

import { useState } from 'react';

export default function UsersPanel({ users, payReqs, onRefresh, flash }) {
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const [creditAdd, setCreditAdd] = useState({});

  function openEdit(u) {
    setEdit(u.id);
    setForm({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'user',
      plan: u.plan || 'free',
      credits: u.credits || 0,
      password: '',
    });
  }

  async function saveUser(e) {
    e.preventDefault();
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_user',
        userId: edit,
        ...form,
        credits: Number(form.credits) || 0,
        password: form.password || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      flash?.(data.error || 'Failed');
      return;
    }
    flash?.('User updated');
    setEdit(null);
    onRefresh?.();
  }

  async function addCredits(userId) {
    const n = Number(creditAdd[userId] || 0);
    if (!n) return;
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_credits', userId, credits: n }),
    });
    flash?.(`Added ${n} credits`);
    setCreditAdd({ ...creditAdd, [userId]: '' });
    onRefresh?.();
  }

  async function resolvePay(requestId, status) {
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'payment_status', requestId, status }),
    });
    flash?.(status === 'approved' ? 'Approved — Pro activated' : 'Rejected');
    onRefresh?.();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">Users</h2>
        <div className="space-y-4">
          {users.map((u) => (
            <div key={u.id} className="border rounded-lg p-4">
              {edit === u.id ? (
                <form onSubmit={saveUser} className="grid sm:grid-cols-2 gap-3">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="border rounded-lg px-3 py-2 text-sm" />
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border rounded-lg px-3 py-2 text-sm" />
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                  </select>
                  <div>
                    <label className="text-xs text-gray-500">Credits (absolute)</label>
                    <input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">New password (optional)</label>
                    <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg">Save</button>
                    <button type="button" onClick={() => setEdit(null)} className="px-4 py-2 bg-gray-100 text-sm rounded-lg">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap justify-between gap-3 items-start">
                  <div>
                    <div className="font-medium">{u.name || u.email}</div>
                    <div className="text-xs text-gray-500">
                      {u.email} · {u.role} · plan: <strong>{u.plan || 'free'}</strong> · credits: <strong>{u.credits || 0}</strong>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="number"
                      placeholder="+ credits"
                      value={creditAdd[u.id] || ''}
                      onChange={(e) => setCreditAdd({ ...creditAdd, [u.id]: e.target.value })}
                      className="w-24 border rounded-lg px-2 py-1.5 text-xs"
                    />
                    <button onClick={() => addCredits(u.id)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700">Add credits</button>
                    <button onClick={() => openEdit(u)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100">Edit</button>
                    <button
                      onClick={() =>
                        fetch('/api/users', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'set_plan', userId: u.id, plan: 'pro' }),
                        }).then(() => { flash?.('Set Pro'); onRefresh?.(); })
                      }
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white"
                    >
                      Set Pro
                    </button>
                    <button
                      onClick={() =>
                        fetch('/api/users', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'set_plan', userId: u.id, plan: 'free' }),
                        }).then(() => { flash?.('Set Free'); onRefresh?.(); })
                      }
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100"
                    >
                      Set Free
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">Payment activation requests</h2>
        {payReqs.length === 0 && <p className="text-sm text-gray-500">No requests yet</p>}
        <div className="space-y-3">
          {payReqs.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 flex flex-wrap justify-between gap-3">
              <div className="text-sm">
                <div className="font-medium">{p.email}</div>
                <div className="text-gray-500">
                  {p.method} · {p.status}
                  {p.auto ? ' · auto' : ' · manual'}
                  {p.reference ? ` · ${p.reference}` : ''}
                </div>
                {p.note && <div className="text-xs mt-1">{p.note}</div>}
              </div>
              {p.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => resolvePay(p.id, 'approved')} className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white">Approve → Pro</button>
                  <button onClick={() => resolvePay(p.id, 'rejected')} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
