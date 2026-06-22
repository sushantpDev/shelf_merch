import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { CatalogProduct } from '../src/modules/catalog/catalogProduct.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';
import {
  mapShopifyContent,
  parseShopifyStorefrontTabs,
} from '../src/modules/catalog/shopifyImport.service.js';

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
  it('separates metafield description/features from the body_html size guide', () => {
    const content = mapShopifyContent(
      '<table><tr><td>Feature</td><td>Details</td></tr><tr><td>Material</td><td>Cork</td></tr></table>',
      [
        {
          namespace: 'custom',
          key: 'product_description',
          type: 'multi_line_text_field',
          value: 'A natural cork trophy for recognition awards.',
        },
        { namespace: 'custom', key: 'features', type: 'single_line_text_field', value: 'Angular design' },
        { namespace: 'custom', key: 'material', type: 'single_line_text_field', value: 'Cork' },
        {
          namespace: 'custom',
          key: 'file_guidelines',
          type: 'multi_line_text_field',
          value: 'Do not import this text',
        },
      ],
    );

    expect(content.description).toBe('A natural cork trophy for recognition awards.');
    expect(content.keyFeatures).toContain('Features: Angular design');
    expect(content.keyFeatures).toContain('Material: Cork');
    expect(content.sizeGuide).toContain('Feature: Details');
    expect(JSON.stringify(content)).not.toContain('Do not import this text');
  });

  it('parses the rendered Shopify Description, Key features, and Size Guide tabs', () => {
    const tabs = parseShopifyStorefrontTabs(`
      <div data-tab-title="Description">
        <style>.noise { color: red; }</style>
        <span class="metafield-multi_line_text_field">Actual product description<br>Second line</span>
        <div>Read more</div>
      </div>
      <div data-tab-title="Key features">
        <ul>
          <li><p>Features</p><p>x x x</p></li>
          <li><p>Material</p><p>Cork</p></li>
          <li><p>Brand</p><p>9Cork</p></li>
        </ul>
      </div>
      <div data-tab-title="Size Guide">
        <table><tr><td>Feature</td><td>Details</td></tr></table>
      </div>
      <div data-tab-title="File Guidelines">Do not import this</div>
    `);

    expect(tabs.description).toBe('Actual product description\nSecond line');
    expect(tabs.keyFeatures).toBe('Material: Cork\nBrand: 9Cork');
    expect(tabs.sizeGuide).toBe('Feature: Details');
    expect(JSON.stringify(tabs)).not.toContain('Do not import this');
  });

  it('imports products as drafts with mapped fields and source id', async () => {
    vi.stubGlobal('fetch', stubFetch(200, SHOPIFY_PAYLOAD));
    const res = await importReq(catalogToken);
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(2);
    expect(res.body.updated).toBe(0);
    expect(res.body.skipped).toBe(0);

    const tee = await CatalogProduct.findOne({ 'source.externalId': '111' });
    expect(tee.status).toBe('draft');
    expect(tee.brand).toBe('Acme');
    expect(tee.category).toBe('Apparel');
    expect(tee.basePriceInr).toBe(499); // min variant price
    expect(tee.variants).toHaveLength(2);
    expect(tee.variants[0]).toMatchObject({ color: 'Black', size: 'M', sku: 'TEE-BLK-M' });
    expect(tee.primaryImageUrl).toBe('https://cdn.shopify.com/tee.jpg');
    expect(tee.imageUrls).toEqual(['https://cdn.shopify.com/tee.jpg']);
    expect(tee.maskImageUrl).toBe('');
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
