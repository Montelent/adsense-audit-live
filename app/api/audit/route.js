import { crawlSite } from '../../../lib/crawler.js';
import { recordAudit, getPlan } from '../../../lib/store.js';
import { isProSession } from '../../../lib/auth.js';

// Needs Vercel Pro for long runs; Hobby still hard-caps around 10s
export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = body.url || body.website;
    if (!url || typeof url !== 'string') {
      return Response.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    const plan = getPlan();
    const isPro = await isProSession(request);
    const maxSamples = isPro
      ? Math.min(Math.max(Number(plan.proMaxSamples) || 200, 1), 200)
      : Math.min(Math.max(Number(plan.freeMaxSamples) || 20, 1), 20);

    const result = await crawlSite(url, { maxSamples, isPro });

    if (result.success) {
      try {
        recordAudit({
          hostname: result.hostname,
          score: result.score,
          approvalChance: result.approvalChance,
          criticalIssues: result.criticalIssues,
          plan: isPro ? 'pro' : 'free',
        });
      } catch (_) {}
    }

    result.planUsed = isPro ? 'pro' : 'free';
    result.maxSamples = maxSamples;
    return Response.json(result);
  } catch (err) {
    console.error('Audit error:', err);
    return Response.json({ success: false, error: err.message || 'Audit failed' }, { status: 500 });
  }
}
