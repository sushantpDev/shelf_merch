import { Notification } from './notification.model.js';
import { getNotificationQueue } from '../../jobs/queues.js';
import { ensureRedisReady } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { sendSms } from '../../services/msg91.service.js';
import {
  sendNotificationEmail,
  sendRedemptionInviteEmail,
  sendSurpriseGiftEmail,
} from '../../services/email.service.js';

/**
 * §7.12 — delivery handler used by the notification worker.
 * In-app: writes a Notification doc. Email: SMTP when credentials are set.
 * SMS: MSG91 when credentials are set; otherwise structured logs (tests/dev).
 */

export async function deliverNotification({
  type,
  tenantId = null,
  userId = null,
  email = null,
  phone = null,
  title,
  body = '',
  link = '',
  meta = null,
}) {
  if (userId) {
    await Notification.create({ tenantId, userId, type, title, body, link });
  }
  if (email) {
    if (type === 'surprise_gift' && meta) {
      await sendSurpriseGiftEmail({
        to: email,
        recipientName: meta.recipientName ?? '',
        senderName: meta.senderName ?? title,
        message: meta.message ?? body,
        giftName: meta.giftName ?? 'Your gift',
        companyName: meta.companyName ?? 'your company',
      });
    } else if (type === 'redemption_invite' && meta) {
      await sendRedemptionInviteEmail({
        to: email,
        recipientName: meta.recipientName ?? '',
        senderName: meta.senderName ?? title,
        message: meta.message ?? body,
        giftName: meta.giftName ?? 'Your gift',
        companyName: meta.companyName ?? 'your company',
        link,
        campaignType: meta.campaignType ?? 'kit',
        pointsScope: meta.pointsScope ?? 'shop',
        shopName: meta.shopName ?? '',
        shopLogoUrl: meta.shopLogoUrl ?? '',
        shopBannerTheme: meta.shopBannerTheme ?? '',
        shopBannerPreset: meta.shopBannerPreset ?? '',
        shopCurrencyMode: meta.shopCurrencyMode ?? 'points',
      });
    } else {
      await sendNotificationEmail({ to: email, title, body, link });
    }
  }
  if (phone) {
    const message = [title, body, link].filter(Boolean).join(' — ');
    await sendSms(phone, message);
  }
}

/**
 * Enqueue notification delivery via BullMQ when Redis is up.
 * Never block the HTTP request on SMTP/SMS — that was making campaign launch
 * (send points) feel hung while emails sent one-by-one in-process.
 * Falls back to async inline delivery when Redis/worker is unavailable;
 * tests still await delivery so assertions stay deterministic.
 */
export async function notify(payload) {
  const deliver = () =>
    deliverNotification(payload).catch((err) =>
      logger.error({ err }, 'Direct notification delivery failed'),
    );

  try {
    if (!(await ensureRedisReady())) throw new Error('Redis not ready');
    await getNotificationQueue().add(payload.type, payload, {
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  } catch {
    if (env.NODE_ENV === 'test') {
      await deliver();
      return;
    }
    setImmediate(deliver);
  }
}
