import {
  getSettings,
  updateSettings,
  getAds,
  updateAds,
  getScripts,
  updateScripts,
  getPlan,
  updatePlan,
  getPayments,
  updatePayments,
} from '../../../lib/store.js';
import { requireAdmin } from '../../../lib/auth.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'settings';
  if (type === 'ads') return Response.json({ ads: getAds() });
  if (type === 'scripts') return Response.json({ scripts: getScripts() });
  if (type === 'plan') return Response.json({ plan: getPlan() });
  if (type === 'payments') return Response.json({ payments: getPayments() });
  if (type === 'all') {
    return Response.json({
      settings: getSettings(),
      ads: getAds(),
      scripts: getScripts(),
      plan: getPlan(),
      payments: getPayments(),
    });
  }
  return Response.json({ settings: getSettings() });
}

export async function PUT(request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (body.settings) updateSettings(body.settings);
    if (body.ads) updateAds(body.ads);
    if (body.scripts) updateScripts(body.scripts);
    if (body.plan) updatePlan(body.plan);
    if (body.payments) updatePayments(body.payments);
    return Response.json({
      ok: true,
      settings: getSettings(),
      ads: getAds(),
      scripts: getScripts(),
      plan: getPlan(),
      payments: getPayments(),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
