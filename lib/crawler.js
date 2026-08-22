const LEGAL_PATHS = {
  privacy: ['/privacy-policy', '/privacy', '/privacy-policy.html', '/pages/privacy-policy', '/legal/privacy'],
  about: ['/about', '/about-us', '/about.html', '/pages/about'],
  contact: ['/contact', '/contact-us', '/contact.html', '/pages/contact', '/support'],
  terms: ['/terms', '/terms-of-service', '/terms-of-use', '/disclaimer'],
};
const PRIVACY_KEYWORDS = ['privacy policy', 'privacy notice', 'cookie', 'cookies', 'personal data', 'google adsense', 'doubleclick'];
const ABOUT_KEYWORDS = ['about us', 'about me', 'who we are', 'our story', 'founder', 'mission'];
const CONTACT_KEYWORDS = ['contact us', 'get in touch', 'email us', 'contact form', 'reach out'];
const POLICY_RISK = ['casino', 'poker', 'adult content', 'xxx', 'prescription drugs', 'hack tools', 'warez'];

async function fetchPage(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'AdSenseAuditPro/2.0 (readiness-checker)', Accept: 'text/html,application/xhtml+xml' },
    });
    clearTimeout(timer);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) return { ok: false, status: res.status, finalUrl: res.url, html: '' };
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return { ok: false, status: res.status, finalUrl: res.url, html: '' };
    }
    const html = await res.text();
    return { ok: true, status: res.status, finalUrl: res.url, html: html.slice(0, 500000) };
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
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const robots = ($('meta[name="robots"]').attr('content') || '').toLowerCase();
  const lang = $('html').attr('lang') || '';
  const links = [];
  $('a[href]').each((_, el) => { const href = $(el).attr('href'); if (href) links.push(href); });
  const bodyText = $('body').text().replace(/\s+/g, ' ').slice(0, 50000);
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
  const linkHrefs = links.map((h) => h.toLowerCase());
  const lower = html.toLowerCase();
  const riskHits = POLICY_RISK.filter((k) => lower.includes(k));
  return {
    title,
    metaDesc,
    wordCount,
    hasViewport: $('meta[name="viewport"]').length > 0,
    hasH1: $('h1').length > 0,
    h1Text: $('h1').first().text().trim().slice(0, 120),
    hasNav: $('nav').length > 0 || $('header a').length >= 3,
    hasFooter: $('footer').length > 0,
    hasLang: !!lang,
    lang,
    noindex: robots.includes('noindex'),
    hasPrivacyLink: linkHrefs.some((h) => /privacy/.test(h)),
    hasAboutLink: linkHrefs.some((h) => /about/.test(h)),
    hasContactLink: linkHrefs.some((h) => /contact|support/.test(h)),
    linkCount: links.length,
    riskHits,
    hasStructuredData: lower.includes('application/ld+json') || lower.includes('schema.org'),
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
  const a = analyzeHomepage(home.html);
  const [privacy, about, contact, terms] = await Promise.all([
    findLegalPage(base, LEGAL_PATHS.privacy, PRIVACY_KEYWORDS),
    findLegalPage(base, LEGAL_PATHS.about, ABOUT_KEYWORDS),
    findLegalPage(base, LEGAL_PATHS.contact, CONTACT_KEYWORDS),
    findLegalPage(base, LEGAL_PATHS.terms, ['terms', 'conditions', 'disclaimer', 'agreement']),
  ]);
  if (!privacy.found && a.hasPrivacyLink) { privacy.found = true; privacy.url = 'linked-from-homepage'; }
  if (!about.found && a.hasAboutLink) { about.found = true; about.url = 'linked-from-homepage'; }
  if (!contact.found && a.hasContactLink) { contact.found = true; contact.url = 'linked-from-homepage'; }
  const usesHttps = (home.finalUrl || base).startsWith('https');

  const checks = [
    { id: 'https', label: 'HTTPS / SSL active', critical: true, pass: usesHttps,
      detail: usesHttps ? `Loads over HTTPS (${home.finalUrl || base})` : 'Did not confirm HTTPS',
      fix: 'Enable SSL and force HTTPS redirects. AdSense requires a secure site.' },
    { id: 'privacy', label: 'Privacy Policy page', critical: true, pass: privacy.found,
      detail: privacy.found ? `Found${privacy.url && privacy.url !== 'linked-from-homepage' ? ': ' + privacy.url : ' via homepage link'}${privacy.mentionsAdsense ? ' · mentions ads' : privacy.mentionsCookies ? ' · mentions cookies' : ''}` : 'Not found at common paths and no privacy link on homepage',
      recommendedPage: '/privacy-policy',
      fix: 'Create /privacy-policy disclosing cookies and Google AdSense/DoubleClick. Link in footer sitewide.',
      sampleText: privacy.found ? null : 'Privacy Policy\n\nLast updated: [Date]\n\nWe use cookies. Google uses the DoubleClick cookie to serve ads. Opt out: https://www.google.com/settings/ads\n\nContact: [email]' },
    { id: 'about', label: 'About / Author page (E-E-A-T)', critical: true, pass: about.found,
      detail: about.found ? `Found${about.url && about.url !== 'linked-from-homepage' ? ': ' + about.url : ' via homepage link'}` : 'Not found — reviewers want to know who runs the site',
      recommendedPage: '/about',
      fix: 'Create /about with real name/team, expertise, and purpose of the site.',
      sampleText: about.found ? null : 'About Us\n\nI am [Name], founder of [Site]. This site helps people with [niche].' },
    { id: 'contact', label: 'Contact page', critical: true, pass: contact.found,
      detail: contact.found ? `Found${contact.url && contact.url !== 'linked-from-homepage' ? ': ' + contact.url : ' via homepage link'}` : 'Not found',
      recommendedPage: '/contact',
      fix: 'Add /contact with a working form or visible email.',
      sampleText: contact.found ? null : 'Contact Us\n\nEmail: contact@[domain.com]\nWe reply within 1–2 business days.' },
    { id: 'terms', label: 'Terms of Service / Disclaimer', critical: false, pass: terms.found,
      detail: terms.found ? 'Terms or disclaimer found' : 'Not detected (recommended for advice niches)',
      recommendedPage: '/terms', fix: 'Add Terms of Service and/or Disclaimer.' },
    { id: 'mobile', label: 'Mobile viewport meta', critical: true, pass: a.hasViewport,
      detail: a.hasViewport ? 'Viewport meta present' : 'Missing — site may fail mobile usability',
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> in <head>.' },
    { id: 'noindex', label: 'Not blocked by noindex', critical: true, pass: !a.noindex,
      detail: a.noindex ? 'Homepage has robots noindex — Google cannot index for AdSense' : 'No noindex on homepage',
      fix: 'Remove noindex from production pages you want indexed.' },
    { id: 'title', label: 'Unique page title', critical: true, pass: a.title.length > 3,
      detail: a.title ? `Title: "${a.title.slice(0, 80)}"` : 'Missing <title>',
      fix: 'Set a clear descriptive title under 60 characters.' },
    { id: 'meta-desc', label: 'Meta description', critical: false, pass: a.metaDesc.length > 20,
      detail: a.metaDesc ? `Description present (${a.metaDesc.length} chars)` : 'No meta description',
      fix: 'Add <meta name="description" content="..."> summarizing the page.' },
    { id: 'h1', label: 'H1 heading', critical: false, pass: a.hasH1,
      detail: a.hasH1 ? `H1: "${a.h1Text}"` : 'No H1 found on homepage',
      fix: 'Use one clear H1 that matches the page topic.' },
    { id: 'nav', label: 'Clear navigation', critical: false, pass: a.hasNav,
      detail: a.hasNav ? 'Navigation structure detected' : 'Little or no nav detected',
      fix: 'Add a clear menu so users and reviewers can explore content.' },
    { id: 'footer', label: 'Footer present', critical: false, pass: a.hasFooter,
      detail: a.hasFooter ? 'Footer element found' : 'No <footer> detected',
      fix: 'Add a footer with Privacy, About, Contact links on every page.' },
    { id: 'content', label: 'Homepage content volume', critical: true, pass: a.wordCount >= 150,
      detail: `Homepage ~${a.wordCount} words · ${a.linkCount} links`,
      fix: 'Avoid thin homepages. Aim for useful content and 15–30 solid articles sitewide before applying.' },
    { id: 'lang', label: 'HTML lang attribute', critical: false, pass: a.hasLang,
      detail: a.hasLang ? `lang="${a.lang}"` : 'Missing lang on <html>',
      fix: 'Set <html lang="en"> (or your language code).' },
    { id: 'policy-risk', label: 'No obvious restricted-niche signals', critical: true, pass: a.riskHits.length === 0,
      detail: a.riskHits.length ? `Possible restricted terms: ${a.riskHits.join(', ')}` : 'No obvious restricted-content keywords on homepage',
      fix: 'AdSense prohibits or limits adult, dangerous, and some gambling content. Review Google Publisher Policies.' },
    { id: 'schema', label: 'Structured data (optional)', critical: false, pass: a.hasStructuredData,
      detail: a.hasStructuredData ? 'JSON-LD or schema.org signals found' : 'No structured data detected',
      fix: 'Optional: add Article/Organization schema to support E-E-A-T.' },
  ];

  const critical = checks.filter((c) => c.critical);
  const critPass = critical.filter((c) => c.pass).length;
  const allPass = checks.filter((c) => c.pass).length;
  const score = Math.round((critPass / critical.length) * 70 + (allPass / checks.length) * 30);
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
    homeAnalysis: { title: a.title, wordCount: a.wordCount, linkCount: a.linkCount },
    crawledAt: new Date().toISOString(),
  };
}

module.exports = { crawlSite, normalizeBase };
