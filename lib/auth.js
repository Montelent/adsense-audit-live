const { SignJWT, jwtVerify } = require('jose');
const { findUserByEmail } = require('./store');

const COOKIE = 'aap_admin_token';
const secret = () =>
  new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'adsense-audit-pro-dev-secret-change-me');

async function createToken(user) {
  return new SignJWT({ sub: user.id, email: user.email, role: user.role || 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

async function login(email, password) {
  const user = findUserByEmail(email) || findUserByEmail('admin');
  if (user && (user.password || 'admin123') === password) {
    return { id: user.id, email: user.email, name: user.name, role: user.role || 'admin' };
  }
  // fallback default
  if ((email === 'admin' || email === 'admin@local') && password === 'admin123') {
    return { id: 'admin-1', email: 'admin', name: 'Admin', role: 'admin' };
  }
  return null;
}

function getTokenFromRequest(req) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function requireAdmin(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

module.exports = {
  COOKIE,
  createToken,
  verifyToken,
  login,
  getTokenFromRequest,
  requireAdmin,
};
