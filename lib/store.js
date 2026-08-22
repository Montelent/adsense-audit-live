import { defaultPayments, publicLines, isMethodReady, METHOD_DEFS } from './payments.js';
import { hasDatabase, ensureSchema, kvGet, kvSet } from './db.js';

const globalKey = '__adsense_audit_store_v8__';

function defaultMail() {
  return {
    enabled: false,
    host: '',
    port: '587',
    secure: false,
    user: '',
    pass: '',
    fromEmail: '',
    fromName: 'AdSense Audit Pro',
  };
}

function defaultStore() {
  return {
    blogs: [],
    users: [
      {
        id: 'admin-1',
        email: 'admin',
        name: 'Admin',
        role: 'admin',
        password: 'admin123',
        plan: 'pro',
        credits: 0,
        createdAt: new Date().toISOString(),
      },
    ],
    settings: {
      siteName: 'AdSense Audit Pro',
      heroBadge: 'Live crawl · content quality · policy risk',
      heroTitle: 'Is your site ready for',
      heroHighlight: 'Google AdSense?',
      heroSubtitle: 'Live crawl of legal pages plus content quality scoring and policy-risk detection.',
      auditButton: 'Run Live Audit',
      howTitle: 'How the live audit works',
      howSubtitle: 'Real HTTP requests to your public URLs.',
      checklistTitle: 'What Google reviewers look for',
      faqTitle: 'Frequently asked questions',
      footerNote: 'Independent readiness tool. Not affiliated with Google.',
    },
    plan: {
      freeEnabled: true,
      proEnabled: true,
      freeName: 'Free',
      proName: 'Pro',
      proPrice: '29',
      proCurrency: 'USD',
      proInterval: 'month',
      freeMaxSamples: 20,
      proMaxSamples: 200,
      freeFeatures: ['HTTPS, Privacy, About, Contact checks', 'Up to 20 sampled posts', 'Basic content quality score', 'Policy risk flags'],
      proFeatures: ['Everything in Free', 'Up to 200 sampled posts', 'Deep per-page quality + AdSense fit', 'Nulled / piracy / adult / spam detection', 'Sitemap + hub page discovery', 'Detailed fixes and sample legal text'],
    },
    payments: defaultPayments(),
    mail: defaultMail(),
    ads: { header: '', homepage: '', homepageMiddle: '', blog: '', postBegin: '', postMiddle: '', postEnd: '', footer: '' },
    scripts: { head: '', bodyStart: '', bodyEnd: '' },
    audits: [],
    paymentRequests: [],
    resetTokens: {},
  };
}

function getStore() {
  if (!globalThis[globalKey]) globalThis[globalKey] = defaultStore();
  const s = globalThis[globalKey];
  if (!s.plan) s.plan = defaultStore().plan;
  if ((s.plan.freeMaxSamples || 0) < 20) s.plan.freeMaxSamples = 20;
  if ((s.plan.proMaxSamples || 0) < 200) s.plan.proMaxSamples = 200;
  if (!s.payments) s.payments = defaultPayments();
  if (!s.paymentRequests) s.paymentRequests = [];
  if (!s.ads) s.ads = defaultStore().ads;
  if (!s.scripts) s.scripts = defaultStore().scripts;
  if (!s.mail) s.mail = defaultMail();
  if (!s.resetTokens) s.resetTokens = {};
  const base = defaultPayments();
  for (const k of Object.keys(METHOD_DEFS)) {
    s.payments[k] = { ...base[k], ...(s.payments[k] || {}) };
  }
  if (!s.payments.instructions) s.payments.instructions = base.instructions;
  s.users.forEach((u) => {
    if (typeof u.credits !== 'number') u.credits = 0;
  });
  return s;
}

function rowToUser(r) {
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role || 'user',
    password: r.password,
    plan: r.plan || 'free',
    credits: r.credits || 0,
    resetToken: r.reset_token,
    resetExpires: r.reset_expires,
    createdAt: r.created_at,
  };
}

async function ensureAdminSeed(db) {
  const rows = await db`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
  if (!rows.length) {
    await db`
      INSERT INTO users (id, email, name, role, password, plan, credits)
      VALUES ('admin-1', 'admin', 'Admin', 'admin', 'admin123', 'pro', 0)
      ON CONFLICT (id) DO NOTHING
    `;
  }
  const byEmail = await db`SELECT id FROM users WHERE lower(email) = 'admin' LIMIT 1`;
  if (!byEmail.length) {
    await db`
      INSERT INTO users (id, email, name, role, password, plan, credits)
      VALUES ('admin-1', 'admin', 'Admin', 'admin', 'admin123', 'pro', 0)
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

export async function ensureAdminUser() {
  if (hasDatabase()) {
    const db = await ensureSchema();
    await ensureAdminSeed(db);
    return true;
  }
  const store = getStore();
  if (!store.users.some((u) => u.role === 'admin' || (u.email || '').toLowerCase() === 'admin')) {
    store.users.unshift({
      id: 'admin-1',
      email: 'admin',
      name: 'Admin',
      role: 'admin',
      password: 'admin123',
      plan: 'pro',
      credits: 0,
      createdAt: new Date().toISOString(),
    });
  }
  return true;
}

export async function listUsers() {
  if (hasDatabase()) {
    const db = await ensureSchema();
    await ensureAdminSeed(db);
    const rows = await db`SELECT * FROM users ORDER BY created_at DESC`;
    return rows.map((r) => {
      const u = rowToUser(r);
      const { password, resetToken, resetExpires, ...out } = u;
      return { ...out, credits: out.credits || 0 };
    });
  }
  return getStore().users.map(({ password, resetToken, resetExpires, ...u }) => ({
    ...u,
    credits: u.credits || 0,
  }));
}

export async function findUserByEmail(email) {
  const e = (email || '').toLowerCase().trim();
  if (hasDatabase()) {
    const db = await ensureSchema();
    await ensureAdminSeed(db);
    const rows = await db`SELECT * FROM users WHERE lower(email) = ${e} LIMIT 1`;
    return rowToUser(rows[0]);
  }
  return getStore().users.find((u) => (u.email || '').toLowerCase() === e) || null;
}

export async function getUserById(id) {
  if (hasDatabase()) {
    const db = await ensureSchema();
    const rows = await db`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    return rowToUser(rows[0]);
  }
  return getStore().users.find((u) => u.id === id) || null;
}

export async function createUser(data) {
  const user = {
    id: 'user-' + Date.now(),
    email: data.email,
    name: data.name || 'User',
    role: data.role || 'user',
    password: data.password,
    plan: data.plan || 'free',
    credits: typeof data.credits === 'number' ? data.credits : 0,
    createdAt: new Date().toISOString(),
  };
  if (hasDatabase()) {
    const db = await ensureSchema();
    await db`
      INSERT INTO users (id, email, name, role, password, plan, credits, created_at)
      VALUES (${user.id}, ${user.email}, ${user.name}, ${user.role}, ${user.password}, ${user.plan}, ${user.credits}, NOW())
    `;
    return user;
  }
  getStore().users.push(user);
  return user;
}

export async function updateUserPassword(userId, currentPassword, newPassword) {
  const user = await getUserById(userId);
  if (!user) return { ok: false, error: 'User not found' };
  if ((user.password || '') !== currentPassword) return { ok: false, error: 'Current password is wrong' };
  if (!newPassword || newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters' };
  if (hasDatabase()) {
    const db = await ensureSchema();
    await db`UPDATE users SET password = ${newPassword} WHERE id = ${userId}`;
    return { ok: true };
  }
  const store = getStore();
  const u = store.users.find((x) => x.id === userId);
  u.password = newPassword;
  return { ok: true };
}

export async function updateUser(userId, data) {
  if (hasDatabase()) {
    const db = await ensureSchema();
    const existing = await getUserById(userId);
    if (!existing) return null;
    const name = typeof data.name === 'string' ? data.name : existing.name;
    const email = typeof data.email === 'string' ? data.email : existing.email;
    const role = data.role === 'user' || data.role === 'admin' ? data.role : existing.role;
    const plan = data.plan === 'free' || data.plan === 'pro' ? data.plan : existing.plan;
    let credits = existing.credits || 0;
    if (typeof data.credits === 'number') credits = Math.max(0, data.credits);
    if (typeof data.addCredits === 'number') credits = Math.max(0, credits + data.addCredits);
    const password = data.password && data.password.length >= 6 ? data.password : existing.password;
    await db`
      UPDATE users SET
        name = ${name}, email = ${email}, role = ${role}, plan = ${plan},
        credits = ${credits}, password = ${password}
      WHERE id = ${userId}
    `;
    return { id: userId, name, email, role, plan, credits, createdAt: existing.createdAt };
  }
  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx < 0) return null;
  const u = store.users[idx];
  if (data.password && data.password.length >= 6) u.password = data.password;
  if (typeof data.name === 'string') u.name = data.name;
  if (typeof data.email === 'string') u.email = data.email;
  if (data.plan === 'free' || data.plan === 'pro') u.plan = data.plan;
  if (data.role === 'user' || data.role === 'admin') u.role = data.role;
  if (typeof data.credits === 'number') u.credits = Math.max(0, data.credits);
  if (typeof data.addCredits === 'number') u.credits = Math.max(0, (u.credits || 0) + data.addCredits);
  const { password, resetToken, resetExpires, ...out } = u;
  return { ...out, credits: u.credits || 0 };
}

export async function setPasswordResetToken(userId, token, expiresAt) {
  if (hasDatabase()) {
    const db = await ensureSchema();
    await db`UPDATE users SET reset_token = ${token}, reset_expires = ${expiresAt} WHERE id = ${userId}`;
    return true;
  }
  const user = getStore().users.find((u) => u.id === userId);
  if (!user) return false;
  user.resetToken = token;
  user.resetExpires = expiresAt;
  return true;
}

export async function consumePasswordResetToken(userId, token) {
  if (hasDatabase()) {
    const db = await ensureSchema();
    const rows = await db`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
    const user = rows[0];
    if (!user || user.reset_token !== token) return false;
    if (!user.reset_expires || Date.now() > Number(user.reset_expires)) return false;
    await db`UPDATE users SET reset_token = NULL, reset_expires = NULL WHERE id = ${userId}`;
    return true;
  }
  const user = getStore().users.find((u) => u.id === userId);
  if (!user) return false;
  if (!user.resetToken || user.resetToken !== token) return false;
  if (!user.resetExpires || Date.now() > user.resetExpires) return false;
  user.resetToken = null;
  user.resetExpires = null;
  return true;
}

export async function listBlogs({ publishedOnly = false } = {}) {
  if (hasDatabase()) {
    const db = await ensureSchema();
    const rows = publishedOnly
      ? await db`SELECT * FROM blogs WHERE published = true ORDER BY created_at DESC`
      : await db`SELECT * FROM blogs ORDER BY created_at DESC`;
    if (rows.length) {
      return rows.map((b) => ({
        id: b.id, title: b.title, slug: b.slug, excerpt: b.excerpt, content: b.content,
        author: b.author, published: b.published, createdAt: b.created_at, updatedAt: b.updated_at,
      }));
    }
  }
  let blogs = [...getStore().blogs];
  if (publishedOnly) blogs = blogs.filter((b) => b.published);
  return blogs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getBlogBySlug(slug) {
  if (hasDatabase()) {
    const db = await ensureSchema();
    const rows = await db`SELECT * FROM blogs WHERE slug = ${slug} LIMIT 1`;
    if (rows[0]) {
      const b = rows[0];
      return { id: b.id, title: b.title, slug: b.slug, excerpt: b.excerpt, content: b.content, author: b.author, published: b.published, createdAt: b.created_at, updatedAt: b.updated_at };
    }
  }
  return getStore().blogs.find((b) => b.slug === slug) || null;
}

export async function getBlogById(id) {
  if (hasDatabase()) {
    const db = await ensureSchema();
    const rows = await db`SELECT * FROM blogs WHERE id = ${id} LIMIT 1`;
    if (rows[0]) {
      const b = rows[0];
      return { id: b.id, title: b.title, slug: b.slug, excerpt: b.excerpt, content: b.content, author: b.author, published: b.published, createdAt: b.created_at, updatedAt: b.updated_at };
    }
  }
  return getStore().blogs.find((b) => b.id === id) || null;
}

export async function createBlog(data) {
  const now = new Date().toISOString();
  const blog = {
    id: 'blog-' + Date.now(),
    title: data.title || 'Untitled',
    slug: (data.slug || data.title || 'post').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 80),
    excerpt: data.excerpt || '',
    content: data.content || '',
    author: data.author || 'Admin',
    published: !!data.published,
    createdAt: now,
    updatedAt: now,
  };
  if (hasDatabase()) {
    const db = await ensureSchema();
    await db`INSERT INTO blogs (id, title, slug, excerpt, content, author, published, created_at, updated_at) VALUES (${blog.id}, ${blog.title}, ${blog.slug}, ${blog.excerpt}, ${blog.content}, ${blog.author}, ${blog.published}, NOW(), NOW())`;
    return blog;
  }
  getStore().blogs.unshift(blog);
  return blog;
}

export async function updateBlog(id, data) {
  if (hasDatabase()) {
    const existing = await getBlogById(id);
    if (!existing) return null;
    const next = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    const db = await ensureSchema();
    await db`UPDATE blogs SET title = ${next.title}, slug = ${next.slug}, excerpt = ${next.excerpt}, content = ${next.content}, author = ${next.author}, published = ${!!next.published}, updated_at = NOW() WHERE id = ${id}`;
    return next;
  }
  const store = getStore();
  const idx = store.blogs.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  store.blogs[idx] = { ...store.blogs[idx], ...data, id, updatedAt: new Date().toISOString() };
  return store.blogs[idx];
}

export async function deleteBlog(id) {
  if (hasDatabase()) {
    const db = await ensureSchema();
    await db`DELETE FROM blogs WHERE id = ${id}`;
    return true;
  }
  const store = getStore();
  const n = store.blogs.length;
  store.blogs = store.blogs.filter((b) => b.id !== id);
  return store.blogs.length < n;
}

export function getSettings() { return { ...getStore().settings }; }
export function updateSettings(data) {
  const store = getStore();
  store.settings = { ...store.settings, ...data };
  if (hasDatabase()) kvSet('settings', store.settings).catch(() => {});
  return store.settings;
}
export function getPlan() { return { ...getStore().plan }; }
export function updatePlan(data) {
  const store = getStore();
  store.plan = { ...store.plan, ...data };
  if (hasDatabase()) kvSet('plan', store.plan).catch(() => {});
  return store.plan;
}
export function getPayments() { return JSON.parse(JSON.stringify(getStore().payments)); }
export function getPublicPayments() {
  const full = getPayments();
  const out = { instructions: full.instructions || '' };
  for (const key of Object.keys(METHOD_DEFS)) {
    const cfg = full[key] || {};
    if (!cfg.enabled) continue;
    out[key] = {
      enabled: true,
      label: cfg.label || METHOD_DEFS[key].label,
      ready: isMethodReady(key, cfg),
      lines: publicLines(key, cfg),
      paymentLink: (cfg.paymentLink || cfg.paypalMe || '').trim() || null,
      auto: ['paystack', 'monnify', 'paypal'].includes(key),
    };
  }
  return out;
}
export function updatePayments(data) {
  const store = getStore();
  const next = { ...store.payments };
  for (const [k, v] of Object.entries(data || {})) {
    if (k === 'instructions') next.instructions = v;
    else if (v && typeof v === 'object') next[k] = { ...(next[k] || {}), ...v };
    else next[k] = v;
  }
  store.payments = next;
  if (hasDatabase()) kvSet('payments', store.payments).catch(() => {});
  return store.payments;
}
export function getMailSettings() { return { ...getStore().mail }; }
export function updateMailSettings(data) {
  const store = getStore();
  store.mail = { ...store.mail, ...data };
  if (hasDatabase()) kvSet('mail', store.mail).catch(() => {});
  return store.mail;
}
export function getAds() { return { ...getStore().ads }; }
export function updateAds(data) {
  const store = getStore();
  store.ads = { ...store.ads, ...data };
  if (hasDatabase()) kvSet('ads', store.ads).catch(() => {});
  return store.ads;
}
export function getScripts() { return { ...getStore().scripts }; }
export function updateScripts(data) {
  const store = getStore();
  store.scripts = { ...store.scripts, ...data };
  if (hasDatabase()) kvSet('scripts', store.scripts).catch(() => {});
  return store.scripts;
}

export async function addPaymentRequest(req) {
  const item = { id: 'pay-' + Date.now(), ...req, status: req.status || 'pending', createdAt: new Date().toISOString() };
  if (hasDatabase()) {
    const db = await ensureSchema();
    await db`INSERT INTO payment_requests (id, data, status, created_at) VALUES (${item.id}, ${JSON.stringify(item)}::jsonb, ${item.status}, NOW())`;
    return item;
  }
  const store = getStore();
  store.paymentRequests.unshift(item);
  store.paymentRequests = store.paymentRequests.slice(0, 200);
  return item;
}

export async function listPaymentRequests() {
  if (hasDatabase()) {
    const db = await ensureSchema();
    const rows = await db`SELECT data, status FROM payment_requests ORDER BY created_at DESC LIMIT 200`;
    return rows.map((r) => ({ ...(r.data || {}), status: r.status || r.data?.status }));
  }
  return [...getStore().paymentRequests];
}

export async function updatePaymentRequest(id, data) {
  if (hasDatabase()) {
    const db = await ensureSchema();
    const rows = await db`SELECT data FROM payment_requests WHERE id = ${id} LIMIT 1`;
    if (!rows.length) return null;
    const next = { ...rows[0].data, ...data };
    await db`UPDATE payment_requests SET data = ${JSON.stringify(next)}::jsonb, status = ${next.status || 'pending'} WHERE id = ${id}`;
    return next;
  }
  const store = getStore();
  const idx = store.paymentRequests.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  store.paymentRequests[idx] = { ...store.paymentRequests[idx], ...data };
  return store.paymentRequests[idx];
}

export function recordAudit(summary) {
  const store = getStore();
  store.audits.unshift({ id: 'audit-' + Date.now(), ...summary, at: new Date().toISOString() });
  store.audits = store.audits.slice(0, 100);
}

export async function getStats() {
  const users = await listUsers();
  const blogs = await listBlogs();
  const pays = await listPaymentRequests();
  const store = getStore();
  return {
    blogs: blogs.length,
    publishedBlogs: blogs.filter((b) => b.published).length,
    users: users.length,
    recentAudits: store.audits.length,
    recentAuditList: store.audits.slice(0, 10),
    pendingPayments: pays.filter((p) => p.status === 'pending').length,
    database: hasDatabase(),
  };
}

export { getStore, hasDatabase };
