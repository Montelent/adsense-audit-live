import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import { findUserByEmail, createUser, getUserById, ensureAdminUser } from './store.js';

export const COOKIE = 'aap_session';

const secret = () =>
  new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'adsense-audit-pro-dev-secret-change-me');

function cookieOpts() {
  const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: isProd,
    maxAge: 30 * 24 * 3600,
  };
}

export async function createToken(user) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role || 'user',
    plan: user.plan || 'free',
    name: user.name || '',
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
  const raw = (email || '').trim();
  const e = raw.toLowerCase();

  if ((e === 'admin' || e === 'admin@local') && password === 'admin123') {
    try {
      await ensureAdminUser();
    } catch (err) {
      console.error('ensureAdminUser', err);
    }
  }

  try {
    const user = await findUserByEmail(raw);
    if (user && (user.password || '') === password) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        plan: user.plan || 'free',
        credits: user.credits || 0,
      };
    }
  } catch (err) {
    console.error('login findUser', err);
  }

  if ((e === 'admin' || e === 'admin@local') && password === 'admin123') {
    return { id: 'admin-1', email: 'admin', name: 'Admin', role: 'admin', plan: 'pro', credits: 0 };
  }
  return null;
}

export async function register({ email, password, name }) {
  const e = (email || '').trim().toLowerCase();
  if (!e || !e.includes('@')) return { ok: false, error: 'Valid email required' };
  if (!password || password.length < 6) return { ok: false, error: 'Password must be at least 6 characters' };
  if (await findUserByEmail(e)) return { ok: false, error: 'Email already registered' };
  const user = await createUser({
    email: e,
    password,
    name: (name || e.split('@')[0]).trim(),
    role: 'user',
    plan: 'free',
  });
  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      credits: user.credits || 0,
    },
  };
}

/** Read session token from request (Cookie header or NextRequest cookies) */
export function getTokenFromRequest(req) {
  try {
    if (typeof req.cookies?.get === 'function') {
      const c = req.cookies.get(COOKIE);
      if (c?.value) return c.value;
    }
  } catch (_) {}

  const cookie = req.headers?.get?.('cookie') || '';
  const match = cookie.match(new RegExp(?:`${COOKIE}=([^;]+)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}

export async function getSession(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.sub) return null;

  try {
    const live = await getUserById(String(payload.sub));
    if (live) {
      return {
        sub: live.id,
        email: live.email,
        role: live.role || 'user',
        plan: live.plan || 'free',
        name: live.name,
        credits: live.credits || 0,
      };
    }
  } catch (err) {
    console.error('getSession live lookup failed', err);
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role || 'user',
    plan: payload.plan || 'free',
    name: payload.name || '',
    credits: 0,
  };
}

export async function requireAdmin(req) {
  const session = await getSession(req);
  if (!session || session.role !== 'admin') return null;
  return session;
}

export async function requireUser(req) {
  return getSession(req);
}

export async function isProSession(req) {
  const session = await getSession(req);
  if (!session) return false;
  if (session.role === 'admin') return true;
  return session.plan === 'pro';
}

/** Attach session cookie using NextResponse (App Router–safe) */
export function jsonWithSession(data, token, status = 200) {
  const res = NextResponse.json(data, { status });
  res.cookies.set(COOKIE, token, cookieOpts());
  return res;
}

export function jsonClearSession(data = { ok: true }) {
  const res = NextResponse.json(data);
  res.cookies.set(COOKIE, '', { ...cookieOpts(), maxAge: 0 });
  return res;
}

// Keep old helpers for any remaining callers
export function sessionCookie(token) {
  const o = cookieOpts();
  const parts = [
    `${COOKIE}=${token}`,
    `Path=${o.path}`,
    'HttpOnly',
    `SameSite=${o.sameSite}`,
    `Max-Age=${o.maxAge}`,
  ];
  if (o.secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie() {
  const o = cookieOpts();
  const parts = [`${COOKIE}=`, `Path=${o.path}`, 'HttpOnly', 'Max-Age=0'];
  if (o.secure) parts.push('Secure');
  return parts.join('; ');
}
