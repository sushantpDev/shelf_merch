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

/**
 * ShelfMerch brand — matches product --blue-500 / user swatch.
 * Layout inspired by the enterprise invite mock (logo above card, icon title, detail box).
 */
const SANS =
  "'Inter',-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const BG = '#F8F9FB';
const CARD = '#FFFFFF';
const PRIMARY = '#3D5FD9';
const PRIMARY_DARK = '#2B4AB8';
const BORDER = '#E5E7EB';
const TITLE = '#111827';
const BODY = '#374151';
const MUTED = '#6B7280';
const VALUE = '#111827';
const ACCENT_SOFT = '#EEF2FF';

function emailShell({ title, bodyHtml, preheader = '' }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
  <!--[if mso]>
  <style type="text/css">body, table, td { font-family: Arial, Helvetica, sans-serif !important; }</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:${BG};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BG};">
    <tr>
      <td align="center" style="padding:40px 16px 24px 16px;">
        ${logoAboveCard()}
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:0 16px 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:${CARD};border:1px solid ${BORDER};border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(17,24,39,0.04),0 10px 28px rgba(17,24,39,0.06);">
          <tr>
            <td style="padding:40px;font-family:${SANS};">
              ${bodyHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:8px 16px 48px 16px;font-family:${SANS};">
        <a href="${appUrl('/privacy')}" style="color:${MUTED};text-decoration:none;font-size:12px;font-weight:500;">Privacy</a>
        <span style="color:${MUTED};margin:0 8px;">|</span>
        <a href="mailto:support@shelfmerch.com" style="color:${MUTED};text-decoration:none;font-size:12px;font-weight:500;">Contact Support</a>
        <div style="font-size:11px;color:${MUTED};margin-top:12px;line-height:1.5;">© ${year} ShelfMerch. All rights reserved.</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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

/** Circular soft icon + title row (matches mock). */
function titleWithIcon(text) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
    <tr>
      <td valign="top" width="52" style="padding-right:14px;">
        <div style="width:44px;height:44px;border-radius:50%;background:${ACCENT_SOFT};text-align:center;line-height:44px;">
          <span style="font-size:20px;line-height:44px;">✉</span>
        </div>
      </td>
      <td valign="middle" style="font-family:${SANS};font-weight:700;font-size:26px;line-height:1.25;letter-spacing:-0.03em;color:${TITLE};">${escapeHtml(text)}</td>
    </tr>
  </table>`;
}

function greetingLine(name) {
  if (!name) {
    return `<p style="margin:0 0 12px 0;font-family:${SANS};font-size:15px;color:${BODY};line-height:1.5;">Hi,</p>`;
  }
  return `<p style="margin:0 0 12px 0;font-family:${SANS};font-size:15px;color:${BODY};line-height:1.5;">Hi <b style="color:${VALUE};font-weight:600;">${escapeHtml(name)}</b>,</p>`;
}

function messageParagraph(html) {
  return `<p style="margin:0 0 14px 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${BODY};">${html}</p>`;
}

function brandBold(text) {
  return `<b style="color:${PRIMARY_DARK};font-weight:600;">${escapeHtml(text)}</b>`;
}

function ctaButton(label, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 24px 0;">
    <tr>
      <td align="center" style="border-radius:8px;background:${PRIMARY};">
        <a href="${escapeHtml(href)}" style="display:block;width:100%;box-sizing:border-box;padding:14px 24px;font-family:${SANS};font-size:15px;font-weight:600;color:#FFFFFF !important;text-decoration:none;text-align:center;border-radius:8px;line-height:20px;">
          <span style="color:#FFFFFF !important;">${escapeHtml(label)}</span>
        </a>
      </td>
    </tr>
  </table>`;
}

/**
 * Bordered info box with icon + uppercase label + value (mock layout).
 */
function detailBox(rows) {
  const items = rows.filter((r) => r.value);
  if (!items.length) return '';

  const icons = {
    organization: '🏢',
    department: '👥',
    role: '💼',
  };

  const inner = items
    .map((row, i) => {
      const border =
        i < items.length - 1 ? `border-bottom:1px solid ${BORDER};` : '';
      const icon = icons[row.key] || '•';
      return `<tr>
        <td style="padding:16px 18px;${border}">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="28" valign="middle" style="font-size:16px;padding-right:10px;">${icon}</td>
              <td valign="middle">
                <div style="font-family:${SANS};font-size:11px;font-weight:600;color:${MUTED};letter-spacing:0.06em;text-transform:uppercase;margin-bottom:2px;">${escapeHtml(row.label)}</div>
                <div style="font-family:${SANS};font-size:15px;font-weight:600;color:${VALUE};line-height:1.35;">${escapeHtml(row.value)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAFBFC;border:1px solid ${BORDER};border-radius:10px;margin:0 0 24px 0;">
    ${inner}
  </table>`;
}

function inviteSentTo(email) {
  if (!email) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
    <tr>
      <td width="22" valign="top" style="font-size:13px;padding-right:8px;padding-top:1px;">✉</td>
      <td style="font-family:${SANS};font-size:13px;line-height:1.5;color:${MUTED};">
        This invitation was sent to:<br>
        <b style="color:${VALUE};font-weight:600;">${escapeHtml(email)}</b>
      </td>
    </tr>
  </table>`;
}

function disclaimer(text) {
  return `<p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.55;color:${MUTED};">${escapeHtml(text)}</p>`;
}

/**
 * Invite email for new department managers.
 */
export function buildManagerInviteEmail({
  name = '',
  email = '',
  departmentName = '',
  organizationName = 'your organization',
  roleTitle = 'Department Manager',
  link = '',
}) {
  const fullLink = link || '';
  const safeDept = departmentName || 'your department';
  const safeOrg = organizationName;
  const safeRole = roleTitle || 'Department Manager';
  const subject = `You've been invited to ShelfMerch`;

  const bodyHtml = `
    ${titleWithIcon("You've been invited to ShelfMerch")}
    ${greetingLine(name)}
    ${messageParagraph(
      `You've been assigned as ${brandBold(safeRole)} for the ${brandBold(safeDept)} department at ${brandBold(safeOrg)}.`,
    )}
    ${messageParagraph(
      `Sign in to ShelfMerch to access your team's merchandise budget and start managing campaigns.`,
    )}
    ${ctaButton('Sign in to ShelfMerch →', fullLink)}
    ${detailBox([
      { key: 'organization', label: 'Organization', value: organizationName },
      { key: 'department', label: 'Department', value: departmentName },
      { key: 'role', label: 'Role', value: roleTitle },
    ])}
    ${inviteSentTo(email)}
    ${disclaimer("If you weren't expecting this invitation, you can safely ignore this email.")}`;

  const text = [
    "You've been invited to ShelfMerch",
    '',
    name ? `Hi ${name},` : 'Hi,',
    '',
    `You've been assigned as ${safeRole} for the ${safeDept} department at ${safeOrg}.`,
    '',
    "Sign in to ShelfMerch to access your team's merchandise budget and start managing campaigns.",
    '',
    `Sign in: ${fullLink}`,
    '',
    `Organization: ${organizationName}`,
    `Department: ${departmentName || '—'}`,
    `Role: ${roleTitle}`,
    email ? `This invitation was sent to: ${email}` : '',
    '',
    "If you weren't expecting this invitation, you can safely ignore this email.",
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject,
    html: emailShell({
      title: subject,
      preheader: `Join ${organizationName} on ShelfMerch as ${roleTitle}`,
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
  email = '',
  departmentName = '',
  organizationName = 'your organization',
  roleTitle = 'Department Manager',
  link = '',
}) {
  const fullLink = link || appUrl('/login');
  const safeDept = departmentName || 'your department';
  const safeOrg = organizationName;
  const safeRole = roleTitle || 'Department Manager';
  const subject = `You've been invited to ShelfMerch`;

  const bodyHtml = `
    ${titleWithIcon("You've been invited to ShelfMerch")}
    ${greetingLine(name)}
    ${messageParagraph(
      `You've been assigned as ${brandBold(safeRole)} for the ${brandBold(safeDept)} department at ${brandBold(safeOrg)}.`,
    )}
    ${messageParagraph(
      `Sign in to ShelfMerch to access your team's merchandise budget and start managing campaigns.`,
    )}
    ${ctaButton('Sign in to ShelfMerch →', fullLink)}
    ${detailBox([
      { key: 'organization', label: 'Organization', value: organizationName },
      { key: 'department', label: 'Department', value: departmentName },
      { key: 'role', label: 'Role', value: roleTitle },
    ])}
    ${inviteSentTo(email)}
    ${disclaimer("If you weren't expecting this invitation, you can safely ignore this email.")}`;

  const text = [
    "You've been invited to ShelfMerch",
    '',
    name ? `Hi ${name},` : 'Hi,',
    '',
    `You've been assigned as ${safeRole} for the ${safeDept} department at ${safeOrg}.`,
    '',
    `Sign in: ${fullLink}`,
  ].join('\n');

  return {
    subject,
    html: emailShell({
      title: subject,
      preheader: `Manage ${departmentName || 'your department'} on ShelfMerch`,
      bodyHtml,
    }),
    text,
  };
}
