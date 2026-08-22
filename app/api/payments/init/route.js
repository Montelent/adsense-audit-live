import { requireUser } from '../../../../lib/auth.js';
import { getPlan } from '../../../../lib/store.js';
import { initPaystack, initMonnify } from '../../../../lib/payments-auto.js';

export async function POST(request) {
  const session = await requireUser(request);
  if (!session) return Response.json({ error: 'Login required' }, { status: 401 });

  try {
    const body = await request.json();
    const method = (body.method || '').toLowerCase();
    const plan = getPlan();
    const amount = body.amount || plan.proPrice || '29';
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
    const callbackUrl = `${origin}/pricing?paid=${method}`;

    if (method === 'paystack') {
      const currency = body.currency || (plan.proCurrency === 'USD' ? 'USD' : 'NGN');
      const result = await initPaystack({
        email: session.email,
        amount,
        userId: session.sub,
        callbackUrl,
        currency,
      });
      if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
      return Response.json(result);
    }

    if (method === 'monnify') {
      const result = await initMonnify({
        email: session.email,
        amount,
        userId: session.sub,
        callbackUrl,
        customerName: session.name || session.email,
      });
      if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
      return Response.json(result);
    }

    if (method === 'paypal') {
      const { getPayments } = await import('../../../../lib/store.js');
      const cfg = getPayments().paypal || {};
      const link = (cfg.paypalMe || cfg.paymentLink || '').trim();
      if (link) {
        return Response.json({
          ok: true,
          method: 'paypal',
          authorizationUrl: link,
          note: 'Complete payment on PayPal, then return — we verify via reference if available, else use manual request.',
          manualFallback: true,
        });
      }
      return Response.json({ error: 'PayPal link not configured' }, { status: 400 });
    }

    return Response.json({ error: 'Unsupported auto method. Use bank/crypto manual flow.' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
