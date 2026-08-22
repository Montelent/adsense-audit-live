const globalKey = '__adsense_audit_store_v3__';

function defaultStore() {
  return {
    blogs: [
      {
        id: 'seed-1',
        title: 'How to Prepare Your Site for AdSense in 2026',
        slug: 'prepare-site-adsense-2026',
        excerpt: 'Content, legal pages, and technical signals reviewers care about.',
        content: '<p>Getting approved for Google AdSense still comes down to trust, value, and compliance.</p><p>Publish <strong>15–30 original articles</strong>. Add Privacy Policy, About, and Contact.</p>',
        author: 'AdSense Audit Team',
        published: true,
        createdAt: '2026-08-10T10:00:00.000Z',
        updatedAt: '2026-08-10T10:00:00.000Z',
      },
      {
        id: 'seed-2',
        title: 'Writing an AdSense-Ready Privacy Policy',
        slug: 'adsense-ready-privacy-policy',
        excerpt: 'What your Privacy Policy must include for cookies and ads.',
        content: '<p>Disclose cookies, analytics, and Google AdSense / DoubleClick. Link from the footer on every page.</p>',
        author: 'AdSense Audit Team',
        published: true,
        createdAt: '2026-08-15T10:00:00.000Z',
        updatedAt: '2026-08-15T10:00:00.000Z',
      },
    ],
    users: [{ id: 'admin-1', email: 'admin', name: 'Admin', role: 'admin', password: 'admin123', plan: 'pro' }],
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
      freeMaxSamples: 3,
      proMaxSamples: 10,
      freeFeatures: [
        'HTTPS, Privacy, About, Contact checks',
        'Up to 3 sampled posts',
        'Basic content quality score',
        'Policy risk flags',
      ],
      proFeatures: [
        'Everything in Free',
        'Up to 10 sampled posts (Vercel Hobby max)',
        'Deep per-page quality + AdSense fit',
        'Nulled / piracy / adult / spam detection',
        'Detailed fixes and sample legal text',
        'Priority-style full report',
      ],
    },
    payments: {
      paypal: { enabled: true, label: 'PayPal', details: 'paypal@yourdomain.com' },
      paystack: { enabled: true, label: 'Paystack', details: 'Pay via Paystack link (add your public key / payment link)' },
      monnify: { enabled: true, label: 'Monnify', details: 'Monnify account / payment link' },
      usdt: { enabled: true, label: 'USDT (TRC20 / ERC20)', details: 'Network: TRC20\nWallet: YOUR_USDT_ADDRESS' },
      usdc: { enabled: true, label: 'USDC', details: 'Network: ERC20 / SOL\nWallet: YOUR_USDC_ADDRESS' },
      bank: { enabled: true, label: 'Bank Transfer (local)', details: 'Bank: Your Bank\nAccount name: ...\nAccount number: ...' },
      wire: { enabled: true, label: 'Wire Transfer (international)', details: 'SWIFT / IBAN details for international wire' },
      instructions: 'After payment, email proof to support@yourdomain.com with your site URL. Admin will activate Pro.',
    },
    ads: {
      header: '', homepage: '', homepageMiddle: '', blog: '',
      postBegin: '', postMiddle: '', postEnd: '', footer: '',
    },
    scripts: { head: '', bodyStart: '', bodyEnd: '' },
    audits: [],
  };
}

function getStore() {
  if (!globalThis[globalKey]) globalThis[globalKey] = defaultStore();
  const s = globalThis[globalKey];
  if (!s.plan) s.plan = defaultStore().plan;
  if (!s.payments) s.payments = defaultStore().payments;
  if (!s.ads) s.ads = defaultStore().ads;
  if (!s.scripts) s.scripts = defaultStore().scripts;
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
export function getPayments() { return JSON.parse(JSON.stringify(getStore().payments)); }
export function updatePayments(data) {
  const store = getStore();
  store.payments = { ...store.payments, ...data };
  return store.payments;
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
  return getStore().users.map(({ password, ...u }) => u);
}
export function findUserByEmail(email) {
  const e = (email || '').toLowerCase();
  return getStore().users.find((u) => (u.email || '').toLowerCase() === e || u.email === email) || null;
}
export function updateUserPassword(userId, currentPassword, newPassword) {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'User not found' };
  if ((user.password || 'admin123') !== currentPassword) return { ok: false, error: 'Current password is wrong' };
  if (!newPassword || newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters' };
  user.password = newPassword;
  return { ok: true };
}
export function updateUser(userId, data) {
  const store = getStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx < 0) return null;
  if (data.password && data.password.length >= 6) store.users[idx].password = data.password;
  if (data.name) store.users[idx].name = data.name;
  if (data.email) store.users[idx].email = data.email;
  if (data.plan) store.users[idx].plan = data.plan;
  const { password, ...out } = store.users[idx];
  return out;
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
  };
}
export { getStore };
