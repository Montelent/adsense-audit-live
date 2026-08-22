import * as cheerio from 'cheerio';

const LEGAL_PATHS = {
  privacy: ['/privacy-policy', '/privacy', '/privacy-policy.html', '/pages/privacy-policy', '/legal/privacy'],
  about: ['/about', '/about-us', '/about.html', '/pages/about'],
  contact: ['/contact', '/contact-us', '/contact.html', '/pages/contact', '/support'],
  terms: ['/terms', '/terms-of-service', '/terms-of-use', '/disclaimer'],
};
const PRIVACY_KEYWORDS = ['privacy policy', 'privacy notice', 'cookie', 'cookies', 'personal data', 'google adsense', 'doubleclick'];
const ABOUT_KEYWORDS = ['about us', 'about me', 'who we are', 'our story', 'founder', 'mission'];
const CONTACT_KEYWORDS = ['contact us', 'get in touch', 'email us', 'contact form', 'reach out'];

const RISK_CATEGORIES = {
  piracy: ['nulled', 'warez', 'crack', 'cracked', 'serial key', 'license key free', 'torrent download', 'pirate bay', 'free premium account', 'leaked full', 'activation key'],
  adult: ['xxx', 'porn', 'onlyfans leak', 'adult video', 'nsfw'],
  gambling: ['online casino', 'sports betting', 'poker online', 'roulette real money'],
  pharma: ['buy viagra', 'prescription without', 'cheap xanax', 'pharmacy online no rx'],
  malware: ['hack tool', 'keylogger', 'ransomware', 'steal password'],
};

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

export function normalizeBase(input) {
  let u = (input || '').trim();
  if (!u) throw new Error('URL required');
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  const parsed = new URL(u);
  if (parsed.protocol === 'http:') parsed.protocol = 'https:';
  return parsed.origin;
}

function detectRisks(text) {
  const lower = text.toLowerCase();
  const found = {};
  for (const [cat, words] of Object.entries(RISK_CATEGORIES)) {
    const hits = words.filter((w) => lower.includes(w));
    if (hits.length) found[cat] = hits;
  }
  return found;
}

function analyzePageContent(html, url) {
  const $ = cheerio.load(html);
  $('script, style, noscript, iframe, svg').remove();
  const title = $('title').first().text().trim();
  const h1 = $('h1').first().text().trim();
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const imgCount = $('img').length;
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const words = bodyText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const avgWordLen = words.length ? words.reduce((s, w) => s + w.length, 0) / words.length : 0;

  // Rough keyword density of top repeated words (spam signal)
  const freq = {};
  words.forEach((w) => {
    const k = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (k.length < 4) return;
    freq[k] = (freq[k] || 0) + 1;
  });
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxDensity = wordCount ? (top[0]?.[1] || 0) / wordCount : 0;

  const outbound = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('http') && !href.includes(new URL(url).hostname)) outbound.push(href);
  });

  const risks = detectRisks(bodyText + ' ' + title);
  const riskList = Object.keys(risks);

  // Quality score 0-100 for this page
  let q = 40;
  if (wordCount >= 800) q += 25;
  else if (wordCount >= 400) q += 15;
  else if (wordCount >= 200) q += 5;
  else q -= 15;
  if (h1) q += 8;
  if (h2Count >= 2) q += 8;
  if (imgCount >= 1) q += 5;
  if (maxDensity > 0.08) q -= 20; // keyword stuffing
  if (riskList.length) q -= 30;
  if (outbound.length > 30) q -= 10; // heavy outbound / doorways
  q = Math.max(0, Math.min(100, q));

  let rating = 'low';
  if (q >= 70) rating = 'high';
  else if (q >= 45) rating = 'medium';

  let contentType = 'general informational';
  if (riskList.includes('piracy')) contentType = 'piracy / nulled (HIGH RISK — bad for AdSense)';
  else if (riskList.includes('adult')) contentType = 'adult (restricted / banned)';
  else if (riskList.includes('gambling')) contentType = 'gambling (restricted)';
  else if (riskList.includes('pharma')) contentType = 'pharma / health claims (risky)';
  else if (riskList.includes('malware')) contentType = 'malware / hacking (banned)';
  else if (wordCount < 200) contentType = 'thin content';
  else if (maxDensity > 0.08) contentType = 'possible keyword-stuffed / spammy';
  else if (outbound.length > 25 && wordCount < 400) contentType = 'possible doorway / affiliate-thin';
  else if (wordCount >= 600 && h2Count >= 2) contentType = 'in-depth article (good for AdSense)';

  return {
    url,
    title: title.slice(0, 100),
    h1: h1.slice(0, 100),
    wordCount,
    h2Count,
    h3Count,
    imgCount,
    avgWordLen: Math.round(avgWordLen * 10) / 10,
    outboundLinks: outbound.length,
    topKeywords: top.map(([w, c]) => `${w}(${c})`),
    keywordDensity: Math.round(maxDensity * 1000) / 10,
    qualityScore: q,
    qualityRating: rating,
    contentType,
    riskCategories: riskList,
    riskHits: risks,
    adsenseFit: riskList.length ? 'poor' : q >= 70 ? 'good' : q >= 45 ? 'moderate' : 'weak',
  };
}

function extractArticleLinks(html, base) {
  const $ = cheerio.load(html);
  const origin = new URL(base).origin;
  const seen = new Set();
  const links = [];
  $('a[href]').each((_, el) => {
    let href = $(el).attr('href') || '';
    try {
      const u = new URL(href, origin);
      if (u.origin !== origin) return;
      const path = u.pathname;
      if (path === '/' || path.length < 4) return;
      if (/\/(privacy|about|contact|terms|login|cart|tag|category|author|wp-admin)/i.test(path)) return;
      if (/\.(jpg|png|gif|css|js|pdf|zip)$/i.test(path)) return;
      const full = u.origin + u.pathname;
      if (seen.has(full)) return;
      seen.add(full);
      // Prefer post-like paths
      const score = /\d{4}|\/blog\/|\/post\/|\/article\/|\/news\//i.test(path) ? 2 : 1;
      links.push({ url: full, score, text: $(el).text().trim().slice(0, 80) });
    } catch (_) {}
  });
  links.sort((a, b) => b.score - a.score);
  return links.slice(0, 8);
}

function analyzeHomepage(html) {
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
  const risks = detectRisks(bodyText + ' ' + title);
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
    riskHits: Object.keys(risks),
    hasStructuredData: html.toLowerCase().includes('application/ld+json') || html.toLowerCase().includes('schema.org'),
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

export async function crawlSite(inputUrl) {
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
  const homeContent = analyzePageContent(home.html, home.finalUrl || base);

  // Sample internal posts/articles
  const candidates = extractArticleLinks(home.html, base);
  const sampled = [];
  for (const c of candidates.slice(0, 5)) {
    const page = await fetchPage(c.url, 7000);
    if (!page.ok || !page.html) continue;
    sampled.push(analyzePageContent(page.html, page.finalUrl || c.url));
  }

  const allPages = [homeContent, ...sampled];
  const avgQuality = Math.round(allPages.reduce((s, p) => s + p.qualityScore, 0) / allPages.length);
  const highCount = allPages.filter((p) => p.qualityRating === 'high').length;
  const lowCount = allPages.filter((p) => p.qualityRating === 'low').length;
  const riskPages = allPages.filter((p) => p.riskCategories.length > 0);
  const siteRisks = [...new Set(allPages.flatMap((p) => p.riskCategories))];

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
    { id: 'https', label: 'HTTPS / SSL active', critical: true, pass: usesHttps, detail: usesHttps ? `Loads over HTTPS (${home.finalUrl || base})` : 'Did not confirm HTTPS', fix: 'Enable SSL and force HTTPS redirects.' },
    { id: 'privacy', label: 'Privacy Policy page', critical: true, pass: privacy.found, detail: privacy.found ? `Found${privacy.url && privacy.url !== 'linked-from-homepage' ? ': ' + privacy.url : ' via homepage link'}` : 'Not found', recommendedPage: '/privacy-policy', fix: 'Create /privacy-policy disclosing cookies and Google AdSense/DoubleClick.', sampleText: privacy.found ? null : 'Privacy Policy\n\nWe use cookies. Google uses DoubleClick. Opt out: https://www.google.com/settings/ads' },
    { id: 'about', label: 'About / Author page (E-E-A-T)', critical: true, pass: about.found, detail: about.found ? `Found` : 'Not found', recommendedPage: '/about', fix: 'Create /about with real author identity.', sampleText: about.found ? null : 'About Us\n\nI am [Name], founder of [Site].' },
    { id: 'contact', label: 'Contact page', critical: true, pass: contact.found, detail: contact.found ? 'Found' : 'Not found', recommendedPage: '/contact', fix: 'Add /contact with form or email.', sampleText: contact.found ? null : 'Contact: contact@[domain.com]' },
    { id: 'terms', label: 'Terms / Disclaimer', critical: false, pass: terms.found, detail: terms.found ? 'Found' : 'Not detected', recommendedPage: '/terms', fix: 'Add Terms of Service.' },
    { id: 'mobile', label: 'Mobile viewport meta', critical: true, pass: a.hasViewport, detail: a.hasViewport ? 'Present' : 'Missing', fix: 'Add viewport meta tag.' },
    { id: 'noindex', label: 'Not blocked by noindex', critical: true, pass: !a.noindex, detail: a.noindex ? 'noindex present' : 'OK', fix: 'Remove noindex on public pages.' },
    { id: 'title', label: 'Page title', critical: true, pass: a.title.length > 3, detail: a.title ? `"${a.title.slice(0, 80)}"` : 'Missing', fix: 'Add descriptive title.' },
    { id: 'content-quality', label: 'Overall content quality', critical: true, pass: avgQuality >= 50 && lowCount <= highCount, detail: `Avg quality ${avgQuality}/100 across ${allPages.length} page(s) · ${highCount} high · ${lowCount} low`, fix: 'Publish longer original articles (800+ words) with clear headings. Avoid thin or spammy posts.' },
    { id: 'policy-risk', label: 'Publisher policy risk (nulled/adult/etc.)', critical: true, pass: siteRisks.length === 0, detail: siteRisks.length ? `Risk categories detected: ${siteRisks.join(', ')} on ${riskPages.length} page(s)` : 'No piracy/nulled/adult/gambling/malware signals in sampled pages', fix: 'Remove nulled, cracked, adult, or other prohibited content. AdSense bans these categories.' },
    { id: 'thin-posts', label: 'Sampled posts not thin', critical: false, pass: sampled.length === 0 || sampled.filter((p) => p.wordCount < 250).length <= sampled.length / 2, detail: sampled.length ? `${sampled.filter((p) => p.wordCount < 250).length} of ${sampled.length} sampled posts under 250 words` : 'No internal posts sampled (few post links found)', fix: 'Aim for 800–1500+ words on main articles.' },
    { id: 'nav', label: 'Clear navigation', critical: false, pass: a.hasNav, detail: a.hasNav ? 'Nav detected' : 'Weak nav', fix: 'Add clear menus.' },
    { id: 'footer', label: 'Footer present', critical: false, pass: a.hasFooter, detail: a.hasFooter ? 'Footer found' : 'No footer', fix: 'Footer with legal links.' },
    { id: 'schema', label: 'Structured data', critical: false, pass: a.hasStructuredData, detail: a.hasStructuredData ? 'Schema signals found' : 'None', fix: 'Optional Article schema.' },
  ];

  const critical = checks.filter((c) => c.critical);
  const critPass = critical.filter((c) => c.pass).length;
  const allPass = checks.filter((c) => c.pass).length;
  let score = Math.round((critPass / critical.length) * 55 + (allPass / checks.length) * 20 + avgQuality * 0.25);
  if (siteRisks.includes('piracy') || siteRisks.includes('malware') || siteRisks.includes('adult')) score = Math.min(score, 25);
  score = Math.max(5, Math.min(95, score));
  const approval = Math.min(90, Math.max(5, Math.round(score * 0.92)));

  return {
    success: true,
    hostname,
    finalUrl: home.finalUrl || base,
    score,
    approvalChance: approval,
    rejectionRisk: 100 - approval,
    criticalIssues: critical.filter((c) => !c.pass).length,
    checks,
    contentAnalysis: {
      pagesSampled: allPages.length,
      averageQuality: avgQuality,
      highQualityPages: highCount,
      lowQualityPages: lowCount,
      siteRiskCategories: siteRisks,
      pages: allPages.map((p) => ({
        url: p.url,
        title: p.title,
        wordCount: p.wordCount,
        qualityScore: p.qualityScore,
        qualityRating: p.qualityRating,
        contentType: p.contentType,
        adsenseFit: p.adsenseFit,
        riskCategories: p.riskCategories,
        h2Count: p.h2Count,
        outboundLinks: p.outboundLinks,
      })),
    },
    homeAnalysis: { title: a.title, wordCount: a.wordCount, linkCount: a.linkCount },
    crawledAt: new Date().toISOString(),
  };
}
