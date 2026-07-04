import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { env, emailConfigured } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/errors.js';
import { buildRedemptionInviteEmail } from './email-templates/redemptionInvite.template.js';
import { buildSurpriseGiftEmail } from './email-templates/surpriseGift.template.js';
import {
  buildManagerAssignmentEmail,
  buildManagerInviteEmail,
} from './email-templates/managerEmails.template.js';

let transporter;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function presetBannerAttachment(preset = '') {
  if (!preset || !/^[a-z0-9-]+$/i.test(preset)) return null;
  const filePath = path.resolve(__dirname, '../../../web/public/shop-banners', `${preset}.png`);
  if (!fs.existsSync(filePath)) return null;
  return {
    filename: `shop-banner-${preset}.png`,
    path: filePath,
    cid: `shop-banner-${preset}@shelfmerch`,
  };
}

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
export async function sendEmail({ to, subject, text, html, attachments }) {
  if (!emailConfigured()) {
    logger.info({ to, subject, text }, 'EMAIL (stub — set EMAIL_USER + EMAIL_PASSWORD)');
    return { success: true, provider: 'stub' };
  }

  const from = env.EMAIL_FROM || env.EMAIL_USER;
  const info = await getTransporter().sendMail({ from, to, subject, text, html, attachments });

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

export async function sendInviteEmail(
  to,
  token,
  { name = '', departmentName = '', organizationName = '', roleTitle = '' } = {},
) {
  const link = appUrl(`/accept-invite?token=${token}`);
  const { subject, html, text } = buildManagerInviteEmail({
    name,
    departmentName,
    organizationName,
    roleTitle,
    link,
  });

  try {
    return await sendEmail({ to, subject, text, html });
  } catch (err) {
    logger.error({ err, to }, 'Invite email send failed');
  }
}

export async function sendManagerAssignmentEmail({
  to,
  name = '',
  departmentName = '',
  organizationName = '',
  roleTitle = '',
  link = '/login',
}) {
  const fullLink = link.startsWith('http') ? link : appUrl(link);
  const { subject, html, text } = buildManagerAssignmentEmail({
    name,
    departmentName,
    organizationName,
    roleTitle,
    link: fullLink,
  });

  try {
    return await sendEmail({ to, subject, text, html });
  } catch (err) {
    logger.warn({ err, to, subject }, 'Manager assignment email send failed');
    return { success: false, provider: 'smtp' };
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
  pointsScope = 'shop',
  shopName = '',
  shopLogoUrl = '',
  shopBannerTheme = '',
  shopBannerPreset = '',
  shopCurrencyMode = 'points',
}) {
  const bannerAttachment = presetBannerAttachment(shopBannerPreset);
  const { subject, html, text } = buildRedemptionInviteEmail({
    recipientName,
    senderName,
    message,
    giftName,
    companyName,
    link,
    campaignType,
    pointsScope,
    shopName,
    shopBannerTheme,
    shopBannerPreset,
    shopBannerCid: bannerAttachment?.cid ?? '',
    shopCurrencyMode,
  });

  try {
    return await sendEmail({
      to,
      subject,
      text,
      html,
      attachments: bannerAttachment ? [bannerAttachment] : undefined,
    });
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
