import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { CatalogProduct } from '../src/modules/catalog/catalogProduct.model.js';
import { Collection } from '../src/modules/collections/collection.model.js';
import { Shop } from '../src/modules/shops/shop.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';

let app;
let adminToken;
let tenant;
let product;
let collection;

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
  tenant = await Tenant.create({ name: 'Rubix', slug: 'rubix' });
  adminToken = await makeUser(tenant, 'company_admin', 'tenant');
  product = await CatalogProduct.create({
    sku: `SM-TEE-${Date.now()}`,
    name: 'Core Cotton Tee',
    category: 'Apparel',
    basePriceInr: 499,
  });
  collection = await Collection.create({
    tenantId: tenant._id,
    code: 'C123456789',
    name: 'Employee Swag',
    status: 'ready',
    artworkUrl: '/uploads/test/art.png',
    productRefs: [{ catalogProductId: product._id, brand: 'Rubix', name: 'Core Cotton Tee', group: 'tee' }],
  });
});

describe('collections archive / restore / delete', () => {
  it('archives a collection', async () => {
    const res = await request(app)
      .post(`/api/v1/collections/${collection._id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('archived');
  });

  it('restores an archived collection to ready when artwork exists', async () => {
    collection.status = 'archived';
    await collection.save();
    const res = await request(app)
      .post(`/api/v1/collections/${collection._id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });

  it('soft-deletes a collection', async () => {
    const res = await request(app)
      .delete(`/api/v1/collections/${collection._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
    const found = await Collection.findOne({ _id: collection._id, tenantId: tenant._id });
    expect(found).toBeNull();
    const deleted = await Collection.findOne({ _id: collection._id, tenantId: tenant._id }).setOptions({ includeDeleted: true });
    expect(deleted?.deletedAt).toBeTruthy();
  });
});

describe('collection shop links', () => {
  it('links one collection to multiple shops without creating duplicates', async () => {
    const shopA = await Shop.create({ tenantId: tenant._id, name: 'Salesforce Shop', status: 'live' });
    const shopB = await Shop.create({ tenantId: tenant._id, name: 'Zeta Shop', status: 'live' });

    const linkA = await request(app)
      .patch(`/api/v1/collections/${collection._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ shopId: String(shopA._id) });
    expect(linkA.status).toBe(200);
    expect(linkA.body.shopIds.map(String)).toContain(String(shopA._id));

    const linkB = await request(app)
      .patch(`/api/v1/collections/${collection._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ shopId: String(shopB._id) });
    expect(linkB.status).toBe(200);
    expect(linkB.body.shopIds.map(String)).toEqual(
      expect.arrayContaining([String(shopA._id), String(shopB._id)]),
    );

    const count = await Collection.countDocuments({ tenantId: tenant._id, name: 'Employee Swag' });
    expect(count).toBe(1);

    const forA = await request(app)
      .get(`/api/v1/collections?shopId=${shopA._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const forB = await request(app)
      .get(`/api/v1/collections?shopId=${shopB._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(forA.body.some((c) => String(c._id) === String(collection._id))).toBe(true);
    expect(forB.body.some((c) => String(c._id) === String(collection._id))).toBe(true);

    const shopARecord = await Shop.findById(shopA._id);
    expect(shopARecord.selectedCatalogProductIds.map(String)).toContain(String(product._id));
    const shopBRecord = await Shop.findById(shopB._id);
    expect(shopBRecord.selectedCatalogProductIds.map(String)).toContain(String(product._id));
  });

  it('adds catalog products to the shop when creating a shop-linked collection', async () => {
    const shop = await Shop.create({ tenantId: tenant._id, name: 'New Shop', status: 'live' });
    const res = await request(app)
      .post('/api/v1/collections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        shopId: String(shop._id),
        name: 'Onboarding Swag',
        artworkUrl: '/uploads/test/art.png',
        isShopSpecific: true,
        productRefs: [{ catalogProductId: String(product._id), name: 'Core Cotton Tee', group: 'tee' }],
      });
    expect(res.status).toBe(201);
    const updated = await Shop.findById(shop._id);
    expect(updated.selectedCatalogProductIds.map(String)).toContain(String(product._id));
  });
});

describe('collection mockup uploads', () => {
  it('stores mockupUrl on product refs via multipart upload', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const res = await request(app)
      .post(`/api/v1/collections/${collection._id}/mockups`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('meta', JSON.stringify([{ catalogProductId: String(product._id) }]))
      .attach('mockups', png, { filename: 'mockup.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.productRefs[0].mockupUrl).toBeTruthy();

    const shop = await Shop.create({
      tenantId: tenant._id,
      name: 'Linked Shop',
      status: 'live',
      selectedCatalogProductIds: [product._id],
    });
    await Collection.updateOne(
      { _id: collection._id, tenantId: tenant._id },
      { $set: { shopId: shop._id, shopIds: [shop._id] } },
    );
    const storefront = await request(app).get(`/api/v1/storefront/${shop._id}`);
    expect(storefront.body.products[0].mockupUrl).toBe(res.body.productRefs[0].mockupUrl);
  });
});
