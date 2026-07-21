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
import { isCollectionLinkedToShop } from '../src/modules/collections/collectionQueries.js';
import { listingKey } from '../src/modules/shops/listingKeys.js';

let app;
let adminToken;
let tenant;

async function makeUser(tenantDoc) {
  const user = await User.create({
    tenantId: tenantDoc._id,
    name: 'Admin',
    email: `admin-${Date.now()}@test.io`,
    status: 'active',
  });
  const assignment = await RoleAssignment.create({
    tenantId: tenantDoc._id,
    userId: user._id,
    role: 'company_admin',
    scopeType: 'tenant',
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
  tenant = await Tenant.create({ name: 'Acme', slug: 'acme' });
  adminToken = await makeUser(tenant);
});

describe('shop catalog visibility sync', () => {
  it('publishing a collection activates all listings on the storefront', async () => {
    const sweatshirt = await CatalogProduct.create({
      sku: 'SM-SW-1',
      name: 'Crew Neck Sweatshirt',
      category: 'Apparel',
      group: 'tee',
      basePriceInr: 1260,
    });
    const shop = await Shop.create({
      tenantId: tenant._id,
      name: 'INR Shop',
      status: 'live',
    });
    const collection = await Collection.create({
      tenantId: tenant._id,
      code: 'C100',
      name: 'Microsoft Swag',
      status: 'ready',
      artworkUrl: '/uploads/test/logo.png',
      productRefs: [{
        catalogProductId: sweatshirt._id,
        brand: 'Shelf Merch',
        name: 'Crew Neck Sweatshirt',
        group: 'tee',
        mockupUrl: '/uploads/test/sweatshirt.png',
      }],
    });

    const publish = await request(app)
      .post(`/api/v1/collections/${collection._id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ shopId: String(shop._id) });
    expect(publish.status).toBe(200);

    const linked = await Collection.findOne({ _id: collection._id, tenantId: tenant._id });
    expect(isCollectionLinkedToShop(linked, shop._id)).toBe(true);

    const key = listingKey(collection._id, sweatshirt._id);
    const shopRecord = await Shop.findOne({ _id: shop._id, tenantId: tenant._id });
    expect(shopRecord.activeListingKeys).toContain(key);

    const storefront = await request(app).get(`/api/v1/storefront/${shop._id}`);
    expect(storefront.status).toBe(200);
    expect(storefront.body.products).toHaveLength(1);
    expect(storefront.body.products[0]._id).toBe(key);
  });

  it('deactivating a listing hides it from storefront without unlinking the collection', async () => {
    const bottle = await CatalogProduct.create({
      sku: 'SM-BTL-1',
      name: 'Temperature Display Bottle',
      category: 'Drinkware',
      group: 'bottle',
      basePriceInr: 500,
    });
    const shop = await Shop.create({
      tenantId: tenant._id,
      name: 'Points Shop',
      status: 'live',
    });
    const collection = await Collection.create({
      tenantId: tenant._id,
      shopId: shop._id,
      shopIds: [shop._id],
      code: 'C200',
      name: 'Drinkware',
      status: 'ready',
      productRefs: [{ catalogProductId: bottle._id, name: 'Temperature Display Bottle', group: 'bottle' }],
    });
    const key = listingKey(collection._id, bottle._id);
    shop.activeListingKeys = [key];
    await shop.save();

    const patch = await request(app)
      .patch(`/api/v1/shops/${shop._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ activeListingKeys: [] });
    expect(patch.status).toBe(200);
    expect(patch.body.activeListingKeys).toEqual([]);

    const stillLinked = await Collection.findOne({ _id: collection._id, tenantId: tenant._id });
    expect(isCollectionLinkedToShop(stillLinked, shop._id)).toBe(true);

    const storefront = await request(app).get(`/api/v1/storefront/${shop._id}`);
    expect(storefront.body.products).toHaveLength(0);
  });

  it('unpublishing a collection removes its listings from the storefront', async () => {
    const mug = await CatalogProduct.create({
      sku: 'SM-MUG-1',
      name: 'Classic Mug',
      category: 'Drinkware',
      group: 'mug',
      basePriceInr: 300,
    });
    const shop = await Shop.create({
      tenantId: tenant._id,
      name: 'Gift Shop',
      status: 'live',
    });
    const collection = await Collection.create({
      tenantId: tenant._id,
      shopId: shop._id,
      shopIds: [shop._id],
      code: 'C300',
      name: 'Welcome Kit',
      status: 'ready',
      productRefs: [{ catalogProductId: mug._id, name: 'Classic Mug', group: 'mug' }],
    });
    const key = listingKey(collection._id, mug._id);
    shop.activeListingKeys = [key];
    await shop.save();

    const unpublish = await request(app)
      .post(`/api/v1/collections/${collection._id}/unpublish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ shopId: String(shop._id) });
    expect(unpublish.status).toBe(200);

    const unlinked = await Collection.findOne({ _id: collection._id, tenantId: tenant._id });
    expect(isCollectionLinkedToShop(unlinked, shop._id)).toBe(false);

    const storefront = await request(app).get(`/api/v1/storefront/${shop._id}`);
    expect(storefront.body.products).toHaveLength(0);
  });
});
