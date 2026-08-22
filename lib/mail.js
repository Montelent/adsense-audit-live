import nodemailer from 'nodemailer';
import { getMailSettings } from './store.js';

export async function sendMail({ to, subject, text, html }) {
  const cfg = getMailSettings();
  if (!cfg.enabled) {
    return { ok: false, error: 'Mail is not enabled. Configure SMTP in Admin → Email.' };
  }
  if (!cfg.host || !cfg.fromEmail) {
    return { ok: false, error: 'SMTP host and From email are required' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: Number(cfg.port) || 587,
      secure: !!cfg.secure || Number(cfg.port) === 465,
      auth: cfg.user
        ? { user: cfg.user, pass: cfg.pass }
        : undefined,
    });

    const info = await transporter.sendMail({
      from: cfg.fromName ? `"${cfg.fromName}" <${cfg.fromEmail}>` : cfg.fromEmail,
      to,
      subject,
      text,
      html: html || text?.replace(/\n/g, '<br>'),
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('Mail error:', err);
    return { ok: false, error: err.message || 'Failed to send email' };
  }
}

export async function sendPasswordResetEmail(to, resetUrl) {
  return sendMail({
    to,
    subject: 'Reset your password',
    text: `You requested a password reset.\n\nOpen this link (valid 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset password</a></p><p style="color:#666;font-size:12px">Link valid for 1 hour. If you did not request this, ignore this email.</p>`,
  });
}
