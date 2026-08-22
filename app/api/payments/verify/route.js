import { requireUser } from '../../../../lib/auth.js';
import { verifyPaystack, verifyMonnify, activateProFromPayment } from '../../../../lib/payments-auto.js';

export async function POST(request) {
  const session = await requireUser(request);
  if (!session) return Response.json({ error: 'Login required' }, { status: 401 });

  try {
    const body = await request.json();
    const method = (body.method || '').toLowerCase();
    const reference = body.reference || body.trxref || body.paymentReference;

    if (!reference) return Response.json({ error: 'Reference required' }, { status: 400 });

    let verified;
    if (method === 'paystack') verified = await verifyPaystack(reference);
    else if (method === 'monnify') verified = await verifyMonnify(reference);
    else return Response.json({ error: 'Only paystack and monnify support auto-verify' }, { status: 400 });

    if (!verified.ok) return Response.json({ error: verified.error }, { status: 400 });

    const userId = verified.userId || session.sub;
    const act = activateProFromPayment({
      userId,
      email: verified.email || session.email,
      method,
      reference: verified.reference,
      amount: verified.amount,
    });

    if (!act.ok) return Response.json({ error: act.error }, { status: 400 });

    return Response.json({
      ok: true,
      message: 'Payment verified. Pro activated.',
      plan: 'pro',
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
