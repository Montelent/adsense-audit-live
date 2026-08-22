import { SignJWT, jwtVerify } from 'jose';
import { findUserByEmail, createUser, getUserById } from './store.js';

export const COOKIE = 'aap_session';
const secret = () =>
  new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'adsense-audit-pro-dev-secret-change-me');

export async function createToken(user) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role || 'user',
    plan: user.plan || 'free',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
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
  const user = findUserByEmail(email);
  if (user && (user.password || '') === password) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      plan: user.plan || 'free',
    };
  }
  // legacy admin fallback
  if ((email === 'admin' || email === 'admin@local') && password === 'admin123') {
    return { id: 'admin-1', email: 'admin', name: 'Admin', role: 'admin', plan: 'pro' };
  }
  return null;
}

export async function register({ email, password, name }) {
  const e = (email || '').trim().toLowerCase();
  if (!e || !e.includes('@')) return { ok: false, error: 'Valid email required' };
  if (!password || password.length < 6) return { ok: false, error: 'Password must be at least 6 characters' };
  if (findUserByEmail(e)) return { ok: false, error: 'Email already registered' };
  const user = createUser({
    email: e,
    password,
    name: (name || e.split('@')[0]).trim(),
    role: 'user',
    plan: 'free',
  });
  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan },
  };
}

export function getTokenFromRequest(req) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getSession(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  // refresh plan from store if user still exists
  const live = getUserById(payload.sub);
  if (live) {
    return {
      sub: live.id,
      email: live.email,
      role: live.role || 'user',
      plan: live.plan || 'free',
      name: live.name,
    };
  }
  return payload;
}

export async function requireAdmin(req) {
  const session = await getSession(req);
  if (!session || session.role !== 'admin') return null;
  return session;
}

export async function requireUser(req) {
  return getSession(req);
}

/** Admin or user with plan === pro */
export async function isProSession(req) {
  const session = await getSession(req);
  if (!session) return false;
  if (session.role === 'admin') return true;
  return session.plan === 'pro';
}

export function sessionCookie(token) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 3600}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Max-Age=0`;
}
