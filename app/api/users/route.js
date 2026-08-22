const { listUsers, updateUserPassword, updateUser, getStore } = require('../../../lib/store');
const { requireAdmin } = require('../../../lib/auth');

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json({ users: listUsers() });
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
