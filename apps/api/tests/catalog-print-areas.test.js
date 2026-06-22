import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
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
let supportToken;
let product;

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

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterAll(disconnectTestDb);

beforeEach(async () => {
  await clearTestDb();
  catalogToken = await makeUser(null, 'platform_catalog_admin', 'platform');
  const tenant = await Tenant.create({ name: 'Rubix', slug: 'rubix' });
  supportToken = await makeUser(tenant, 'company_admin', 'tenant');
  product = await CatalogProduct.create({
    sku: `SM-TEE-${Date.now()}`,
    name: 'Core Cotton Tee',
    category: 'Apparel',
    basePriceInr: 499,
  });
});

const area = (over = {}) => ({
  key: 'front',
  label: 'Front',
  mockupImageUrl: '/uploads/platform/product/abc.png',
  box: { xPct: 25, yPct: 30, widthPct: 50, heightPct: 40 },
  maxWidthCm: 28,
  maxHeightCm: 35,
  dpi: 300,
  methods: ['dtf', 'screen_print'],
  ...over,
});

describe('platform product print areas (POD placeholders)', () => {
  it('saves print-area geometry and derives printableAreas from labels', async () => {
    const res = await request(app)
      .put(`/api/v1/platform/products/${product._id}/print-areas`)
      .set('Authorization', `Bearer ${catalogToken}`)
      .send({ printAreas: [area(), area({ key: 'back', label: 'Back' })] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].box.widthPct).toBe(50);

    const reloaded = await CatalogProduct.findById(product._id);
    expect(reloaded.printAreas).toHaveLength(2);
    expect(reloaded.printableAreas).toEqual(['Front', 'Back']);
  });

  it('rejects out-of-range box percentages (400 validation)', async () => {
    const res = await request(app)
      .put(`/api/v1/platform/products/${product._id}/print-areas`)
      .set('Authorization', `Bearer ${catalogToken}`)
      .send({ printAreas: [area({ box: { xPct: 10, yPct: 10, widthPct: 150, heightPct: 40 } })] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('forbids a tenant role from writing print areas (403)', async () => {
    const res = await request(app)
      .put(`/api/v1/platform/products/${product._id}/print-areas`)
      .set('Authorization', `Bearer ${supportToken}`)
      .send({ printAreas: [area()] });
    expect(res.status).toBe(403);
  });
});

describe('product variant colorHex + master image roles', () => {
  it('persists colorHex when adding a variant', async () => {
    const res = await request(app)
      .post(`/api/v1/platform/products/${product._id}/variants`)
      .set('Authorization', `Bearer ${catalogToken}`)
      .send({ sku: 'TEE-NVY-M', color: 'Navy', colorHex: '#1e3a8a', size: 'M' });
    expect(res.status).toBe(201);
    const reloaded = await CatalogProduct.findById(product._id);
    expect(reloaded.variants[0]).toMatchObject({ color: 'Navy', colorHex: '#1e3a8a' });
  });

  it('setRoleImage stores base and mask master images separately', async () => {
    const { setRoleImage } = await import('../src/modules/catalog/platformCatalog.service.js');
    await setRoleImage(product._id, 'base', '/uploads/platform/product/base.png');
    await setRoleImage(product._id, 'mask', '/uploads/platform/product/mask.png');
    const reloaded = await CatalogProduct.findById(product._id);
    expect(reloaded.baseImageUrl).toBe('/uploads/platform/product/base.png');
    expect(reloaded.maskImageUrl).toBe('/uploads/platform/product/mask.png');
  });

  it('keeps a legacy Shopify photo as marketing when a production mask is uploaded', async () => {
    product.source = {
      provider: 'shopify',
      domain: 'example.myshopify.com',
      externalId: '123',
    };
    product.maskImageUrl = 'https://cdn.shopify.com/legacy-product.jpg';
    await product.save();

    const { setRoleImage } = await import('../src/modules/catalog/platformCatalog.service.js');
    await setRoleImage(product._id, 'mask', '/uploads/platform/product/production-mask.png');

    const reloaded = await CatalogProduct.findById(product._id);
    expect(reloaded.primaryImageUrl).toBe('https://cdn.shopify.com/legacy-product.jpg');
    expect(reloaded.imageUrls).toEqual(['https://cdn.shopify.com/legacy-product.jpg']);
    expect(reloaded.maskImageUrl).toBe('/uploads/platform/product/production-mask.png');
  });
});
