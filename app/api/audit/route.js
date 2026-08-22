import { crawlSite } from '../../../lib/crawler.js';
import { recordAudit, getPlan } from '../../../lib/store.js';
import { requireAdmin } from '../../../lib/auth.js';

// Vercel Hobby plan max function duration is 10s
export const maxDuration = 10;
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
    const admin = await requireAdmin(request);
    // Admin always gets Pro analysis on the frontend
    const isPro = !!admin || body.plan === 'pro';
    const maxSamples = isPro
      ? Math.min(Number(plan.proMaxSamples) || 10, 10)
      : Math.min(Number(plan.freeMaxSamples) || 3, 3);

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
    return Response.json(
      { success: false, error: err.message || 'Audit failed' },
      { status: 500 }
    );
  }
}
