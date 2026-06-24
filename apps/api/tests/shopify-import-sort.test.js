import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { importFromShopify } from '../src/modules/catalog/shopifyImport.service.js';
import { CatalogProduct } from '../src/modules/catalog/catalogProduct.model.js';
import { PlatformKit } from '../src/modules/kits/platformKit.model.js';

const KIT = { id: 111, title: 'Welcome Aboard Employee Kit', handle: 'welcome-kit', product_type: 'Kit', vendor: 'Acme', variants: [{ price: '1200', sku: 'KIT-1' }], images: [], options: [] };
const TEE = { id: 222, title: 'Cotton Tee', handle: 'cotton-tee', product_type: 'Apparel', vendor: 'Acme', variants: [{ price: '499', sku: 'TEE-1' }], images: [], options: [] };

function fakeRes(bodyObj, text = '') {
  return { ok: true, status: 200, json: async () => bodyObj, text: async () => text, headers: { get: () => null } };
}

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

beforeEach(async () => {
  await clearTestDb();
  global.fetch = vi.fn(async (url) => {
    const u = String(url);
    if (u.includes('/products.json')) return fakeRes({ products: [KIT, TEE] });
    if (u.includes('/metafields')) return fakeRes({ metafields: [] });
    return fakeRes({}, '');
  });
});

describe('Shopify import sorts kits from catalog products', () => {
  it("only: 'kits' imports only the bundle into PlatformKit", async () => {
    const summary = await importFromShopify({ domain: 'demo.myshopify.com', token: 't', only: 'kits' });
    expect(await PlatformKit.countDocuments()).toBe(1);
    expect(await CatalogProduct.countDocuments()).toBe(0);
    expect(summary.kits.imported).toBe(1);
    const kit = await PlatformKit.findOne({});
    expect(kit.name).toBe('Welcome Aboard Employee Kit');
    expect(kit.status).toBe('active');
    expect(kit.source.provider).toBe('shopify');
  });

  it("only: 'products' imports only the single product into the catalog", async () => {
    const summary = await importFromShopify({ domain: 'demo.myshopify.com', token: 't', only: 'products' });
    expect(await CatalogProduct.countDocuments()).toBe(1);
    expect(await PlatformKit.countDocuments()).toBe(0);
    expect(summary.products.imported).toBe(1);
    const product = await CatalogProduct.findOne({});
    expect(product.name).toBe('Cotton Tee');
  });
});
