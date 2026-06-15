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

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'SM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function truncateLink(url, max = 48) {
  if (url.length <= max) return url;
  return `${url.slice(0, max)}…`;
}

/**
 * Production-ready redemption invite email — table layout for broad client support.
 * Based on the Shelf Merch branded gift email design.
 */
export function buildRedemptionInviteEmail({
  recipientName = '',
  senderName = 'Your team',
  message = '',
  giftName = 'Your gift',
  companyName = 'your company',
  link = '',
  campaignType = 'kit',
}) {
  const fullLink = link ? (link.startsWith('http') ? link : appUrl(link)) : '';
  const safeRecipient = escapeHtml(recipientName);
  const safeSender = escapeHtml(senderName);
  const safeMessage = escapeHtml(message);
  const safeGift = escapeHtml(giftName);
  const safeCompany = escapeHtml(companyName);
  const safeLink = escapeHtml(fullLink);
  const safeLinkShort = escapeHtml(truncateLink(fullLink));
  const avatar = escapeHtml(initials(senderName));

  const isPoints = campaignType === 'points';
  const heroHeading = isPoints
    ? `${safeCompany} sent you<br>reward points.`
    : `${safeCompany} is sending<br>you something special.`;
  const heroSub = isPoints
    ? 'Your team has gifted you points to spend at the company store. Redeem them on items you actually want.'
    : 'Your team has put together a welcome kit. Choose your preferences and we\'ll ship it straight to you — completely on them.';
  const giftSub = isPoints
    ? 'Browse the store and pick what you like'
    : 'You pick size, colour &amp; shipping address';
  const ctaLabel = isPoints ? 'Redeem your points →' : 'Claim your gift →';
  const subject = isPoints
    ? `${senderName} sent you reward points`
    : `${senderName} sent you a gift`;

  const steps = isPoints
    ? `
      <tr><td style="padding:0 0 12px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="28" valign="top" style="padding-top:1px;">
            <div style="width:22px;height:22px;border-radius:50%;background:#1B4332;color:#fff;font-size:10px;font-weight:700;line-height:22px;text-align:center;">1</div>
          </td>
          <td style="font-size:13px;color:#444;line-height:1.55;padding-left:4px;"><b style="color:#1A1A1A;font-weight:600;">Click "${ctaLabel.replace(' →', '')}"</b> — opens your secure personal page</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:0 0 12px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="28" valign="top" style="padding-top:1px;">
            <div style="width:22px;height:22px;border-radius:50%;background:#1B4332;color:#fff;font-size:10px;font-weight:700;line-height:22px;text-align:center;">2</div>
          </td>
          <td style="font-size:13px;color:#444;line-height:1.55;padding-left:4px;"><b style="color:#1A1A1A;font-weight:600;">Browse the catalog</b> — choose items within your point balance</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="28" valign="top" style="padding-top:1px;">
            <div style="width:22px;height:22px;border-radius:50%;background:#1B4332;color:#fff;font-size:10px;font-weight:700;line-height:22px;text-align:center;">3</div>
          </td>
          <td style="font-size:13px;color:#444;line-height:1.55;padding-left:4px;"><b style="color:#1A1A1A;font-weight:600;">Enter your address</b> — we handle shipping from there</td>
        </tr></table>
      </td></tr>`
  : `
      <tr><td style="padding:0 0 12px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="28" valign="top" style="padding-top:1px;">
            <div style="width:22px;height:22px;border-radius:50%;background:#1B4332;color:#fff;font-size:10px;font-weight:700;line-height:22px;text-align:center;">1</div>
          </td>
          <td style="font-size:13px;color:#444;line-height:1.55;padding-left:4px;"><b style="color:#1A1A1A;font-weight:600;">Click "Claim your gift"</b> — opens your secure personal page</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:0 0 12px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="28" valign="top" style="padding-top:1px;">
            <div style="width:22px;height:22px;border-radius:50%;background:#1B4332;color:#fff;font-size:10px;font-weight:700;line-height:22px;text-align:center;">2</div>
          </td>
          <td style="font-size:13px;color:#444;line-height:1.55;padding-left:4px;"><b style="color:#1A1A1A;font-weight:600;">Pick your preferences</b> — size, colour, and any available options</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="28" valign="top" style="padding-top:1px;">
            <div style="width:22px;height:22px;border-radius:50%;background:#1B4332;color:#fff;font-size:10px;font-weight:700;line-height:22px;text-align:center;">3</div>
          </td>
          <td style="font-size:13px;color:#444;line-height:1.55;padding-left:4px;"><b style="color:#1A1A1A;font-weight:600;">Enter your address</b> — we handle shipping from there</td>
        </tr></table>
      </td></tr>`;

  const greeting = safeRecipient ? `Hi ${safeRecipient},` : 'Hi there,';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#EDECEA;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#EDECEA;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="580" style="max-width:580px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1B4332;border-radius:10px 10px 0 0;padding:20px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td valign="middle" style="padding-right:10px;">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <path d="M4 22L4 10C4 8.9 4.9 8 6 8L22 8C23.1 8 24 8.9 24 10L24 22C24 23.1 23.1 24 22 24L6 24C4.9 24 4 23.1 4 22Z" fill="rgba(255,255,255,0.15)"/>
                    <path d="M9 8V6C9 4.9 9.9 4 11 4H17C18.1 4 19 4.9 19 6V8" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                    <rect x="11" y="13" width="6" height="5" rx="1" fill="rgba(255,255,255,0.7)"/>
                    <line x1="4" y1="13" x2="24" y2="13" stroke="white" stroke-width="1.5"/>
                  </svg>
                </td>
                <td valign="middle" style="color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;letter-spacing:-0.3px;">Shelf Merch</td>
              </tr></table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:#1B4332;padding:0 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="height:1px;background:rgba(255,255,255,0.12);font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding-top:36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                  <div style="font-size:11px;font-weight:600;color:#6EE7A0;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">You have a gift waiting</div>
                  <div style="font-size:28px;font-weight:700;color:#ffffff;line-height:1.25;letter-spacing:-0.6px;margin-bottom:12px;">${heroHeading}</div>
                  <div style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.65;">${heroSub}</div>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <div style="font-size:14px;color:#444;margin-bottom:20px;">${greeting}</div>

              <!-- Sender -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;border-bottom:1px solid #F0EFED;">
                <tr>
                  <td width="56" valign="top" style="padding-bottom:20px;">
                    <div style="width:42px;height:42px;border-radius:50%;background:#1B4332;color:#fff;font-size:13px;font-weight:700;line-height:42px;text-align:center;">${avatar}</div>
                  </td>
                  <td valign="middle" style="padding-bottom:20px;">
                    <div style="font-size:14px;font-weight:600;color:#1A1A1A;">${safeSender}</div>
                    <div style="font-size:12px;color:#9C9C9C;margin-top:2px;">Sending via Shelf Merch · Corporate Gifting</div>
                  </td>
                </tr>
              </table>

              ${safeMessage ? `<div style="font-size:14px;color:#555;line-height:1.65;font-style:italic;padding:16px;background:#F8F7F5;border-left:3px solid #1B4332;border-radius:0 6px 6px 0;margin-bottom:28px;">&ldquo;${safeMessage}&rdquo;</div>` : ''}

              <!-- Gift card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #E8E6E1;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                      <td width="68" valign="middle">
                        <div style="width:52px;height:52px;background:#F0F7F3;border-radius:10px;text-align:center;line-height:52px;">
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1B4332" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
                            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                          </svg>
                        </div>
                      </td>
                      <td valign="middle" style="padding-left:8px;">
                        <div style="font-size:11px;font-weight:600;color:#9C9C9C;letter-spacing:0.07em;text-transform:uppercase;margin-bottom:4px;">Your gift</div>
                        <div style="font-size:15px;font-weight:700;color:#1A1A1A;margin-bottom:3px;">${safeGift}</div>
                        <div style="font-size:12px;color:#888;">${giftSub}</div>
                      </td>
                      <td align="right" valign="middle" style="white-space:nowrap;">
                        <span style="display:inline-block;background:#F0FDF4;color:#166534;font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;border:1px solid #BBF7D0;">✦ Ready to claim</span>
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <div style="font-size:11px;font-weight:600;color:#9C9C9C;letter-spacing:0.07em;text-transform:uppercase;margin-bottom:14px;">How to claim</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${steps}</table>

              <!-- Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;">
                <tr>
                  <td width="36" valign="middle" style="padding:11px 0 11px 14px;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#92400E" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l3 1.5"/></svg>
                  </td>
                  <td style="padding:11px 14px 11px 0;font-size:12px;color:#92400E;line-height:1.5;">
                    <b style="font-weight:600;">Link expires in 30 days.</b> This is a personal, one-time-use link — please don&rsquo;t share it.
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              ${fullLink ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td align="center" style="border-radius:8px;background:#1B4332;">
                  <a href="${safeLink}" target="_blank" style="display:block;padding:15px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">${ctaLabel}</a>
                </td></tr>
              </table>
              <div style="text-align:center;margin-top:10px;font-size:11px;color:#9C9C9C;line-height:1.5;">
                Or use your link:<br>
                <a href="${safeLink}" target="_blank" style="color:#1B4332;font-weight:500;text-decoration:underline;word-break:break-all;">${safeLinkShort}</a>
              </div>` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8F7F5;border-radius:0 0 10px 10px;padding:24px 32px;border-top:1px solid #E8E6E1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:8px;">Shelf Merch · Corporate Gifting Platform</div>
              <div style="font-size:11px;color:#999;line-height:1.65;">
                This gift was sent by your employer through Shelf Merch. Your redemption link is private and tied to you only.
                For questions about the gift, reach out to ${safeSender} at ${safeCompany}.<br><br>
                Shelf Merch · Hyderabad, India
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr>
                <td style="padding-right:16px;"><a href="${escapeHtml(appUrl('/privacy'))}" style="font-size:11px;color:#888;text-decoration:none;">Privacy Policy</a></td>
                <td style="padding-right:16px;"><a href="${escapeHtml(appUrl('/terms'))}" style="font-size:11px;color:#888;text-decoration:none;">Terms of Service</a></td>
                <td><a href="${escapeHtml(appUrl('/help'))}" style="font-size:11px;color:#888;text-decoration:none;">Help Center</a></td>
              </tr></table>
            </td>
          </tr>

        </table>

        <div style="text-align:center;margin-top:18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;color:#BCBBB8;">
          Sent securely via Shelf Merch · Trusted by People Teams
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    greeting,
    '',
    isPoints
      ? `${companyName} sent you reward points.`
      : `${companyName} is sending you something special.`,
    '',
    message ? `"${message}"` : '',
    message ? '' : null,
    `From: ${senderName}`,
    `Gift: ${giftName}`,
    '',
    fullLink ? `${ctaLabel.replace(' →', '')}: ${fullLink}` : '',
    '',
    'Link expires in 30 days. This is a personal, one-time-use link — please do not share it.',
    '',
    '— Shelf Merch · Corporate Gifting Platform',
  ]
    .filter((line) => line !== null)
    .join('\n');

  return { subject, html, text };
}
