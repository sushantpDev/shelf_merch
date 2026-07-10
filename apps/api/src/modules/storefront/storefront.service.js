import { Shop } from '../shops/shop.model.js';
import { Campaign } from '../campaigns/campaign.model.js';
import { Recipient } from '../campaigns/recipient.model.js';
import { getShopBySlug } from '../shops/shops.service.js';
import { ApiError, NotFoundError } from '../../utils/errors.js';
import { buildBrandedProductListings } from './brandedShopProducts.js';

const POOLED_REDEMPTION_STATUSES = ['opened', 'verified'];

/**
 * Public, no-auth storefront for a live shop. Listings require both a Branded
 * Swag design and an enabled Shop Catalog selection.
 */
export async function getStorefront(shopId) {
  const shop = await Shop.findById(shopId).setOptions({ skipTenantGuard: true });
  if (!shop || shop.status !== 'live') throw new NotFoundError('Shop not found');

  const products = await buildBrandedProductListings(shop);

  return {
    shop: shopPublicPayload(shop),
    products,
  };
}

function shopPublicPayload(shop) {
  return {
    id: String(shop._id),
    slug: shop.slug || '',
    name: shop.name,
    logoUrl: shop.logoUrl || '',
    bannerTheme: shop.bannerConfig?.theme || 'light',
    bannerPreset: shop.bannerConfig?.preset || '',
    currencyMode: shop.currencyMode,
    featuredCatalogProductIds: (shop.featuredCatalogProductIds || []).map(String),
  };
}

/** Public shop lookup by vanity slug (salesforce → salesforce.store). */
export async function getStorefrontBySlug(slug) {
  const shop = await getShopBySlug(slug);
  return { shop: shopPublicPayload(shop) };
}

/**
 * Resolve an employee's redemption link from their work email + shop slug.
 * Picks the most recent open points credit for this shop.
 */
export async function resolveShopRedemption({ slug, email }) {
  const normalized = String(email ?? '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new ApiError(400, 'Enter a valid work email', 'INVALID_EMAIL');
  }

  const shop = await getShopBySlug(slug);
  const campaigns = await Campaign.find({
    tenantId: shop.tenantId,
    shopId: shop._id,
    type: 'points',
    status: { $in: ['launched', 'redemption_open'] },
  })
    .select('_id')
    .setOptions({ skipTenantGuard: true });

  if (!campaigns.length) {
    throw new ApiError(404, 'No active rewards for this shop', 'NO_ACTIVE_REWARDS');
  }

  const recipients = await Recipient.find({
    tenantId: shop.tenantId,
    campaignId: { $in: campaigns.map((c) => c._id) },
    email: normalized,
    creditAmount: { $gt: 0 },
    redemptionStatus: { $in: POOLED_REDEMPTION_STATUSES },
  })
    .sort({ updatedAt: -1, invitedAt: -1 })
    .setOptions({ skipTenantGuard: true });

  if (!recipients.length) {
    const pending = await Recipient.findOne({
      tenantId: shop.tenantId,
      campaignId: { $in: campaigns.map((c) => c._id) },
      email: normalized,
      creditAmount: { $gt: 0 },
      redemptionStatus: 'invited',
    })
      .sort({ invitedAt: -1 })
      .setOptions({ skipTenantGuard: true });

    if (pending) {
      return {
        shop: shopPublicPayload(shop),
        recipient: { name: pending.name, token: pending.redemptionToken },
      };
    }

    throw new ApiError(
      404,
      'No rewards found for this email. Check the address or contact your admin.',
      'RECIPIENT_NOT_FOUND',
    );
  }

  const recipient = recipients[0];
  return {
    shop: shopPublicPayload(shop),
    recipient: { name: recipient.name, token: recipient.redemptionToken },
  };
}
