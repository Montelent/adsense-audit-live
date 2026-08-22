import { crawlSite } from '../../../lib/crawler.js';
import { recordAudit } from '../../../lib/store.js';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = body.url || body.website;
    if (!url || typeof url !== 'string') {
      return Response.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    const result = await crawlSite(url);

    if (result.success) {
      try {
        recordAudit({
          hostname: result.hostname,
          score: result.score,
          approvalChance: result.approvalChance,
          criticalIssues: result.criticalIssues,
        });
      } catch (_) {}
    }

    return Response.json(result);
  } catch (err) {
    console.error('Audit error:', err);
    return Response.json(
      { success: false, error: err.message || 'Audit failed' },
      { status: 500 }
    );
  }
}
