import { findUserByEmail, consumePasswordResetToken, updateUser } from '../../../../lib/store.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const token = body.token || '';
    const password = body.password || '';

    if (!email || !token) return Response.json({ error: 'Invalid reset link' }, { status: 400 });
    if (!password || password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = findUserByEmail(email);
    if (!user) return Response.json({ error: 'Invalid reset link' }, { status: 400 });

    const ok = consumePasswordResetToken(user.id, token);
    if (!ok) return Response.json({ error: 'Reset link expired or invalid' }, { status: 400 });

    updateUser(user.id, { password });
    return Response.json({ ok: true, message: 'Password updated. You can log in now.' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
