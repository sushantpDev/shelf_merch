import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { User } from '../src/modules/users/user.model.js';
import { RoleAssignment } from '../src/modules/roles/roleAssignment.model.js';
import { CatalogProduct } from '../src/modules/catalog/catalogProduct.model.js';
import { PlatformKit } from '../src/modules/kits/platformKit.model.js';
import { signAccessToken } from '../src/modules/auth/auth.service.js';

let app;
let catalogToken;
let tenantToken;
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
  tenantToken = await makeUser(tenant, 'company_admin', 'tenant');
  product = await CatalogProduct.create({
    sku: `SM-TEE-${Date.now()}`,
    name: 'Core Cotton Tee',
    category: 'Apparel',
    basePriceInr: 499,
    variants: [{ size: 'M', color: 'Black', sku: 'SM-TEE-BLK-M' }],
  });
});

const auth = (t) => ({ Authorization: `Bearer ${t}` });

describe('platform kit creation (predefined curated kits)', () => {
  it('creates a kit with rules, adds an item (product+variant+qty), and publishes', async () => {
    const created = await request(app)
      .post('/api/v1/platform/kits')
      .set(auth(catalogToken))
      .send({
        name: 'New Joiner Kit',
        packaging: 'premium_box',
        eligibleCampaignTypes: ['Employee onboarding'],
        approxValueInr: 1500,
        rules: { fixedComposition: true, customizationAllowed: false, minQtyPerRecipient: 1, maxQtyPerRecipient: 2 },
      });
    expect(created.status).toBe(201);
    const kitId = created.body._id;
    expect(created.body.rules.customizationAllowed).toBe(false);
    expect(created.body.rules.maxQtyPerRecipient).toBe(2);

    // Cannot publish an empty kit.
    const earlyPublish = await request(app)
      .post(`/api/v1/platform/kits/${kitId}/publish`)
      .set(auth(catalogToken));
    expect(earlyPublish.status).toBe(422);
    expect(earlyPublish.body.error.code).toBe('KIT_EMPTY');

    // Add an item.
    const addItem = await request(app)
      .post(`/api/v1/platform/kits/${kitId}/items`)
      .set(auth(catalogToken))
      .send({ catalogProductId: String(product._id), variantSku: 'SM-TEE-BLK-M', qty: 2 });
    expect(addItem.status).toBe(201);
    expect(addItem.body).toHaveLength(1);
    expect(addItem.body[0].variantSku).toBe('SM-TEE-BLK-M');

    // Now publish succeeds.
    const publish = await request(app)
      .post(`/api/v1/platform/kits/${kitId}/publish`)
      .set(auth(catalogToken));
    expect(publish.status).toBe(200);
    expect(publish.body.status).toBe('active');
  });

  it('publishes an imported (curated) kit without items', async () => {
    const kit = await PlatformKit.create({
      name: 'Welcome Aboard Employee Kit',
      approxValueInr: 1200,
      items: [],
      source: { provider: 'shopify', externalId: '99001', domain: 'demo.myshopify.com' },
    });
    const publish = await request(app)
      .post(`/api/v1/platform/kits/${kit._id}/publish`)
      .set(auth(catalogToken));
    expect(publish.status).toBe(200);
    expect(publish.body.status).toBe('active');
  });

  it('forbids a tenant role from creating a platform kit (403)', async () => {
    const res = await request(app)
      .post('/api/v1/platform/kits')
      .set(auth(tenantToken))
      .send({ name: 'Sneaky kit' });
    expect(res.status).toBe(403);
  });
});
