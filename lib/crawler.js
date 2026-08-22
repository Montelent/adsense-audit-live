const LEGAL_PATHS = {
  privacy: ['/privacy-policy', '/privacy', '/privacy-policy.html', '/pages/privacy-policy', '/legal/privacy'],
  about: ['/about', '/about-us', '/about.html', '/pages/about'],
  contact: ['/contact', '/contact-us', '/contact.html', '/pages/contact', '/support'],
  terms: ['/terms', '/terms-of-service', '/terms-of-use', '/disclaimer'],
};

const PRIVACY_KEYWORDS = ['privacy policy', 'privacy notice', 'cookie', 'cookies', 'personal data', 'google adsense', 'doubleclick'];
const ABOUT_KEYWORDS = ['about us', 'about me', 'who we are', 'our story', 'founder', 'mission'];
const CONTACT_KEYWORDS = ['contact us', 'get in touch', 'email us', 'contact form', 'reach out'];

async function fetchPage(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'AdSenseAuditPro/2.0 (readiness-checker)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timer);
    const finalUrl = res.url;
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) return { ok: false, status: res.status, finalUrl, html: '' };
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return { ok: false, status: res.status, finalUrl, html: '' };
    }
    const html = await res.text();
    return { ok: true, status: res.status, finalUrl, html: html.slice(0, 500000) };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, status: 0, finalUrl: url, html: '', error: err.message || 'fetch failed' };
  }
}

function normalizeBase(input) {
  let u = (input || '').trim();
  if (!u) throw new Error('URL required');
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  const parsed = new URL(u);
  if (parsed.protocol === 'http:') parsed.protocol = 'https:';
  return parsed.origin;
}

function analyzeHomepage(html) {
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  const title = $('title').first().text().trim();
  const links = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) links.push(href);
  });
  const bodyText = $('body').text().replace(/\s+/g, ' ').slice(0, 50000);
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
  const linkHrefs = links.map((h) => h.toLowerCase());
  return {
    title,
    wordCount,
    hasViewport: $('meta[name="viewport"]').length > 0,
    hasPrivacyLink: linkHrefs.some((h) => /privacy/.test(h)),
    hasAboutLink: linkHrefs.some((h) => /about/.test(h)),
    hasContactLink: linkHrefs.some((h) => /contact|support/.test(h)),
    linkCount: links.length,
  };
}

async function findLegalPage(base, paths, keywords) {
  for (const path of paths) {
    const url = base + path;
    const page = await fetchPage(url, 6000);
    if (!page.ok || !page.html) continue;
    const lower = page.html.toLowerCase();
    if (lower.includes('404') && lower.includes('not found') && page.html.length < 3000) continue;
    if (page.status >= 400) continue;
    const matches = keywords.filter((k) => lower.includes(k)).length;
    if (matches >= 1 || page.html.length > 800) {
      return {
        found: true,
        url: page.finalUrl || url,
        mentionsCookies: /cookie/.test(lower),
        mentionsAdsense: /adsense|doubleclick|google ads/.test(lower),
      };
    }
  }
  return { found: false };
}

async function crawlSite(inputUrl) {
  const base = normalizeBase(inputUrl);
  const home = await fetchPage(base + '/', 10000);
  if (!home.ok) {
    return {
      success: false,
      error: home.error || `Could not reach site (status ${home.status})`,
      hostname: new URL(base).hostname,
    };
  }

  const hostname = new URL(home.finalUrl || base).hostname;
  const homeAnalysis = analyzeHomepage(home.html);

  const [privacy, about, contact, terms] = await Promise.all([
    findLegalPage(base, LEGAL_PATHS.privacy, PRIVACY_KEYWORDS),
    findLegalPage(base, LEGAL_PATHS.about, ABOUT_KEYWORDS),
    findLegalPage(base, LEGAL_PATHS.contact, CONTACT_KEYWORDS),
    findLegalPage(base, LEGAL_PATHS.terms, ['terms', 'conditions', 'disclaimer', 'agreement']),
  ]);

  if (!privacy.found && homeAnalysis.hasPrivacyLink) {
    privacy.found = true;
    privacy.url = 'linked-from-homepage';
  }
  if (!about.found && homeAnalysis.hasAboutLink) {
    about.found = true;
    about.url = 'linked-from-homepage';
  }
  if (!contact.found && homeAnalysis.hasContactLink) {
    contact.found = true;
    contact.url = 'linked-from-homepage';
  }

  const usesHttps = (home.finalUrl || base).startsWith('https');

  const checks = [
    {
      id: 'https',
      label: 'HTTPS / SSL active',
      critical: true,
      pass: usesHttps,
      detail: usesHttps ? `Site loads over HTTPS (${home.finalUrl || base})` : 'Site did not load reliably over HTTPS',
      fix: 'Enable a valid SSL certificate and redirect HTTP → HTTPS.',
    },
    {
      id: 'privacy',
      label: 'Privacy Policy page',
      critical: true,
      pass: privacy.found,
      detail: privacy.found
        ? `Found${privacy.url && privacy.url !== 'linked-from-homepage' ? ': ' + privacy.url : ' (linked from homepage)'}${privacy.mentionsAdsense ? ' · mentions ads/cookies' : privacy.mentionsCookies ? ' · mentions cookies' : ''}`
        : 'No Privacy Policy detected at common paths and no privacy link on homepage',
      recommendedPage: '/privacy-policy',
      fix: 'Create /privacy-policy disclosing cookies and Google AdSense/DoubleClick. Link it in the footer.',
      sampleText: privacy.found
        ? null
        : 'Privacy Policy\n\nLast updated: [Date]\n\n[Site Name] uses cookies. Google uses the DoubleClick cookie to serve ads. Opt out: https://www.google.com/settings/ads\n\nContact: [email]',
    },
    {
      id: 'about',
      label: 'About / Author page',
      critical: true,
      pass: about.found,
      detail: about.found
        ? `Found${about.url && about.url !== 'linked-from-homepage' ? ': ' + about.url : ' (linked from homepage)'}`
        : 'No About page detected at common paths and no about link on homepage',
      recommendedPage: '/about',
      fix: 'Create /about explaining who runs the site and its purpose.',
      sampleText: about.found
        ? null
        : 'About Us\n\nWelcome to [Site Name]. I am [Your Name], the founder. I started this site to help with [niche].',
    },
    {
      id: 'contact',
      label: 'Contact page',
      critical: true,
      pass: contact.found,
      detail: contact.found
        ? `Found${contact.url && contact.url !== 'linked-from-homepage' ? ': ' + contact.url : ' (linked from homepage)'}`
        : 'No Contact page detected at common paths and no contact link on homepage',
      recommendedPage: '/contact',
      fix: 'Create /contact with a form or visible email address.',
      sampleText: contact.found ? null : 'Contact Us\n\nEmail: contact@[yourdomain.com]',
    },
    {
      id: 'terms',
      label: 'Terms / Disclaimer',
      critical: false,
      pass: terms.found,
      detail: terms.found ? 'Terms or disclaimer found' : 'No Terms page detected (recommended)',
      recommendedPage: '/terms',
      fix: 'Add Terms of Service and/or Disclaimer.',
    },
    {
      id: 'mobile',
      label: 'Mobile viewport meta tag',
      critical: true,
      pass: homeAnalysis.hasViewport,
      detail: homeAnalysis.hasViewport ? 'Viewport meta tag present' : 'Missing viewport meta — may not be mobile-friendly',
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> in <head>.',
    },
    {
      id: 'content-depth',
      label: 'Homepage content depth',
      critical: false,
      pass: homeAnalysis.wordCount >= 200,
      detail: `Homepage body ~${homeAnalysis.wordCount} words`,
      fix: 'Ensure substantial original content (aim 15–30 articles before applying).',
    },
    {
      id: 'title',
      label: 'Page title present',
      critical: false,
      pass: homeAnalysis.title.length > 3,
      detail: homeAnalysis.title ? `Title: "${homeAnalysis.title.slice(0, 80)}"` : 'Missing or empty <title>',
      fix: 'Set a clear, descriptive page title.',
    },
  ];

  const critical = checks.filter((c) => c.critical);
  const criticalPassed = critical.filter((c) => c.pass).length;
  const allPassed = checks.filter((c) => c.pass).length;
  const score = Math.round(
    (criticalPassed / Math.max(critical.length, 1)) * 70 +
      (allPassed / Math.max(checks.length, 1)) * 30
  );
  const approval = Math.min(92, Math.max(8, Math.round(score * 0.95)));

  return {
    success: true,
    hostname,
    finalUrl: home.finalUrl || base,
    score,
    approvalChance: approval,
    rejectionRisk: 100 - approval,
    criticalIssues: critical.filter((c) => !c.pass).length,
    checks,
    homeAnalysis: {
      title: homeAnalysis.title,
      wordCount: homeAnalysis.wordCount,
      linkCount: homeAnalysis.linkCount,
    },
    crawledAt: new Date().toISOString(),
  };
}

module.exports = { crawlSite, normalizeBase };
