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

const SERIF = "'Fraunces',Georgia,'Times New Roman',serif";
const SANS = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const BRAND = '#1B4332';
const BRAND_TEXT = '#14302A';
const BODY = '#565650';
const MUTED = '#A3A299';
const LINE = '#EFEDE9';
const CARD_BG = '#FAF9F7';

function emailShell({ title, bodyHtml, preheader = '' }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F4F2EF;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4F2EF;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="540" style="max-width:540px;width:100%;background:#FFFFFF;border:1px solid #E8E5E0;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(27,67,50,0.04),0 8px 24px rgba(27,67,50,0.06);">
          <tr>
            <td style="padding:32px 40px 0 40px;font-family:${SANS};">
              ${logoHeader()}
            </td>
          </tr>
          <tr>
            <td style="padding:4px 40px 36px 40px;font-family:${SANS};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:26px 20px;border-top:1px solid ${LINE};font-family:${SANS};text-align:center;">
              <a href="${appUrl('/privacy')}" style="color:#8A8A82;text-decoration:none;font-size:12.5px;font-weight:500;margin:0 10px;">Privacy</a>
              <span style="color:#D5D3CC;">·</span>
              <a href="mailto:support@shelfmerch.com" style="color:#8A8A82;text-decoration:none;font-size:12.5px;font-weight:500;margin:0 10px;">Contact support</a>
              <div style="font-size:11.5px;color:#B5B4AB;margin-top:10px;">© ${year} Shelf Merch. All rights reserved.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function logoHeader() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
    <tr>
      <td valign="middle" style="padding-right:12px;">
        <div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(155deg,#1B4332,#2D6A4F);color:#EDECEA;font-family:${SERIF};font-weight:600;font-size:18px;line-height:36px;text-align:center;box-shadow:0 2px 6px rgba(27,67,50,0.25);">S</div>
      </td>
      <td valign="middle" style="font-family:${SERIF};font-weight:600;font-size:17px;color:${BRAND};letter-spacing:-0.01em;">Shelf Merch</td>
    </tr>
  </table>`;
}

function ctaButton(label, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 4px;">
    <tr>
      <td align="left" style="border-radius:9px;background:${BRAND};box-shadow:0 2px 4px rgba(27,67,50,0.15),0 6px 16px rgba(27,67,50,0.18);">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 28px;font-family:${SANS};font-size:14.5px;font-weight:600;color:#EDECEA !important;text-decoration:none;letter-spacing:0.01em;border-radius:9px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

function divider() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:32px 0;">
    <tr><td style="height:1px;background:#E8E5E0;font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;
}

function detailCard(rows) {
  const items = rows.filter((r) => r.value);
  if (!items.length) return '';
  const inner = items
    .map((row, i) => {
      const border =
        i < items.length - 1 ? `border-bottom:1px solid ${LINE};` : '';
      return `<tr>
        <td style="padding:14px 0;${border}font-family:${SANS};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="left" style="font-size:12.5px;font-weight:600;color:#8A8A82;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(row.label)}</td>
              <td align="right" style="font-size:14.5px;font-weight:600;color:${BRAND};">${escapeHtml(row.value)}</td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CARD_BG};border:1px solid ${LINE};border-radius:12px;">
    <tr><td style="padding:4px 20px;">${inner}</td></tr>
  </table>`;
}

function greetingLine(name) {
  const text = name ? `Hello ${escapeHtml(name)},` : 'Hello,';
  return `<p style="margin:0 0 16px 0;font-family:${SERIF};font-weight:600;font-size:24px;color:${BRAND_TEXT};letter-spacing:-0.01em;line-height:1.25;">${text}</p>`;
}

function messageParagraph(html) {
  return `<p style="margin:0 0 28px 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${BODY};">${html}</p>`;
}

function noteParagraph(text) {
  return `<p style="margin:24px 0 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${MUTED};">${text}</p>`;
}

function bold(text) {
  return `<b style="color:${BRAND};font-weight:600;">${text}</b>`;
}

/**
 * Invite email for new department managers.
 */
export function buildManagerInviteEmail({
  name = '',
  departmentName = '',
  organizationName = 'your organization',
  roleTitle = 'Department Manager',
  link = '',
}) {
  const fullLink = link || '';
  const safeDept = escapeHtml(departmentName || 'your department');
  const safeOrg = escapeHtml(organizationName);
  const safeRole = escapeHtml(roleTitle || 'Department Manager');
  const subject = `You're invited to manage ${departmentName || 'a department'} on Shelf Merch`;

  const bodyHtml = `
    ${greetingLine(name)}
    ${messageParagraph(
      `${safeOrg} has invited you to manage ${bold(safeDept)} on Shelf Merch. Accept the invitation below to set your password and access your department budget.`,
    )}
    ${ctaButton('Accept invitation →', fullLink)}
    ${divider()}
    ${detailCard([
      { label: 'Department', value: departmentName },
      { label: 'Role', value: roleTitle },
      { label: 'Organization', value: organizationName },
    ])}
    ${noteParagraph('This link expires in 7 days. If you did not expect this email, you can safely ignore it.')}`;

  const text = [
    name ? `Hello ${name},` : 'Hello,',
    '',
    `${organizationName} has invited you to manage ${departmentName || 'a department'} as ${roleTitle}.`,
    '',
    `Accept your invitation: ${fullLink}`,
    '',
    'This link expires in 7 days.',
  ].join('\n');

  return {
    subject,
    html: emailShell({
      title: subject,
      preheader: `Manage ${departmentName || 'your department'} budget on Shelf Merch`,
      bodyHtml,
    }),
    text,
  };
}

/**
 * Notification for existing users assigned as department managers.
 */
export function buildManagerAssignmentEmail({
  name = '',
  departmentName = '',
  organizationName = 'your organization',
  roleTitle = 'Department Manager',
  link = '',
}) {
  const fullLink = link || appUrl('/login');
  const safeDept = escapeHtml(departmentName || 'your department');
  const safeOrg = escapeHtml(organizationName);
  const safeRole = escapeHtml(roleTitle || 'Department Manager');
  const subject = `You've been assigned to manage ${departmentName || 'a department'}`;

  const bodyHtml = `
    ${greetingLine(name)}
    ${messageParagraph(
      `You've been assigned as ${bold(safeRole)} for ${bold(safeDept)} at ${bold(safeOrg)}. Sign in to manage campaigns, recipients, and your department's merchandise budget.`,
    )}
    ${ctaButton('Sign in to Shelf Merch →', fullLink)}
    ${divider()}
    ${detailCard([
      { label: 'Department', value: departmentName },
      { label: 'Role', value: roleTitle },
      { label: 'Organization', value: organizationName },
    ])}
    ${noteParagraph('Use the same email address this message was sent to when signing in.')}`;

  const text = [
    name ? `Hello ${name},` : 'Hello,',
    '',
    `You've been assigned as ${roleTitle} for ${departmentName} at ${organizationName}.`,
    '',
    `Sign in: ${fullLink}`,
  ].join('\n');

  return {
    subject,
    html: emailShell({
      title: subject,
      preheader: `Manage ${departmentName || 'your department'} on Shelf Merch`,
      bodyHtml,
    }),
    text,
  };
}
