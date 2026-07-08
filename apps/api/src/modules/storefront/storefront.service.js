import { Shop } from '../shops/shop.model.js';
import { Collection } from '../collections/collection.model.js';
import { collectionsForShopFilter } from '../collections/collectionQueries.js';
import { CatalogProduct } from '../catalog/catalogProduct.model.js';
import { Campaign } from '../campaigns/campaign.model.js';
import { Recipient } from '../campaigns/recipient.model.js';
import { getShopBySlug } from '../shops/shops.service.js';
import { slugifyShopName } from '../../utils/shopSlug.js';
import { ApiError, NotFoundError } from '../../utils/errors.js';

const POOLED_REDEMPTION_STATUSES = ['opened', 'verified'];

const CATALOG_SELECT =
  'name brand group category description keyFeatures sizeGuide basePriceInr primaryImageUrl imageUrls maskImageUrl baseImageUrl variants printAreas';

function mapBrandedListing(col, ref, base) {
  const catalogProductId = String(ref.catalogProductId);
  const collectionId = String(col._id);
  return {
    ...base,
    _id: `${collectionId}:${catalogProductId}`,
    catalogProductId,
    collectionId,
    name: ref.name || base.name,
    brand: ref.brand ?? base.brand,
    group: ref.group ?? base.group,
    artworkUrl: col.artworkUrl || '',
    mockupUrl: ref.mockupUrl || '',
    preferredColors: col.preferredColors || [],
  };
}

/**
 * Public, no-auth storefront for a live shop.
 *
 * Source of truth: the shop's enabled catalog (`selectedCatalogProductIds`).
 * Branded Swag collections provide optional artwork/mockup metadata, but are
 * not required for a product to appear.
 */
export async function getStorefront(shopId) {
  const shop = await Shop.findById(shopId).setOptions({ skipTenantGuard: true });
  if (!shop || shop.status !== 'live') throw new NotFoundError('Shop not found');

  const collections = await Collection.find({
    ...collectionsForShopFilter(shop._id),
    tenantId: shop.tenantId,
    status: { $ne: 'archived' },
  })
    .setOptions({ skipTenantGuard: true })
    .select('productRefs artworkUrl preferredColors')
    .lean();

  const artworkByProductId = new Map();
  const mockupByProductId = new Map();
  const preferredColorsByProductId = new Map();
  for (const col of collections) {
    for (const ref of col.productRefs || []) {
      const pid = ref.catalogProductId ? String(ref.catalogProductId) : '';
      if (!pid) continue;
      if (col.artworkUrl && !artworkByProductId.has(pid)) artworkByProductId.set(pid, col.artworkUrl);
      if (ref.mockupUrl && !mockupByProductId.has(pid)) mockupByProductId.set(pid, ref.mockupUrl);
      if (col.preferredColors?.length && !preferredColorsByProductId.has(pid)) {
        preferredColorsByProductId.set(pid, col.preferredColors);
      }
    }
  }

  const effectiveIds = [...new Set((shop.selectedCatalogProductIds || []).map(String).filter(Boolean))];
  if (!effectiveIds.length) {
    return {
      shop: shopPublicPayload(shop),
      products: [],
    };
  }

  const products = await CatalogProduct.find({
    status: 'active',
    _id: { $in: effectiveIds },
  })
    .setOptions({ skipTenantGuard: true })
    .select(CATALOG_SELECT)
    .lean()
    .then((rows) =>
      rows.map((p) => ({
        ...p,
        artworkUrl: artworkByProductId.get(String(p._id)) || '',
        mockupUrl: mockupByProductId.get(String(p._id)) || '',
        preferredColors: preferredColorsByProductId.get(String(p._id)) || [],
      })),
    );

  products.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  return {
    shop: {
      id: String(shop._id),
      slug: shop.slug || '',
      name: shop.name,
      logoUrl: shop.logoUrl || '',
      bannerTheme: shop.bannerConfig?.theme || 'light',
      bannerPreset: shop.bannerConfig?.preset || '',
      currencyMode: shop.currencyMode,
    },
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
