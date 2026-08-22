'use client';

export default function EmailSettings({ mail, onSaved, flash }) {
  async function save(e) {
    e.preventDefault();
    const f = e.target;
    const next = {
      enabled: !!f.enabled.checked,
      host: f.host.value.trim(),
      port: f.port.value.trim() || '587',
      secure: !!f.secure.checked,
      user: f.user.value.trim(),
      pass: f.pass.value,
      fromEmail: f.fromEmail.value.trim(),
      fromName: f.fromName.value.trim(),
    };
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mail: next }),
    });
    onSaved?.(next);
    flash?.('Email / SMTP settings saved');
  }

  const m = mail || {};

  return (
    <form onSubmit={save} className="bg-white border rounded-xl p-6 space-y-4 max-w-2xl">
      <div>
        <h2 className="font-bold text-lg">Email (SMTP)</h2>
        <p className="text-sm text-gray-500 mt-1">
          Used for password reset emails. Works with Gmail, SendGrid, Mailgun, cPanel, or any SMTP host (same idea as PHP mail / SMTP plugins).
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="enabled" type="checkbox" defaultChecked={!!m.enabled} />
        Enable outbound email
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500">SMTP host</label>
          <input name="host" defaultValue={m.host || ''} placeholder="smtp.gmail.com / smtp.sendgrid.net" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Port</label>
          <input name="port" defaultValue={m.port || '587'} placeholder="587 or 465" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm">
            <input name="secure" type="checkbox" defaultChecked={!!m.secure} />
            SSL/TLS (port 465)
          </label>
        </div>
        <div>
          <label className="text-xs text-gray-500">SMTP username</label>
          <input name="user" defaultValue={m.user || ''} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" autoComplete="off" />
        </div>
        <div>
          <label className="text-xs text-gray-500">SMTP password / app password</label>
          <input name="pass" type="password" defaultValue={m.pass || ''} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" autoComplete="new-password" />
        </div>
        <div>
          <label className="text-xs text-gray-500">From email</label>
          <input name="fromEmail" type="email" defaultValue={m.fromEmail || ''} placeholder="noreply@yourdomain.com" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500">From name</label>
          <input name="fromName" defaultValue={m.fromName || ''} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
      </div>
      <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium">Save email settings</button>
    </form>
  );
}
