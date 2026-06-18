import nodemailer from 'nodemailer';
import { env, emailConfigured } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/errors.js';
import { buildRedemptionInviteEmail } from './email-templates/redemptionInvite.template.js';
import { buildSurpriseGiftEmail } from './email-templates/surpriseGift.template.js';

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: env.EMAIL_SERVICE,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD.replace(/\s/g, ''),
      },
    });
  }
  return transporter;
}

export function appUrl(path = '') {
  const base = env.APP_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

/**
 * Send a transactional email via SMTP (Gmail when EMAIL_SERVICE=gmail).
 * Falls back to structured logging when credentials are not set (tests/dev).
 */
export async function sendEmail({ to, subject, text, html }) {
  if (!emailConfigured()) {
    logger.info({ to, subject, text }, 'EMAIL (stub — set EMAIL_USER + EMAIL_PASSWORD)');
    return { success: true, provider: 'stub' };
  }

  const from = env.EMAIL_FROM || env.EMAIL_USER;
  const info = await getTransporter().sendMail({ from, to, subject, text, html });

  logger.info({ to, subject, messageId: info.messageId }, 'Email sent');
  return { success: true, provider: 'smtp', messageId: info.messageId };
}

export async function sendOtpEmail(to, otp) {
  const subject = 'Your ShelfMerch verification code';
  const text = `Your verification code is ${otp}. It expires in 10 minutes.`;
  const html = `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`;

  try {
    return await sendEmail({ to, subject, text, html });
  } catch (err) {
    logger.error({ err, to }, 'OTP email send failed');
    throw new ApiError(502, 'Failed to send OTP email', 'EMAIL_SEND_FAILED');
  }
}

export async function sendPasswordResetEmail(to, token) {
  const link = appUrl(`/reset-password?token=${token}`);
  const subject = 'Reset your ShelfMerch password';
  const text = `Reset your password using this link (valid for 1 hour): ${link}`;
  const html = `<p>Reset your password using the link below (valid for 1 hour):</p><p><a href="${link}">${link}</a></p>`;

  try {
    return await sendEmail({ to, subject, text, html });
  } catch (err) {
    logger.error({ err, to }, 'Password reset email send failed');
  }
}

export async function sendInviteEmail(to, token, { name = '' } = {}) {
  const link = appUrl(`/accept-invite?token=${token}`);
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const subject = 'You have been invited to ShelfMerch';
  const text = `${greeting}\n\nYou have been invited to join ShelfMerch as a department manager.\n\nAccept your invitation and set your password:\n${link}\n\nThis link expires in 7 days.\n\nIf you do not see this email in your inbox, check your spam or promotions folder.`;
  const html = `<div style="font-family:sans-serif;line-height:1.5;color:#1a1a1a">
<p>${greeting}</p>
<p>You have been invited to join <strong>ShelfMerch</strong> as a department manager.</p>
<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#15784C;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Accept invitation</a></p>
<p style="font-size:13px;color:#555">Or copy this link: <a href="${link}">${link}</a></p>
<p style="font-size:13px;color:#777">This link expires in 7 days. If you do not see this email in your inbox, check spam or promotions.</p>
</div>`;

  try {
    return await sendEmail({ to, subject, text, html });
  } catch (err) {
    logger.error({ err, to }, 'Invite email send failed');
  }
}

export async function sendRedemptionInviteEmail({
  to,
  recipientName = '',
  senderName = 'Your team',
  message = '',
  giftName = 'Your gift',
  companyName = 'your company',
  link = '',
  campaignType = 'kit',
}) {
  const { subject, html, text } = buildRedemptionInviteEmail({
    recipientName,
    senderName,
    message,
    giftName,
    companyName,
    link,
    campaignType,
  });

  try {
    return await sendEmail({ to, subject, text, html });
  } catch (err) {
    logger.warn({ err, to, subject }, 'Redemption invite email send failed');
    return { success: false, provider: 'smtp' };
  }
}

export async function sendSurpriseGiftEmail({
  to,
  recipientName = '',
  senderName = 'Your team',
  message = '',
  giftName = 'Your gift',
  companyName = 'your company',
}) {
  const { subject, html, text } = buildSurpriseGiftEmail({
    recipientName,
    senderName,
    message,
    giftName,
    companyName,
  });

  try {
    return await sendEmail({ to, subject, text, html });
  } catch (err) {
    logger.warn({ err, to, subject }, 'Surprise gift email send failed');
    return { success: false, provider: 'smtp' };
  }
}

export async function sendNotificationEmail({ to, title, body = '', link = '' }) {
  const fullLink = link ? (link.startsWith('http') ? link : appUrl(link)) : '';
  const subject = title;
  const text = [title, body, fullLink].filter(Boolean).join('\n\n');
  const html = [
    `<p><strong>${title}</strong></p>`,
    body ? `<p>${body}</p>` : '',
    fullLink ? `<p><a href="${fullLink}">${fullLink}</a></p>` : '',
  ]
    .filter(Boolean)
    .join('');

  try {
    return await sendEmail({ to, subject, text, html });
  } catch (err) {
    logger.warn({ err, to, title }, 'Notification email send failed');
    return { success: false, provider: 'smtp' };
  }
}
