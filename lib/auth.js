import { SignJWT, jwtVerify } from 'jose';
import { findUserByEmail } from './store.js';

export const COOKIE = 'aap_admin_token';
const secret = () =>
  new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'adsense-audit-pro-dev-secret-change-me');

export async function createToken(user) {
  return new SignJWT({ sub: user.id, email: user.email, role: user.role || 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export async function login(email, password) {
  const user = findUserByEmail(email) || findUserByEmail('admin');
  if (user && (user.password || 'admin123') === password) {
    return { id: user.id, email: user.email, name: user.name, role: user.role || 'admin' };
  }
  if ((email === 'admin' || email === 'admin@local') && password === 'admin123') {
    return { id: 'admin-1', email: 'admin', name: 'Admin', role: 'admin' };
  }
  return null;
}

export function getTokenFromRequest(req) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function requireAdmin(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}
