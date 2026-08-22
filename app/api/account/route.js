import { getUserById, updateUser, updateUserPassword } from '../../../lib/store.js';
import { requireUser, createToken, jsonWithSession } from '../../../lib/auth.js';

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role || 'user',
    plan: u.plan || 'free',
    credits: u.credits || 0,
    createdAt: u.createdAt,
  };
}

export async function GET(request) {
  const session = await requireUser(request);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await getUserById(session.sub);
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
  return Response.json({ user: publicUser(user) });
}

export async function PUT(request) {
  const session = await requireUser(request);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();

    if (body.action === 'password') {
      const result = await updateUserPassword(session.sub, body.currentPassword, body.newPassword);
      if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
      return Response.json({ ok: true, message: 'Password updated' });
    }

    const patch = {};
    if (typeof body.name === 'string') patch.name = body.name.trim().slice(0, 80);
    if (typeof body.email === 'string') {
      const e = body.email.trim().toLowerCase();
      if (!e.includes('@')) return Response.json({ error: 'Invalid email' }, { status: 400 });
      patch.email = e;
    }

    const user = await updateUser(session.sub, patch);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const full = await getUserById(session.sub);
    const token = await createToken(full);
    return jsonWithSession({ ok: true, user: publicUser(full) }, token);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
