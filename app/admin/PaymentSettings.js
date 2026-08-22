'use client';

import { METHOD_DEFS } from '../../lib/payments';

const METHOD_KEYS = Object.keys(METHOD_DEFS);

export default function PaymentSettings({ payments, onSaved, flash }) {
  async function savePayments(e) {
    e.preventDefault();
    const form = e.target;
    const next = { instructions: form.instructions.value };
    METHOD_KEYS.forEach((m) => {
      const def = METHOD_DEFS[m];
      const cfg = {
        enabled: !!form.elements[`${m}_enabled`]?.checked,
        label: def.label,
      };
      def.fields.forEach((f) => {
        const el = form.elements[`${m}_${f.key}`];
        cfg[f.key] = el ? el.value : '';
      });
      next[m] = cfg;
    });
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payments: next }),
    });
    onSaved?.(next);
    flash?.('Payment methods saved');
  }

  return (
    <form onSubmit={savePayments} className="space-y-4">
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-bold text-lg mb-1">How customers pay</h2>
        <p className="text-sm text-gray-500 mb-3">Fill only the fields for each method. Customers see labeled values automatically — no need to write a public details paragraph.</p>
        <label className="text-xs font-medium text-gray-500">Instructions shown above payment methods</label>
        <textarea name="instructions" defaultValue={payments.instructions || ''} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
      </div>

      {METHOD_KEYS.map((m) => {
        const def = METHOD_DEFS[m];
        const cfg = payments[m] || {};
        return (
          <div key={m} className="bg-white border rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-lg">{def.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{def.description}</p>
              </div>
              <label className="text-sm flex items-center gap-2 shrink-0">
                <input name={`${m}_enabled`} type="checkbox" defaultChecked={cfg.enabled !== false} />
                Enabled
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {def.fields.map((f) => (
                <div key={f.key} className={f.type === 'url' || f.key.includes('Address') || f.key === 'iban' ? 'sm:col-span-2' : ''}>
                  <label className="text-xs font-medium text-gray-500">
                    {f.label}
                    {f.required ? <span className="text-red-500"> *</span> : null}
                    {f.secret ? <span className="text-gray-400"> · private</span> : null}
                    {f.public ? <span className="text-green-600"> · shown to customers</span> : null}
                  </label>
                  {f.type === 'select' ? (
                    <select
                      name={`${m}_${f.key}`}
                      defaultValue={cfg[f.key] || f.options?.[0] || ''}
                      className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                    >
                      {(f.options || []).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={`${m}_${f.key}`}
                      type={f.type === 'password' ? 'text' : f.type || 'text'}
                      defaultValue={cfg[f.key] || ''}
                      placeholder={f.placeholder || ''}
                      className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 ${f.secret || f.key.toLowerCase().includes('key') || f.key.includes('wallet') ? 'font-mono' : ''}`}
                      autoComplete="off"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium">Save payment methods</button>
    </form>
  );
}
