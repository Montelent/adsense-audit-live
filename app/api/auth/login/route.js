import { login, createToken, jsonWithSession } from '../../../../lib/auth.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = (body.email || body.username || '').trim();
    const password = body.password || '';
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }
    const user = await login(email, password);
    if (!user) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    const token = await createToken(user);
    return jsonWithSession(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
        },
      },
      token
    );
  } catch (err) {
    console.error('login error', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
