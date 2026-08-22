import { jsonClearSession } from '../../../../lib/auth.js';

export async function POST() {
  return jsonClearSession({ ok: true });
}
