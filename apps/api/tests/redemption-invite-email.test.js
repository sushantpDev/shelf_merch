import { describe, it, expect } from 'vitest';
import { buildRedemptionInviteEmail } from '../src/services/email-templates/redemptionInvite.template.js';

describe('redemption invite email template', () => {
  it('renders branded kit invite with CTA and sender details', () => {
    const { subject, html, text } = buildRedemptionInviteEmail({
      recipientName: 'Priya Sharma',
      senderName: 'People Team, Rubix',
      message: "Your welcome kit is on its way! A little something from all of us — we're so glad you're here.",
      giftName: 'Welcome Kit',
      companyName: 'Rubix',
      link: '/redeem/test-token-abc',
      campaignType: 'kit',
    });

    expect(subject).toBe('People Team, Rubix sent you a gift');
    expect(html).toContain('Shelf Merch');
    expect(html).toContain('Claim your gift');
    expect(html).toContain('People Team, Rubix');
    expect(html).toContain('Welcome Kit');
    expect(html).toContain('Rubix is sending');
    expect(html).toContain('redeem/test-token-abc');
    expect(text).toContain('Priya Sharma');
    expect(text).toContain('Link expires in 30 days');
  });

  it('escapes user-supplied HTML in message body', () => {
    const { html } = buildRedemptionInviteEmail({
      senderName: 'Team',
      message: '<script>alert(1)</script>',
      giftName: 'Kit',
      companyName: 'Co',
      link: '/redeem/x',
      campaignType: 'kit',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
