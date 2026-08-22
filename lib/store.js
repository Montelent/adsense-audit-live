import { defaultPayments, publicLines, isMethodReady, METHOD_DEFS } from './payments.js';

const globalKey = '__adsense_audit_store_v7__';

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
    blogs: [
      {
        id: 'seed-1',
        title: 'How to Prepare Your Site for AdSense in 2026',
        slug: 'prepare-site-adsense-2026',
        excerpt: 'Content, legal pages, and technical signals reviewers care about.',
        content: '<p>Getting approved for Google AdSense still comes down to trust, value, and compliance.</p>',
        author: 'AdSense Audit Team',
        published: true,
        createdAt: '2026-08-10T10:00:00.000Z',
        updatedAt: '2026-08-10T10:00:00.000Z',
      },
    ],
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
      freeFeatures: [
        'HTTPS, Privacy, About, Contact checks',
        'Up to 20 sampled posts',
        'Basic content quality score',
        'Policy risk flags',
      ],
      proFeatures: [
        'Everything in Free',
        'Up to 200 sampled posts',
        'Deep per-page quality + AdSense fit',
        'Nulled / piracy / adult / spam detection',
        'Sitemap + hub page discovery',
        'Detailed fixes and sample legal text',
      ],
    },
    payments: defaultPayments(),
    mail: defaultMail(),
    ads: {
      header: '', homepage: '', homepageMiddle: '', blog: '',
      postBegin: '', postMiddle: '', postEnd: '', footer: '',
    },
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
  // ensure credits on users
  s.users.forEach((u) => {
    if (typeof u.credits !== 'number') u.credits = 0;
  });
  return s;
}

export function listBlogs({ publishedOnly = false } = {}) {
  let blogs = [...getStore().blogs];
  if (publishedOnly) blogs = blogs.filter((b) => b.published);
  return blogs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}
export function getBlogBySlug(slug) {
  return getStore().blogs.find((b) => b.slug === slug) || null;
}
export function getBlogById(id) {
  return getStore().blogs.find((b) => b.id === id) || null;
}
export function createBlog(data) {
  const store = getStore();
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
  store.blogs.unshift(blog);
  return blog;
}
export function updateBlog(id, data) {
  const store = getStore();
  const idx = store.blogs.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  store.blogs[idx] = { ...store.blogs[idx], ...data, id, updatedAt: new Date().toISOString() };
  return store.blogs[idx];
}
export function deleteBlog(id) {
  const store = getStore();
  const n = store.blogs.length;
  store.blogs = store.blogs.filter((b) => b.id !== id);
  return store.blogs.length < n;
}
export function getSettings() { return { ...getStore().settings }; }
export function updateSettings(data) {
  const store = getStore();
  store.settings = { ...store.settings, ...data };
  return store.settings;
}
export function getPlan() { return { ...getStore().plan }; }
export function updatePlan(data) {
  const store = getStore();
  store.plan = { ...store.plan, ...data };
  return store.plan;
}

export function getPayments() {
  return JSON.parse(JSON.stringify(getStore().payments));
}

export function getPublicPayments() {
  const full = getPayments();
  const out = { instructions: full.instructions || '' };
  for (const key of Object.keys(METHOD_DEFS)) {
    const cfg = full[key] || {};
    if (!cfg.enabled) continue;
    const lines = publicLines(key, cfg);
    out[key] = {
      enabled: true,
      label: cfg.label || METHOD_DEFS[key].label,
      ready: isMethodReady(key, cfg),
      lines,
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
  return store.payments;
}

export function getMailSettings() {
  return { ...getStore().mail };
}
export function updateMailSettings(data) {
  const store = getStore();
  store.mail = { ...store.mail, ...data };
  return store.mail;
}

export function getAds() { return { ...getStore().ads }; }
export function updateAds(data) {
  const store = getStore();
  store.ads = { ...store.ads, ...data };
  return store.ads;
}
export function getScripts() { return { ...getStore().scripts }; }
export function updateScripts(data) {
  const store = getStore();
  store.scripts = { ...store.scripts, ...data };
  return store.scripts;
}
export function listUsers() {
  return getStore().users.map(({ password, resetToken, resetExpires, ...u }) => ({
    ...u,
    credits: u.credits || 0,
  }));
}
export function findUserByEmail(email) {
  const e = (email || '').toLowerCase();
  return getStore().users.find((u) => (u.email || '').toLowerCase() === e) || null;
}
export function getUserById(id) {
  return getStore().users.find((u) => u.id === id) || null;
}

export function createUser(data) {
  const store = getStore();
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
  store.users.push(user);
  return user;
}

export function updateUserPassword(userId, currentPassword, newPassword) {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'User not found' };
  if ((user.password || '') !== currentPassword) return { ok: false, error: 'Current password is wrong' };
  if (!newPassword || newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters' };
  user.password = newPassword;
  return { ok: true };
}

export function updateUser(userId, data) {
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

export function setPasswordResetToken(userId, token, expiresAt) {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return false;
  user.resetToken = token;
  user.resetExpires = expiresAt;
  return true;
}

export function consumePasswordResetToken(userId, token) {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return false;
  if (!user.resetToken || user.resetToken !== token) return false;
  if (!user.resetExpires || Date.now() > user.resetExpires) return false;
  user.resetToken = null;
  user.resetExpires = null;
  return true;
}

export function addPaymentRequest(req) {
  const store = getStore();
  const item = {
    id: 'pay-' + Date.now(),
    ...req,
    status: req.status || 'pending',
    createdAt: new Date().toISOString(),
  };
  store.paymentRequests.unshift(item);
  store.paymentRequests = store.paymentRequests.slice(0, 200);
  return item;
}

export function listPaymentRequests() {
  return [...getStore().paymentRequests];
}

export function updatePaymentRequest(id, data) {
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

export function getStats() {
  const store = getStore();
  return {
    blogs: store.blogs.length,
    publishedBlogs: store.blogs.filter((b) => b.published).length,
    users: store.users.length,
    recentAudits: store.audits.length,
    recentAuditList: store.audits.slice(0, 10),
    pendingPayments: store.paymentRequests.filter((p) => p.status === 'pending').length,
  };
}
export { getStore };
