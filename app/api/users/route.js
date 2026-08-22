import {
  listUsers,
  updateUserPassword,
  updateUser,
  listPaymentRequests,
  updatePaymentRequest,
  addPaymentRequest,
} from '../../../lib/store.js';
import { requireAdmin, requireUser } from '../../../lib/auth.js';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  if (searchParams.get('payments') === '1') {
    return Response.json({ payments: listPaymentRequests() });
  }
  return Response.json({ users: listUsers() });
}

export async function POST(request) {
  // User submits "I paid" request
  const session = await requireUser(request);
  if (!session) return Response.json({ error: 'Login required' }, { status: 401 });
  try {
    const body = await request.json();
    if (body.action === 'payment_request') {
      const item = addPaymentRequest({
        userId: session.sub,
        email: session.email,
        method: body.method || 'other',
        note: body.note || '',
        amount: body.amount || '',
      });
      return Response.json({ ok: true, request: item });
    }
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (body.action === 'password') {
      const userId = body.userId || admin.sub || 'admin-1';
      const result = updateUserPassword(userId, body.currentPassword, body.newPassword);
      if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
      return Response.json({ ok: true, message: 'Password updated' });
    }
    if (body.action === 'set_plan' && body.userId) {
      const user = updateUser(body.userId, { plan: body.plan });
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
      return Response.json({ ok: true, user });
    }
    if (body.action === 'payment_status' && body.requestId) {
      const item = updatePaymentRequest(body.requestId, { status: body.status });
      if (!item) return Response.json({ error: 'Not found' }, { status: 404 });
      if (body.status === 'approved' && item.userId) {
        updateUser(item.userId, { plan: 'pro' });
      }
      return Response.json({ ok: true, request: item });
    }
    if (body.userId) {
      const user = updateUser(body.userId, body);
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
      return Response.json({ ok: true, user });
    }
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
