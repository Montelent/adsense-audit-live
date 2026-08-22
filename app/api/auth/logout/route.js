import { clearSessionCookie } from '../../../../lib/auth.js';

export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.set('Set-Cookie', clearSessionCookie());
  return res;
}
