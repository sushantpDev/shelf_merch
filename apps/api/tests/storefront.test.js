import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { Shop } from '../src/modules/shops/shop.model.js';
import { Collection } from '../src/modules/collections/collection.model.js';
import { CatalogProduct } from '../src/modules/catalog/catalogProduct.model.js';

let app;
let tenant;
let curated;
let offShelf;

beforeAll(async () => {
  await connectTestDb();
  app = createApp();
});
afterAll(disconnectTestDb);

beforeEach(async () => {
  await clearTestDb();
  tenant = await Tenant.create({ name: 'Uber', slug: 'uber' });
  curated = await CatalogProduct.create({
    sku: 'SM-TEE-1', name: 'Welcome Tee', category: 'Apparel', group: 'tee', basePriceInr: 800,
  });
  offShelf = await CatalogProduct.create({
    sku: 'SM-MUG-1', name: 'Uncurated Mug', category: 'Drinkware', group: 'mug', basePriceInr: 300,
  });
});

describe('public storefront (no auth)', () => {
  it('returns live shop branding and only its curated collection products', async () => {
    const shop = await Shop.create({
      tenantId: tenant._id, name: 'Uber Store', status: 'live',
      logoUrl: 'https://cdn.test/uber.png', bannerConfig: { theme: 'brand' },
    });
    await Collection.create({
      tenantId: tenant._id, shopId: shop._id, code: 'C1', name: 'Picks', status: 'ready',
      productRefs: [{ catalogProductId: curated._id, brand: 'Uber', name: 'Welcome Tee', group: 'tee' }],
    });

    const res = await request(app).get(`/api/v1/storefront/${shop._id}`);
    expect(res.status).toBe(200);
    expect(res.body.shop).toMatchObject({
      name: 'Uber Store', logoUrl: 'https://cdn.test/uber.png', bannerTheme: 'brand', currencyMode: 'points',
    });
    const ids = res.body.products.map((p) => p._id);
    expect(ids).toContain(String(curated._id));
    expect(ids).not.toContain(String(offShelf._id));
    expect(res.body.products).toHaveLength(1);
  });

  it('falls back to the full active catalog when the shop has no collections', async () => {
    const shop = await Shop.create({ tenantId: tenant._id, name: 'Empty Store', status: 'live' });
    const res = await request(app).get(`/api/v1/storefront/${shop._id}`);
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(2);
  });

  it('returns the base/mask master images and variant colorHex for recolouring', async () => {
    curated.baseImageUrl = '/uploads/platform/product/base.png';
    curated.maskImageUrl = '/uploads/platform/product/mask.png';
    curated.variants = [{ color: 'Navy', colorHex: '#1e3a8a', size: 'M', sku: 'TEE-NVY-M' }];
    await curated.save();

    const shop = await Shop.create({ tenantId: tenant._id, name: 'Img Store', status: 'live' });
    const res = await request(app).get(`/api/v1/storefront/${shop._id}`);
    expect(res.status).toBe(200);
    const tee = res.body.products.find((p) => p._id === String(curated._id));
    expect(tee.baseImageUrl).toBe('/uploads/platform/product/base.png');
    expect(tee.maskImageUrl).toBe('/uploads/platform/product/mask.png');
    expect(tee.variants[0]).toMatchObject({ color: 'Navy', colorHex: '#1e3a8a' });
  });

  it('returns printAreas and collection artworkUrl on curated products', async () => {
    curated.printAreas = [{
      key: 'chest',
      label: 'Chest',
      mockupImageUrl: '/uploads/platform/product/mask.png',
      box: { xPct: 30, yPct: 25, widthPct: 40, heightPct: 35 },
    }];
    await curated.save();

    const shop = await Shop.create({ tenantId: tenant._id, name: 'Mockup Store', status: 'live' });
    await Collection.create({
      tenantId: tenant._id,
      shopId: shop._id,
      code: 'C2',
      name: 'Branded',
      status: 'ready',
      artworkUrl: '/uploads/tenant/artwork/logo.png',
      productRefs: [{ catalogProductId: curated._id, brand: 'Uber', name: 'Welcome Tee', group: 'tee' }],
    });

    const res = await request(app).get(`/api/v1/storefront/${shop._id}`);
    expect(res.status).toBe(200);
    const tee = res.body.products.find((p) => p._id === String(curated._id));
    expect(tee.artworkUrl).toBe('/uploads/tenant/artwork/logo.png');
    expect(tee.printAreas).toHaveLength(1);
    expect(tee.printAreas[0].box).toMatchObject({ xPct: 30, yPct: 25, widthPct: 40, heightPct: 35 });
  });

  it('returns collection preferredColors on curated products', async () => {
    const shop = await Shop.create({ tenantId: tenant._id, name: 'Color Store', status: 'live' });
    await Collection.create({
      tenantId: tenant._id,
      shopId: shop._id,
      code: 'C3',
      name: 'Swag',
      status: 'ready',
      preferredColors: ['Black', 'White'],
      productRefs: [{ catalogProductId: curated._id, brand: 'Uber', name: 'Welcome Tee', group: 'tee' }],
    });

    const res = await request(app).get(`/api/v1/storefront/${shop._id}`);
    expect(res.status).toBe(200);
    const tee = res.body.products.find((p) => p._id === String(curated._id));
    expect(tee.preferredColors).toEqual(['Black', 'White']);
  });

  it('404s a draft shop so it stays private', async () => {
    const shop = await Shop.create({ tenantId: tenant._id, name: 'Draft Store', status: 'draft' });
    const res = await request(app).get(`/api/v1/storefront/${shop._id}`);
    expect(res.status).toBe(404);
  });

  it('404s an unknown shop id', async () => {
    const res = await request(app).get(`/api/v1/storefront/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });

  it('400s a malformed shop id', async () => {
    const res = await request(app).get('/api/v1/storefront/not-an-objectid');
    expect(res.status).toBe(400);
  });
});
