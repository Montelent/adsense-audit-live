import { COOKIE } from '../../../../lib/auth.js';

export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.set('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
  return res;
}
