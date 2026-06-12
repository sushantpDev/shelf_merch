/**
 * Dev/demo seed — mirrors the frontend's mock data (apps/web/src/lib/shelf-merch.js).
 * NEVER run against production.
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDb, disconnectDb } from '../config/db.js';
import { logger } from '../config/logger.js';
import { Tenant } from '../modules/tenants/tenant.model.js';
import { User } from '../modules/users/user.model.js';
import { RoleAssignment } from '../modules/roles/roleAssignment.model.js';
import { RefreshToken } from '../modules/auth/refreshToken.model.js';
import { Wallet } from '../modules/wallets/wallet.model.js';
import { Entity } from '../modules/entities/entity.model.js';
import { AuditLog } from '../modules/auditLogs/auditLog.model.js';
import { CatalogProduct } from '../modules/catalog/catalogProduct.model.js';
import { Shop } from '../modules/shops/shop.model.js';
import { Collection } from '../modules/collections/collection.model.js';
import { Kit } from '../modules/kits/kit.model.js';
import { Contact } from '../modules/contacts/contact.model.js';
import { Campaign } from '../modules/campaigns/campaign.model.js';
import { Recipient } from '../modules/campaigns/recipient.model.js';
import { hashPassword } from '../modules/auth/auth.service.js';
import * as ledger from '../services/ledger.service.js';
import { transitionThrough } from '../services/stateMachine.service.js';
import * as campaignsService from '../modules/campaigns/campaigns.service.js';
import { CATALOG_PRODUCTS } from './catalogProducts.js';

export const DEMO_REDEMPTION_TOKEN = 'seedDemoRedemptionTokenRubix26!';

const DEPARTMENTS = [
  { name: 'Marketing', desc: 'Events, conferences, swag campaigns and promotions.', users: 25, allocated: 300000, color: '#2563EB', mgr: { name: 'Priya Sharma', email: 'priya@rubix.net', mobile: '+91 98765 43210' } },
  { name: 'Sales', desc: 'Client gifting, field sales kits and prospect merchandise.', users: 40, allocated: 200000, color: '#7C3AED', mgr: { name: 'Ravi Kumar', email: 'ravi@rubix.net', mobile: '+91 98220 11234' } },
  { name: 'HR', desc: 'Onboarding kits, employee rewards and recognition.', users: 30, allocated: 200000, color: '#0E9CB5', mgr: { name: 'Anita Rao', email: 'anita@rubix.net', mobile: '+91 99001 22789' } },
  { name: 'Admin', desc: 'Office supplies, signage and facility merchandise.', users: 12, allocated: 150000, color: '#E08600', mgr: { name: 'Karan Gupta', email: 'karan@rubix.net', mobile: '+91 90040 55678' } },
  { name: 'Customer Success', desc: 'Customer welcome kits and loyalty merchandise.', users: 18, allocated: 150000, color: '#0A8F5B', mgr: { name: 'Amit Singh', email: 'amit@rubix.net', mobile: '+91 96320 99001' } },
];

async function wipe() {
  const cols = [
    'tenants', 'users', 'roleassignments', 'refreshtokens', 'wallets', 'wallettransactions',
    'entities', 'auditlogs', 'catalogproducts', 'shops', 'collections', 'kits', 'contacts',
    'campaigns', 'recipients', 'orders', 'importjobs', 'importmappings', 'notifications',
    'idempotencykeys',
  ];
  await Promise.all(cols.map((c) => mongoose.connection.collection(c).deleteMany({})));
}

async function seed() {
  if (env.NODE_ENV === 'production') throw new Error('Refusing to seed a production environment');
  await connectDb();
  logger.warn('Wiping existing data…');
  await wipe();

  const password = await hashPassword('demo1234');

  await User.create({
    tenantId: null,
    name: 'ShelfMerch Admin',
    email: 'admin@shelfmerch.io',
    passwordHash: password,
    status: 'active',
  });
  // const superAdmin = await User.findOne({ email: 'admin@shelfmerch.io' });
  const superAdmin = await User.findOne({ email: 'hr@rubix.net' });
  await RoleAssignment.create({
    tenantId: null,
    userId: superAdmin._id,
    role: 'platform_super_admin',
    scopeType: 'platform',
  });

  const tenant = await Tenant.create({ name: 'Rubix', slug: 'rubix', currency: 'INR', status: 'active' });

  const [owner, admin] = await User.create([
    { tenantId: tenant._id, name: 'Jonna Madhavi', email: 'jonnaml2015@gmail.com', passwordHash: password, status: 'active' },
    { tenantId: tenant._id, name: 'Chandra Sekhar', email: 'hr@rubix.net', passwordHash: password, status: 'active' },
  ]);
  await RoleAssignment.create([
    { tenantId: tenant._id, userId: owner._id, role: 'company_admin', scopeType: 'tenant' },
    { tenantId: tenant._id, userId: admin._id, role: 'company_admin', scopeType: 'tenant' },
  ]);

  const wallet = await Wallet.create({
    tenantId: tenant._id,
    name: 'FY2026 Merchandise Budget',
    currency: 'INR',
    status: 'draft',
    validFrom: new Date('2026-04-01'),
    validTo: new Date('2027-03-31'),
    fundingMethod: 'po_upload',
    fundingDocument: { docType: 'Purchase Order', docNumber: 'PO-RUBIX-2026-0417', approvalStatus: 'approved' },
    ownerUserId: owner._id,
  });

  await ledger.createTransaction({
    tenantId: tenant._id,
    walletId: wallet._id,
    type: 'fund_in',
    amount: 1_000_000,
    description: 'PO-RUBIX-2026-0417 — FY2026 merchandise budget funding',
    performedBy: owner._id,
  });

  const entities = [];
  const allocations = [];
  for (const dept of DEPARTMENTS) {
    const entity = await Entity.create({
      tenantId: tenant._id,
      walletId: wallet._id,
      name: dept.name,
      description: dept.desc,
      colorHex: dept.color,
      expectedUsers: dept.users,
    });
    entities.push(entity);

    const manager = await User.create({
      tenantId: tenant._id,
      name: dept.mgr.name,
      email: dept.mgr.email,
      phone: dept.mgr.mobile,
      passwordHash: password,
      status: 'active',
    });
    await RoleAssignment.create({
      tenantId: tenant._id,
      userId: manager._id,
      role: 'entity_manager',
      scopeType: 'entity',
      scopeId: entity._id,
      assignedEntityIds: [entity._id],
    });
    entity.managerUserId = manager._id;
    await entity.save();
    allocations.push({ entityId: String(entity._id), amount: dept.allocated });
  }

  await ledger.allocateToEntities({ tenantId: tenant._id, walletId: wallet._id, allocations, performedBy: owner._id });
  const freshWallet = await Wallet.findOne({ _id: wallet._id, tenantId: tenant._id });
  transitionThrough('wallet', freshWallet, 'active', { userId: owner._id });
  await freshWallet.save();

  // --- Phase 3: Catalog, shop, collection, kits ---
  const products = await CatalogProduct.insertMany(CATALOG_PRODUCTS);
  const productByGroup = Object.fromEntries(products.map((p) => [p.group, p]));

  const shop = await Shop.create({
    tenantId: tenant._id,
    name: 'Rubix Dubai',
    currencyMode: 'points',
    status: 'live',
    categories: ['Food & Beverages', 'Work Essentials', 'Merch'],
  });

  await Collection.create({
    tenantId: tenant._id,
    shopId: shop._id,
    code: 'C343955972',
    name: 'New employee Swag',
    status: 'ready',
    preferredColors: ['Black', 'White'],
    productRefs: [
      { catalogProductId: productByGroup.pack._id, brand: 'Mercer+Mettle', name: 'Commuter Backpack', group: 'pack' },
      { catalogProductId: productByGroup.hoodie._id, brand: 'Bella + Canvas', name: 'Sponge Fleece Pullover Hoodie', group: 'hoodie' },
      { catalogProductId: productByGroup.mug._id, brand: '', name: 'Black Glossy Mug 11oz', group: 'mug' },
      { catalogProductId: productByGroup.bottle._id, brand: '', name: 'The Standard Bottle', group: 'bottle' },
    ],
    createdBy: owner._id,
  });

  await Kit.insertMany([
    {
      tenantId: tenant._id,
      name: 'Welcome',
      status: 'live',
      packaging: 'box',
      productRefs: [
        { catalogProductId: productByGroup.tee._id, brand: 'Port & Company', name: 'Youth Core Cotton Tee', group: 'tee' },
        { catalogProductId: productByGroup.bottle._id, brand: '', name: 'The Standard Bottle', group: 'bottle' },
        { catalogProductId: productByGroup.mug._id, brand: '', name: 'Black Glossy Mug 11oz', group: 'mug' },
        { catalogProductId: productByGroup.bag._id, brand: 'ChangeBag', name: 'Organic Canvas Tote', group: 'bag' },
      ],
    },
    {
      tenantId: tenant._id,
      name: 'New hire',
      status: 'live',
      packaging: 'box',
      productRefs: [
        { catalogProductId: productByGroup.hoodie._id, brand: 'Bella + Canvas', name: 'Sponge Fleece Pullover Hoodie', group: 'hoodie' },
        { catalogProductId: productByGroup.note._id, brand: 'Moleskine', name: 'Classic Hard Notebook', group: 'note' },
        { catalogProductId: productByGroup.cap._id, brand: 'Decathlon', name: 'Structured Twill Cap', group: 'cap' },
        { catalogProductId: productByGroup.power._id, brand: 'Ambrane', name: 'Xtreme-10 Power Bank', group: 'power' },
        { catalogProductId: productByGroup.bag._id, brand: 'ChangeBag', name: 'Organic Canvas Tote', group: 'bag' },
      ],
    },
  ]);

  // --- Phase 4: Contacts ---
  await Contact.insertMany([
    { tenantId: tenant._id, name: 'Jonna Madhavi', email: 'jonnaml2015@gmail.com', role: 'Owner', source: 'manual' },
    {
      tenantId: tenant._id,
      name: 'Chandra Sekhar',
      email: 'konetibaba@gmail.com',
      role: 'Sender',
      source: 'manual',
      address: { line1: 'Flat No 1004, Tower-9, Eipl Corner Stone', city: 'Hyderabad', state: 'Telangana', country: 'IN' },
    },
  ]);

  // --- Phase 4/5: Launched campaign with fixed redemption token for E2E demos ---
  const marketingEntity = entities[0];
  const priya = await User.findOne({ email: 'priya@rubix.net' });
  const priyaRole = await RoleAssignment.findOne({ userId: priya._id });

  const campaign = await campaignsService.createCampaign({
    tenantId: tenant._id,
    userId: priya._id,
    data: {
      entityId: marketingEntity._id,
      name: 'Diwali Gift 2026',
      type: 'points',
      shopId: shop._id,
      catalogMode: 'full_store',
      message: { from: 'The Rubix team', body: 'Happy Diwali! Pick a gift from our curated store.' },
    },
  });

  await campaignsService.importRecipients({
    tenantId: tenant._id,
    campaignId: campaign._id,
    user: {
      userId: priya._id,
      role: priyaRole.role,
      scopeType: 'entity',
      assignedEntityIds: [String(marketingEntity._id)],
    },
    recipients: [
      { name: 'Chandra Sekhar', email: 'konetibaba@gmail.com', phone: '+91 98765 00001' },
      { name: 'Jonna Madhavi', email: 'jonnaml2015@gmail.com' },
    ],
  });

  await campaignsService.allocateCredits({
    tenantId: tenant._id,
    campaignId: campaign._id,
    user: { userId: priya._id, scopeType: 'entity', assignedEntityIds: [String(marketingEntity._id)] },
    creditsPerRecipient: 5000,
  });

  await campaignsService.launchCampaign({
    tenantId: tenant._id,
    campaignId: campaign._id,
    user: { userId: priya._id, scopeType: 'entity', assignedEntityIds: [String(marketingEntity._id)] },
  });

  // Pin a known token on Chandra's recipient for incognito redemption testing.
  await Recipient.updateOne(
    { tenantId: tenant._id, campaignId: campaign._id, email: 'konetibaba@gmail.com' },
    { redemptionToken: DEMO_REDEMPTION_TOKEN },
  );

  logger.info(
    {
      tenant: tenant.slug,
      wallet: { balance: freshWallet.balance, allocated: freshWallet.allocatedAmount, status: freshWallet.status },
      catalogProducts: products.length,
      shop: shop.name,
      campaign: 'Diwali Gift 2026 (redemption_open)',
      redemptionToken: DEMO_REDEMPTION_TOKEN,
      logins: [
        'admin@shelfmerch.io / demo1234 (platform_super_admin)',
        'hr@rubix.net / demo1234 (company_admin)',
        'priya@rubix.net / demo1234 (entity_manager — Marketing)',
      ],
    },
    'Seed complete',
  );
}

seed()
  .then(() => disconnectDb())
  .catch(async (err) => {
    logger.error({ err }, 'Seed failed');
    await disconnectDb();
    process.exit(1);
  });
