const globalKey = '__adsense_audit_store__';

function getStore() {
  if (!global[globalKey]) {
    global[globalKey] = {
      blogs: [
        {
          id: 'seed-1',
          title: 'How to Prepare Your Site for AdSense in 2026',
          slug: 'prepare-site-adsense-2026',
          excerpt: 'Content, legal pages, and technical signals reviewers care about.',
          content:
            '<p>Getting approved for Google AdSense still comes down to trust, value, and compliance.</p><p>Publish <strong>15–30 original articles</strong>. Add a Privacy Policy that mentions cookies and Google ads, an About page, and a Contact page. Use HTTPS and a mobile-friendly design.</p>',
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
          content:
            '<p>A Privacy Policy is one of the most common missing pieces that lead to rejection.</p><p>Disclose cookies, analytics, and Google AdSense / DoubleClick. Link from the footer on every page.</p>',
          author: 'AdSense Audit Team',
          published: true,
          createdAt: '2026-08-15T10:00:00.000Z',
          updatedAt: '2026-08-15T10:00:00.000Z',
        },
      ],
      users: [
        {
          id: 'admin-1',
          email: 'admin@local',
          name: 'Admin',
          role: 'admin',
          passwordHash: '',
        },
      ],
      settings: {
        siteName: 'AdSense Audit Pro',
        heroTitle: 'Is your site ready for',
        heroHighlight: 'Google AdSense?',
        heroSubtitle: 'Live crawl of your public pages: HTTPS, Privacy, About, Contact, mobile signals, and more.',
      },
      audits: [],
    };
  }
  return global[globalKey];
}

function listBlogs({ publishedOnly = false } = {}) {
  const store = getStore();
  let blogs = [...store.blogs];
  if (publishedOnly) blogs = blogs.filter((b) => b.published);
  return blogs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

function getBlogBySlug(slug) {
  return getStore().blogs.find((b) => b.slug === slug) || null;
}

function getBlogById(id) {
  return getStore().blogs.find((b) => b.id === id) || null;
}

function createBlog(data) {
  const store = getStore();
  const now = new Date().toISOString();
  const blog = {
    id: 'blog-' + Date.now(),
    title: data.title || 'Untitled',
    slug: (data.slug || data.title || 'post')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 80),
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

function updateBlog(id, data) {
  const store = getStore();
  const idx = store.blogs.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  const prev = store.blogs[idx];
  store.blogs[idx] = { ...prev, ...data, id: prev.id, updatedAt: new Date().toISOString() };
  return store.blogs[idx];
}

function deleteBlog(id) {
  const store = getStore();
  const before = store.blogs.length;
  store.blogs = store.blogs.filter((b) => b.id !== id);
  return store.blogs.length < before;
}

function getSettings() {
  return { ...getStore().settings };
}

function updateSettings(data) {
  const store = getStore();
  store.settings = { ...store.settings, ...data };
  return store.settings;
}

function listUsers() {
  return getStore().users.map(({ passwordHash, ...u }) => u);
}

function findUserByEmail(email) {
  return getStore().users.find((u) => u.email === email) || null;
}

function recordAudit(summary) {
  const store = getStore();
  store.audits.unshift({ id: 'audit-' + Date.now(), ...summary, at: new Date().toISOString() });
  store.audits = store.audits.slice(0, 100);
}

function getStats() {
  const store = getStore();
  return {
    blogs: store.blogs.length,
    publishedBlogs: store.blogs.filter((b) => b.published).length,
    users: store.users.length,
    recentAudits: store.audits.length,
  };
}

module.exports = {
  listBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getSettings,
  updateSettings,
  listUsers,
  findUserByEmail,
  recordAudit,
  getStats,
  getStore,
};
