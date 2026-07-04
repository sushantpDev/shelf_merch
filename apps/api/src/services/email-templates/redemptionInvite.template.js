import { env } from '../../config/env.js';

function appUrl(path = '') {
  const base = env.APP_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

function absoluteUrl(url = '') {
  if (!url) return '';
  if (/^(https?:|data:)/i.test(url)) return url;
  return appUrl(url.startsWith('/') ? url : `/${url}`);
}

function emailSafeImageUrl(url = '') {
  if (!url) return '';
  if (!/^https?:/i.test(url)) return '';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return '';
    return url;
  } catch {
    return '';
  }
}

function presetBannerUrl(preset = '') {
  if (!preset || !/^[a-z0-9-]+$/i.test(preset)) return '';
  return emailSafeImageUrl(absoluteUrl(`/shop-banners/${preset}.png`));
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
  pointsScope = 'shop',
  shopName = '',
  shopBannerTheme = '',
  shopBannerPreset = '',
  shopBannerCid = '',
  shopCurrencyMode = 'points',
}) {
  const fullLink = link ? (link.startsWith('http') ? link : appUrl(link)) : '';
  const safeRecipient = escapeHtml(recipientName);
  const safeSender = escapeHtml(senderName);
  const safeMessage = escapeHtml(message);
  const safeGift = escapeHtml(giftName);
  const safeCompany = escapeHtml(companyName);
  const safeLink = escapeHtml(fullLink);
  const safeShopName = escapeHtml(shopName || giftName || companyName);
  const bannerImageUrl = shopBannerCid ? `cid:${shopBannerCid}` : presetBannerUrl(shopBannerPreset);
  const themeBg =
    shopBannerTheme === 'brand'
      ? '#15784C'
      : shopBannerTheme === 'dark'
        ? '#0E1E16'
        : shopBannerTheme === 'blue'
          ? '#2563C9'
          : shopBannerTheme === 'purple'
            ? '#7a3fb0'
            : '#F4F7F5';
  const themeText = shopBannerTheme === 'light' ? '#1A1A1A' : '#FFFFFF';
  const isPoints = campaignType === 'points';
  const isUniversalPoints = isPoints && pointsScope === 'stadium';
  const heroHeading = isPoints
    ? `You've been gifted reward points<br>to ${safeShopName}!`
    : `${safeCompany} is sending<br>you something special.`;
  const ctaLabel = isPoints ? 'Redeem your points →' : 'Claim your gift →';
  const scopeCopy = isPoints
    ? isUniversalPoints
      ? 'These points can be used in this shop or anywhere Shelf Merch points are accepted.'
      : `These points can only be redeemed in ${safeShopName}.`
    : '';
  const subject = isPoints
    ? `${senderName} sent you points to ${shopName || giftName}`
    : `${senderName} sent you a gift`;

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
            <td style="background:${themeBg};border-radius:10px 10px 0 0;padding:0;border:1px solid #E8E6E1;border-bottom:none;overflow:hidden;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${bannerImageUrl ? `
                <tr>
                  <td align="center" style="padding:0;">
                    <img
                      src="${escapeHtml(bannerImageUrl)}"
                      alt="${safeShopName} banner"
                      width="578"
                      style="display:block;width:100%;max-width:578px;height:auto;border:0;outline:none;text-decoration:none;"
                    >
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td align="center" style="padding:${bannerImageUrl ? '16px 24px 18px' : '22px 24px 18px'};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:${themeText};">
                    ${safeShopName}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:#ffffff;padding:24px 32px 0;border-left:1px solid #E8E6E1;border-right:1px solid #E8E6E1;">
              <div style="font-size:11px;font-weight:700;color:#9AA39C;letter-spacing:0.08em;text-transform:uppercase;text-align:center;">${safeSender.toUpperCase()} SENT YOU SOMETHING</div>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#1A1A1A;line-height:1.35;text-align:center;margin:10px 0 8px;">${heroHeading}</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:16px 32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;border-left:1px solid #E8E6E1;border-right:1px solid #E8E6E1;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #E8E6E1;border-radius:14px;">
                <tr>
                  <td style="padding:18px 18px 16px;">
                    ${!isPoints ? `
                      <div style="font-size:11px;font-weight:700;color:#9AA39C;letter-spacing:0.07em;text-transform:uppercase;text-align:center;margin-bottom:6px;">Your gift</div>
                      <div style="font-size:16px;font-weight:700;color:#1A1A1A;line-height:1.35;text-align:center;margin-bottom:10px;">${safeGift}</div>
                    ` : ''}
                    ${safeMessage ? `<div style="font-size:14px;color:#555;line-height:1.7;text-align:center;">${safeMessage}</div>` : ''}
                    ${scopeCopy ? `<div style="font-size:12px;color:#6C756F;line-height:1.6;text-align:center;margin-top:12px;">${scopeCopy}</div>` : ''}
                    <div style="height:3px;border-radius:3px;margin:16px 0 14px;background:linear-gradient(90deg,#7a3fb0,#2b54d6,#f5d000,#d33b30,#15784c);"></div>
                    <div style="font-size:12px;font-weight:700;color:#8A938D;letter-spacing:0.03em;text-transform:uppercase;text-align:center;">FROM ${safeSender.toUpperCase()}</div>
                  </td>
                </tr>
              </table>

              ${fullLink ? '' : `<div style="font-size:14px;color:#444;margin-top:20px;">${greeting}</div>`}

              <!-- CTA -->
              ${fullLink ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td align="center" style="border-radius:999px;background:#0E1E16;">
                  <a href="${safeLink}" target="_blank" style="display:block;padding:15px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">${ctaLabel}</a>
                </td></tr>
              </table>` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8F7F5;border-radius:0 0 10px 10px;padding:24px 32px;border:1px solid #E8E6E1;border-top:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
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
      ? `You've been gifted points to ${shopName || giftName}.`
      : `${companyName} is sending you something special.`,
    '',
    message ? `"${message}"` : '',
    message ? '' : null,
    scopeCopy || '',
    scopeCopy ? '' : null,
    `From: ${senderName}`,
    `Gift: ${giftName}`,
    '',
    fullLink ? `${ctaLabel.replace(' →', '')}: ${fullLink}` : '',
    '',
    '— Shelf Merch · Corporate Gifting Platform',
  ]
    .filter((line) => line !== null)
    .join('\n');

  return { subject, html, text };
}
