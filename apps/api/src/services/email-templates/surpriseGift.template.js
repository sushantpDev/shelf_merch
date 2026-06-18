import { env } from '../../config/env.js';

function appUrl(path = '') {
  const base = env.APP_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildSurpriseGiftEmail({
  recipientName = '',
  senderName = 'Your team',
  message = '',
  giftName = 'Your gift',
  companyName = 'your company',
}) {
  const safeRecipient = escapeHtml(recipientName);
  const safeSender = escapeHtml(senderName);
  const safeMessage = escapeHtml(message);
  const safeGift = escapeHtml(giftName);
  const safeCompany = escapeHtml(companyName);
  const subject = `You've received a gift from ${companyName}!`;
  const greeting = safeRecipient ? `Hi ${safeRecipient},` : 'Hi there,';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#EDECEA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EDECEA;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;">
        <tr><td style="background:#1B4332;border-radius:10px 10px 0 0;padding:22px 32px;color:#fff;font-size:16px;font-weight:700;">Shelf Merch</td></tr>
        <tr><td style="background:#1B4332;padding:12px 32px 40px;color:#fff;">
          <div style="height:1px;background:rgba(255,255,255,.12);margin-bottom:32px;"></div>
          <div style="font-size:11px;font-weight:600;color:#6EE7A0;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px;">A gift is on the way</div>
          <div style="font-size:28px;font-weight:700;line-height:1.25;margin-bottom:12px;">${safeCompany} is sending<br>you a surprise gift.</div>
          <div style="font-size:14px;color:rgba(255,255,255,.68);line-height:1.65;">We&rsquo;ll ship it to your address on file. You don&rsquo;t need to do anything.</div>
        </td></tr>
        <tr><td style="background:#fff;padding:36px 32px;color:#444;">
          <div style="font-size:14px;margin-bottom:22px;">${greeting}</div>
          <div style="font-size:14px;font-weight:600;color:#1A1A1A;">${safeSender}</div>
          <div style="font-size:12px;color:#999;margin:3px 0 22px;">Sending via Shelf Merch · Corporate Gifting</div>
          ${safeMessage ? `<div style="font-size:14px;color:#555;line-height:1.65;font-style:italic;padding:16px;background:#F8F7F5;border-left:3px solid #1B4332;border-radius:0 6px 6px 0;margin-bottom:26px;">&ldquo;${safeMessage}&rdquo;</div>` : ''}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E8E6E1;border-radius:10px;">
            <tr><td style="padding:20px;">
              <div style="font-size:11px;font-weight:600;color:#999;letter-spacing:.07em;text-transform:uppercase;margin-bottom:5px;">Your gift</div>
              <div style="font-size:16px;font-weight:700;color:#1A1A1A;margin-bottom:5px;">${safeGift}</div>
              <div style="font-size:12px;color:#777;">It will be shipped automatically to your saved address.</div>
              <div style="display:inline-block;margin-top:14px;background:#F0FDF4;color:#166534;font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;border:1px solid #BBF7D0;">On the way</div>
            </td></tr>
          </table>
          <div style="margin-top:24px;padding:14px 16px;background:#F0F7F3;border-radius:8px;color:#1B4332;font-size:13px;line-height:1.55;"><b>No action is required from you.</b> Just sit back and enjoy the surprise.</div>
        </td></tr>
        <tr><td style="background:#F8F7F5;border-radius:0 0 10px 10px;padding:24px 32px;border-top:1px solid #E8E6E1;color:#999;font-size:11px;line-height:1.65;">
          Shelf Merch · Corporate Gifting Platform<br>
          This gift was sent by your employer through Shelf Merch.<br><br>
          <a href="${escapeHtml(appUrl('/privacy'))}" style="color:#777;text-decoration:none;">Privacy Policy</a>
          &nbsp;·&nbsp;
          <a href="${escapeHtml(appUrl('/help'))}" style="color:#777;text-decoration:none;">Help Center</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    greeting,
    '',
    `${companyName} is sending you a surprise gift.`,
    `${giftName} will be shipped automatically to your address on file.`,
    'No action is required from you.',
    message ? `\n"${message}"` : '',
    `\nFrom: ${senderName}`,
    '\n— Shelf Merch · Corporate Gifting Platform',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, html, text };
}
