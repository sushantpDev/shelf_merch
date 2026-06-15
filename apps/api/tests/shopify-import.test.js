import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { CatalogProduct } from '../src/modules/catalog/catalogProduct.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';

let app;
let catalogToken;
let tenantToken;

async function makeUser(tenantDoc, role, scopeType) {
  const user = await User.create({
    tenantId: tenantDoc?._id ?? null,
    name: `${role} user`,
    email: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.io`,
    status: 'active',
  });
  const assignment = await RoleAssignment.create({
    tenantId: tenantDoc?._id ?? null,
    userId: user._id,
    role,
    scopeType,
  });
  return signAccessToken(user, assignment);
}

const SHOPIFY_PAYLOAD = {
  products: [
    {
      id: 111,
      title: 'Classic Tee',
      handle: 'classic-tee',
      vendor: 'Acme',
      product_type: 'Apparel',
      body_html: '<p>Soft <b>cotton</b> tee</p>',
      options: [{ name: 'Color' }, { name: 'Size' }],
      image: { src: 'https://cdn.shopify.com/tee.jpg' },
      images: [{ src: 'https://cdn.shopify.com/tee.jpg' }],
      variants: [
        { sku: 'TEE-BLK-M', price: '499.00', inventory_quantity: 10, option1: 'Black', option2: 'M' },
        { sku: 'TEE-BLK-L', price: '549.00', inventory_quantity: 5, option1: 'Black', option2: 'L' },
      ],
    },
    {
      id: 222,
      title: 'Steel Bottle',
      handle: 'steel-bottle',
      vendor: 'Acme',
      product_type: 'Drinkware',
      body_html: 'Insulated bottle',
      options: [{ name: 'Title' }],
      images: [],
      variants: [{ sku: 'BTL-750', price: '689', inventory_quantity: 20, option1: 'Default' }],
    },
  ],
};

function stubFetch(status, payload, linkHeader = null) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
    headers: { get: (h) => (h.toLowerCase() === 'link' ? linkHeader : null) },
  });
}

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterAll(disconnectTestDb);
afterEach(() => vi.restoreAllMocks());

beforeEach(async () => {
  await clearTestDb();
  catalogToken = await makeUser(null, 'platform_catalog_admin', 'platform');
  const tenant = await Tenant.create({ name: 'Rubix', slug: 'rubix' });
  tenantToken = await makeUser(tenant, 'company_admin', 'tenant');
});

const importReq = (token) =>
  request(app)
    .post('/api/v1/platform/products/import/shopify')
    .set('Authorization', `Bearer ${token}`)
    .send({ domain: 'xyz.myshopify.com', accessToken: 'shpat_test' });

describe('Shopify catalog import', () => {
  it('imports products as drafts with mapped fields and source id', async () => {
    vi.stubGlobal('fetch', stubFetch(200, SHOPIFY_PAYLOAD));
    const res = await importReq(catalogToken);
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(2);
    expect(res.body.skipped).toBe(0);

    const tee = await CatalogProduct.findOne({ 'source.externalId': '111' });
    expect(tee.status).toBe('draft');
    expect(tee.brand).toBe('Acme');
    expect(tee.category).toBe('Apparel');
    expect(tee.basePriceInr).toBe(499); // min variant price
    expect(tee.variants).toHaveLength(2);
    expect(tee.variants[0]).toMatchObject({ color: 'Black', size: 'M', sku: 'TEE-BLK-M' });
    expect(tee.imageUrls).toContain('https://cdn.shopify.com/tee.jpg');
    expect(tee.source.provider).toBe('shopify');
    // Imported products are made-to-order so they don't read as "out of stock".
    expect(tee.inventory.mode).toBe('made_to_order');
  });

  it('skips products already imported on re-import (idempotent)', async () => {
    vi.stubGlobal('fetch', stubFetch(200, SHOPIFY_PAYLOAD));
    await importReq(catalogToken);
    vi.stubGlobal('fetch', stubFetch(200, SHOPIFY_PAYLOAD));
    const res = await importReq(catalogToken);
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(0);
    expect(res.body.skipped).toBe(2);
    expect(await CatalogProduct.countDocuments({ 'source.provider': 'shopify' })).toBe(2);
  });

  it('returns a friendly error for an invalid token (401 from Shopify)', async () => {
    vi.stubGlobal('fetch', stubFetch(401, {}));
    const res = await importReq(catalogToken);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('SHOPIFY_UNAUTHORIZED');
  });

  it('forbids a tenant role from importing (403)', async () => {
    vi.stubGlobal('fetch', stubFetch(200, SHOPIFY_PAYLOAD));
    const res = await importReq(tenantToken);
    expect(res.status).toBe(403);
  });
});
