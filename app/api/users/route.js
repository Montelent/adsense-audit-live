import {
  listUsers,
  updateUserPassword,
  updateUser,
  listPaymentRequests,
  updatePaymentRequest,
  addPaymentRequest,
  createUser,
  hasDatabase,
} from '../../../lib/store.js';
import { requireAdmin, requireUser } from '../../../lib/auth.js';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  if (searchParams.get('payments') === '1') {
    return Response.json({ payments: await listPaymentRequests() });
  }
  const users = await listUsers();
  return Response.json({ users, database: hasDatabase() });
}

export async function POST(request) {
  const session = await requireUser(request);
  if (!session) return Response.json({ error: 'Login required' }, { status: 401 });
  try {
    const body = await request.json();
    if (body.action === 'payment_request') {
      const item = await addPaymentRequest({
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
      if (body.force && body.newPassword) {
        const user = await updateUser(userId, { password: body.newPassword });
        if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
        return Response.json({ ok: true, message: 'Password set' });
      }
      const result = await updateUserPassword(userId, body.currentPassword, body.newPassword);
      if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
      return Response.json({ ok: true, message: 'Password updated' });
    }

    if (body.action === 'set_plan' && body.userId) {
      const user = await updateUser(body.userId, { plan: body.plan });
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
      return Response.json({ ok: true, user });
    }

    if (body.action === 'add_credits' && body.userId) {
      const user = await updateUser(body.userId, { addCredits: Number(body.credits) || 0 });
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
      return Response.json({ ok: true, user });
    }

    if (body.action === 'create_user') {
      const user = await createUser({
        email: body.email,
        name: body.name,
        password: body.password || 'changeme123',
        role: body.role || 'user',
        plan: body.plan || 'free',
        credits: Number(body.credits) || 0,
      });
      const { password, ...out } = user;
      return Response.json({ ok: true, user: out });
    }

    if (body.action === 'payment_status' && body.requestId) {
      const item = await updatePaymentRequest(body.requestId, { status: body.status });
      if (!item) return Response.json({ error: 'Not found' }, { status: 404 });
      if (body.status === 'approved' && item.userId) {
        await updateUser(item.userId, { plan: 'pro' });
      }
      return Response.json({ ok: true, request: item });
    }

    if (body.action === 'update_user' && body.userId) {
      const patch = {};
      if (body.name != null) patch.name = body.name;
      if (body.email != null) patch.email = body.email;
      if (body.role === 'user' || body.role === 'admin') patch.role = body.role;
      if (body.plan === 'free' || body.plan === 'pro') patch.plan = body.plan;
      if (typeof body.credits === 'number') patch.credits = body.credits;
      if (body.password && body.password.length >= 6) patch.password = body.password;
      const user = await updateUser(body.userId, patch);
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
      return Response.json({ ok: true, user });
    }

    if (body.userId) {
      const user = await updateUser(body.userId, body);
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
      return Response.json({ ok: true, user });
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
