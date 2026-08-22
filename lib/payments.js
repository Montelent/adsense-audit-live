/**
 * Each method only exposes the fields it actually needs.
 * Public copy is built from structured fields (not a free-text dump).
 */

export const METHOD_DEFS = {
  paypal: {
    label: 'PayPal',
    description: 'Customers pay to your PayPal email or PayPal.me link.',
    fields: [
      { key: 'paypalEmail', label: 'PayPal email', type: 'email', required: true, public: true },
      { key: 'paypalMe', label: 'PayPal.me link (optional)', type: 'url', placeholder: 'https://paypal.me/yourname', public: true },
      { key: 'clientId', label: 'PayPal Client ID (optional, for API later)', type: 'text', secret: false },
      { key: 'secretKey', label: 'PayPal Secret (optional)', type: 'password', secret: true },
    ],
  },
  paystack: {
    label: 'Paystack',
    description: 'Card and local payments (NGN and others). Needs public + secret keys.',
    fields: [
      { key: 'publicKey', label: 'Public key', type: 'text', placeholder: 'pk_live_...', required: true },
      { key: 'secretKey', label: 'Secret key', type: 'password', placeholder: 'sk_live_...', required: true, secret: true },
      { key: 'paymentLink', label: 'Payment link (optional)', type: 'url', public: true },
    ],
  },
  monnify: {
    label: 'Monnify',
    description: 'Nigerian collections. Needs API key, secret, and contract code.',
    fields: [
      { key: 'apiKey', label: 'API key', type: 'text', required: true },
      { key: 'secretKey', label: 'Secret key', type: 'password', required: true, secret: true },
      { key: 'contractCode', label: 'Contract code', type: 'text', required: true },
      { key: 'paymentLink', label: 'Payment link (optional)', type: 'url', public: true },
    ],
  },
  usdt: {
    label: 'USDT',
    description: 'Crypto transfer. Only network + wallet address.',
    fields: [
      {
        key: 'network',
        label: 'Network',
        type: 'select',
        options: ['TRC20', 'ERC20', 'BEP20', 'SOL'],
        required: true,
        public: true,
      },
      { key: 'walletAddress', label: 'Wallet address', type: 'text', required: true, public: true },
    ],
  },
  usdc: {
    label: 'USDC',
    description: 'Crypto transfer. Only network + wallet address.',
    fields: [
      {
        key: 'network',
        label: 'Network',
        type: 'select',
        options: ['ERC20', 'SOL', 'BASE', 'BEP20'],
        required: true,
        public: true,
      },
      { key: 'walletAddress', label: 'Wallet address', type: 'text', required: true, public: true },
    ],
  },
  bank: {
    label: 'Bank transfer (local)',
    description: 'Local bank deposit / transfer.',
    fields: [
      { key: 'bankName', label: 'Bank name', type: 'text', required: true, public: true },
      { key: 'accountName', label: 'Account name', type: 'text', required: true, public: true },
      { key: 'accountNumber', label: 'Account number', type: 'text', required: true, public: true },
      { key: 'bankCode', label: 'Bank code (optional)', type: 'text', public: true },
    ],
  },
  wire: {
    label: 'Wire transfer (international)',
    description: 'SWIFT / IBAN international wire.',
    fields: [
      { key: 'bankName', label: 'Bank name', type: 'text', required: true, public: true },
      { key: 'accountName', label: 'Beneficiary name', type: 'text', required: true, public: true },
      { key: 'iban', label: 'IBAN / Account number', type: 'text', required: true, public: true },
      { key: 'swift', label: 'SWIFT / BIC', type: 'text', required: true, public: true },
      { key: 'bankAddress', label: 'Bank address (optional)', type: 'text', public: true },
      { key: 'country', label: 'Country (optional)', type: 'text', public: true },
    ],
  },
};

export function defaultMethodConfig(key) {
  const def = METHOD_DEFS[key];
  if (!def) return { enabled: false, label: key };
  const cfg = { enabled: true, label: def.label };
  def.fields.forEach((f) => {
    cfg[f.key] = '';
  });
  return cfg;
}

export function defaultPayments() {
  const payments = {
    instructions:
      'Pay with any enabled method below. Then log in, open Pricing, and submit “I have paid” with your reference so we can activate Pro.',
  };
  Object.keys(METHOD_DEFS).forEach((k) => {
    payments[k] = defaultMethodConfig(k);
  });
  return payments;
}

/** Build customer-facing lines from filled structured fields only */
export function publicLines(methodKey, cfg = {}) {
  const def = METHOD_DEFS[methodKey];
  if (!def) return [];
  const lines = [];
  def.fields.forEach((f) => {
    if (!f.public) return;
    const val = (cfg[f.key] || '').trim();
    if (!val) return;
    lines.push({ label: f.label.replace(/\s*\(optional\)/i, ''), value: val });
  });
  return lines;
}

export function isMethodReady(methodKey, cfg = {}) {
  const def = METHOD_DEFS[methodKey];
  if (!def || !cfg.enabled) return false;
  return def.fields
    .filter((f) => f.required)
    .every((f) => (cfg[f.key] || '').trim().length > 0);
}
