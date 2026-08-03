import { env } from '../../config/env.js';

function appUrl(path = '') {
  const base = env.APP_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SANS =
  "'Inter',-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const BG = '#F8F9FB';
const CARD = '#FFFFFF';
const PRIMARY = '#3D5FD9';
const BORDER = '#E5E7EB';
const TITLE = '#111827';
const BODY = '#374151';
const MUTED = '#6B7280';
const VALUE = '#111827';
const ACCENT_SOFT = '#EEF2FF';

function logoAboveCard() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td valign="middle" style="padding-right:10px;">
        <div style="width:32px;height:32px;border-radius:8px;background:${PRIMARY};color:#FFFFFF;font-family:${SANS};font-weight:700;font-size:15px;line-height:32px;text-align:center;">S</div>
      </td>
      <td valign="middle" style="font-family:${SANS};font-weight:700;font-size:18px;color:${VALUE};letter-spacing:-0.03em;">ShelfMerch</td>
    </tr>
  </table>`;
}

export function buildPasswordResetEmail({ link, minutes = 30 }) {
  const subject = 'Reset your ShelfMerch password';
  const year = new Date().getFullYear();
  const safeLink = escapeHtml(link);
  const text = [
    'Hello,',
    '',
    'We received a request to reset your ShelfMerch password.',
    'Click the link below to create a new password:',
    link,
    '',
    `This link expires in ${minutes} minutes.`,
    "If you didn't request this, simply ignore this email.",
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Reset your ShelfMerch password — link expires in ${minutes} minutes.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BG};">
    <tr>
      <td align="center" style="padding:40px 16px 24px 16px;">${logoAboveCard()}</td>
    </tr>
    <tr>
      <td align="center" style="padding:0 16px 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:${CARD};border:1px solid ${BORDER};border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(17,24,39,0.04),0 10px 28px rgba(17,24,39,0.06);">
          <tr>
            <td style="padding:40px;font-family:${SANS};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td valign="top" width="52" style="padding-right:14px;">
                    <div style="width:44px;height:44px;border-radius:50%;background:${ACCENT_SOFT};text-align:center;line-height:44px;">
                      <span style="font-size:20px;line-height:44px;">🔑</span>
                    </div>
                  </td>
                  <td valign="middle" style="font-family:${SANS};font-weight:700;font-size:24px;line-height:1.25;letter-spacing:-0.03em;color:${TITLE};">Reset your password</td>
                </tr>
              </table>
              <p style="margin:0 0 12px 0;font-family:${SANS};font-size:15px;color:${BODY};line-height:1.5;">Hello,</p>
              <p style="margin:0 0 14px 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${BODY};">
                We received a request to reset your ShelfMerch password.
                Click the button below to create a new password.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 24px 0;">
                <tr>
                  <td align="center" style="border-radius:8px;background:${PRIMARY};">
                    <a href="${safeLink}" style="display:block;width:100%;box-sizing:border-box;padding:14px 24px;font-family:${SANS};font-size:15px;font-weight:600;color:#FFFFFF !important;text-decoration:none;text-align:center;border-radius:8px;line-height:20px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 10px 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${MUTED};">
                This link expires in <b style="color:${VALUE};">${minutes} minutes</b>.
              </p>
              <p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTED};">
                If you didn't request this, simply ignore this email. Your password will stay the same.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:8px 16px 48px 16px;font-family:${SANS};font-size:11px;color:${MUTED};">
        © ${year} ShelfMerch. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
