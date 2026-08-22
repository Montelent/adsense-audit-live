import { getPayments, updateUser, addPaymentRequest, updatePaymentRequest, findUserByEmail } from './store.js';

export const AUTO_METHODS = new Set(['paystack', 'monnify', 'paypal']);
export const MANUAL_METHODS = new Set(['bank', 'wire', 'usdt', 'usdc']);

export function isAutoMethod(method) {
  return AUTO_METHODS.has((method || '').toLowerCase());
}

function payCfg(key) {
  return getPayments()[key] || {};
}

export async function initPaystack({ email, amount, userId, callbackUrl, currency = 'NGN' }) {
  const cfg = payCfg('paystack');
  const secret = cfg.secretKey;
  if (!secret) return { ok: false, error: 'Paystack secret key not configured in Admin' };

  const amountKobo = Math.round(Number(amount) * 100);
  if (!amountKobo || amountKobo < 100) return { ok: false, error: 'Invalid amount' };

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      currency,
      callback_url: callbackUrl,
      metadata: { userId, product: 'pro' },
    }),
  });
  const data = await res.json();
  if (!data.status) return { ok: false, error: data.message || 'Paystack init failed' };
  return {
    ok: true,
    method: 'paystack',
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
    accessCode: data.data.access_code,
  };
}

export async function verifyPaystack(reference) {
  const cfg = payCfg('paystack');
  const secret = cfg.secretKey;
  if (!secret) return { ok: false, error: 'Paystack not configured' };

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();
  if (!data.status || data.data?.status !== 'success') {
    return { ok: false, error: data.message || 'Payment not successful' };
  }
  return {
    ok: true,
    method: 'paystack',
    reference: data.data.reference,
    amount: (data.data.amount || 0) / 100,
    currency: data.data.currency,
    email: data.data.customer?.email,
    userId: data.data.metadata?.userId,
  };
}

export async function initMonnify({ email, amount, userId, callbackUrl, customerName }) {
  const cfg = payCfg('monnify');
  if (!cfg.apiKey || !cfg.secretKey || !cfg.contractCode) {
    return { ok: false, error: 'Monnify API key, secret and contract code required in Admin' };
  }

  const auth = Buffer.from(`${cfg.apiKey}:${cfg.secretKey}`).toString('base64');
  const tokenRes = await fetch('https://api.monnify.com/api/v1/auth/login', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}` },
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData?.responseBody?.accessToken;
  if (!accessToken) return { ok: false, error: 'Monnify auth failed — check keys' };

  const paymentReference = `aap_${userId}_${Date.now()}`;
  const res = await fetch('https://api.monnify.com/api/v1/merchant/transactions/init-transaction', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Number(amount),
      customerName: customerName || email,
      customerEmail: email,
      paymentReference,
      paymentDescription: 'AdSense Audit Pro',
      currencyCode: 'NGN',
      contractCode: cfg.contractCode,
      redirectUrl: callbackUrl,
      paymentMethods: ['CARD', 'ACCOUNT_TRANSFER'],
      metaData: { userId },
    }),
  });
  const data = await res.json();
  if (data.requestSuccessful === false || !data.responseBody?.checkoutUrl) {
    return { ok: false, error: data.responseMessage || 'Monnify init failed' };
  }
  return {
    ok: true,
    method: 'monnify',
    authorizationUrl: data.responseBody.checkoutUrl,
    reference: paymentReference,
  };
}

export async function verifyMonnify(paymentReference) {
  const cfg = payCfg('monnify');
  if (!cfg.apiKey || !cfg.secretKey) return { ok: false, error: 'Monnify not configured' };

  const auth = Buffer.from(`${cfg.apiKey}:${cfg.secretKey}`).toString('base64');
  const tokenRes = await fetch('https://api.monnify.com/api/v1/auth/login', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}` },
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData?.responseBody?.accessToken;
  if (!accessToken) return { ok: false, error: 'Monnify auth failed' };

  const res = await fetch(
    `https://api.monnify.com/api/v1/merchant/transactions/query?paymentReference=${encodeURIComponent(paymentReference)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  const body = data.responseBody;
  const paid = body?.paymentStatus === 'PAID' || body?.paymentStatus === 'OVERPAID';
  if (!paid) return { ok: false, error: 'Payment not completed' };
  return {
    ok: true,
    method: 'monnify',
    reference: paymentReference,
    amount: body.amountPaid || body.amount,
    email: body.customerEmail,
    userId: body.metaData?.userId,
  };
}

export async function activateProFromPayment({ userId, email, method, reference, amount }) {
  let uid = userId;
  if (!uid && email) {
    const u = await findUserByEmail(email);
    uid = u?.id;
  }
  if (!uid) return { ok: false, error: 'User not found for payment' };

  await updateUser(uid, { plan: 'pro' });
  const item = await addPaymentRequest({
    userId: uid,
    email: email || '',
    method,
    note: `Auto: ${reference}`,
    amount: amount != null ? String(amount) : '',
    auto: true,
  });
  await updatePaymentRequest(item.id, { status: 'approved', auto: true, reference });
  return { ok: true, userId: uid };
}
