import { createHmac } from 'crypto';
import { getPayments } from '../../../../../lib/store.js';
import { activateProFromPayment } from '../../../../../lib/payments-auto.js';

export async function POST(request) {
  try {
    const raw = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';
    const secret = getPayments().paystack?.secretKey || '';
    if (secret) {
      const hash = createHmac('sha512', secret).update(raw).digest('hex');
      if (hash !== signature) {
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(raw);
    if (event.event === 'charge.success' && event.data?.status === 'success') {
      const d = event.data;
      activateProFromPayment({
        userId: d.metadata?.userId,
        email: d.customer?.email,
        method: 'paystack',
        reference: d.reference,
        amount: (d.amount || 0) / 100,
      });
    }
    return Response.json({ received: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
