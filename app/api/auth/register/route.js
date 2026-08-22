import { register, createToken, jsonWithSession } from '../../../../lib/auth.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await register({
      email: body.email,
      password: body.password,
      name: body.name,
    });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    const token = await createToken(result.user);
    return jsonWithSession({ ok: true, user: result.user }, token);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
