import { findUserByEmail, setPasswordResetToken } from '../../../../lib/store.js';
import { sendPasswordResetEmail } from '../../../../lib/mail.js';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    const user = await findUserByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await setPasswordResetToken(user.id, token, Date.now() + 60 * 60 * 1000);
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
      const resetUrl = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      const mail = await sendPasswordResetEmail(email, resetUrl);
      if (!mail.ok) {
        console.error('Reset mail failed:', mail.error);
        return Response.json({
          ok: true,
          message: 'If that email exists, a reset link was sent. (Mail may not be configured — check Admin → Email.)',
          mailError: mail.error,
        });
      }
    }
    return Response.json({
      ok: true,
      message: 'If that email exists, a reset link was sent.',
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
