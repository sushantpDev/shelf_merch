import { Recipient } from '../modules/campaigns/recipient.model.js';
import { Order } from '../modules/orders/order.model.js';
import { Contact } from '../modules/contacts/contact.model.js';
import { Shop } from '../modules/shops/shop.model.js';
import { Collection } from '../modules/collections/collection.model.js';
import { Notification } from '../modules/notifications/notification.model.js';
import * as campaignsService from '../modules/campaigns/campaigns.service.js';
import { DEMO_ORDER_MOCKUP_TOKEN, DEMO_REDEMPTION_TOKEN } from './demoReference.js';

function orderItem(product, qty = 1) {
  return {
    catalogProductId: product._id,
    name: product.name,
    sku: product.sku,
    variant: { size: 'M', color: 'Black' },
    qty,
    unitPriceInr: product.basePriceInr,
    costPriceInr: Math.round(product.basePriceInr * 0.45),
    gstRate: product.gstRate ?? 18,
    hsnCode: product.hsnCode ?? '6109',
    imageUrl: product.primaryImageUrl || '',
  };
}

/** Extra tenant records: contacts, shops, campaigns, orders, notifications. */
export async function seedTenantDemo({
  tenant,
  owner,
  entities,
  entityByName,
  shop,
  productByGroup,
  priya,
  priyaRole,
  ravi,
  raviRole,
  marketingCampaign,
}) {
  const marketingEntity = entityByName.Marketing;
  const salesEntity = entityByName.Sales;

  await Contact.insertMany([
    {
      tenantId: tenant._id,
      name: 'Priya Sharma',
      email: 'priya@rubix.net',
      phone: '+91 98765 43210',
      role: 'Sender',
      department: 'Marketing',
      employeeCode: 'RBX-MKT-001',
      source: 'manual',
      address: { line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', country: 'IN' },
    },
    {
      tenantId: tenant._id,
      name: 'Ravi Kumar',
      email: 'ravi@rubix.net',
      phone: '+91 98220 11234',
      role: 'Sender',
      department: 'Sales',
      employeeCode: 'RBX-SLS-001',
      source: 'manual',
    },
    {
      tenantId: tenant._id,
      name: 'Neha Patel',
      email: 'neha.patel@example.com',
      phone: '+91 90000 12345',
      role: 'Member',
      department: 'Sales',
      source: 'manual',
      address: { line1: '88 Cyber Towers', city: 'Hyderabad', state: 'Telangana', pincode: '500081', country: 'IN' },
    },
    {
      tenantId: tenant._id,
      name: 'Arjun Mehta',
      email: 'arjun.mehta@example.com',
      role: 'Member',
      department: 'Marketing',
      source: 'manual',
    },
    {
      tenantId: tenant._id,
      name: 'Sneha Reddy',
      email: 'sneha.reddy@example.com',
      phone: '+91 91234 56789',
      role: 'Non-Member',
      source: 'csv',
    },
  ]);

  const shopBlr = await Shop.create({
    tenantId: tenant._id,
    name: 'Rubix Bengaluru',
    currencyMode: 'inr',
    status: 'live',
    categories: ['Work Essentials', 'Merch', 'Wellness'],
  });

  await Collection.create({
    tenantId: tenant._id,
    shopId: shopBlr._id,
    code: 'C882104331',
    name: 'Sales prospect kit',
    status: 'ready',
    preferredColors: ['Navy', 'Grey'],
    productRefs: [
      { catalogProductId: productByGroup.note._id, brand: 'Moleskine', name: 'Classic Hard Notebook', group: 'note' },
      { catalogProductId: productByGroup.tee._id, brand: 'Port & Company', name: 'Youth Core Cotton Tee', group: 'tee' },
      { catalogProductId: productByGroup.cap._id, brand: 'Decathlon', name: 'Structured Twill Cap', group: 'cap' },
    ],
    createdBy: owner._id,
  });

  const salesCampaign = await campaignsService.createCampaign({
    tenantId: tenant._id,
    userId: ravi._id,
    data: {
      entityId: salesEntity._id,
      name: 'Q1 Prospect Gifting',
      type: 'points',
      shopId: shopBlr._id,
      catalogMode: 'full_store',
      message: { from: 'Rubix Sales', body: 'Thank you for meeting with us — pick a gift!' },
    },
  });

  await campaignsService.importRecipients({
    tenantId: tenant._id,
    campaignId: salesCampaign._id,
    user: {
      userId: ravi._id,
      role: raviRole.role,
      scopeType: 'entity',
      assignedEntityIds: [String(salesEntity._id)],
    },
    recipients: [
      { name: 'Neha Patel', email: 'neha.patel@example.com', phone: '+91 90000 12345' },
      { name: 'Arjun Mehta', email: 'arjun.mehta@example.com' },
    ],
  });

  await campaignsService.allocateCredits({
    tenantId: tenant._id,
    campaignId: salesCampaign._id,
    user: { userId: ravi._id, scopeType: 'entity', assignedEntityIds: [String(salesEntity._id)] },
    creditsPerRecipient: 3000,
  });

  await campaignsService.launchCampaign({
    tenantId: tenant._id,
    campaignId: salesCampaign._id,
    user: { userId: ravi._id, scopeType: 'entity', assignedEntityIds: [String(salesEntity._id)] },
  });

  await Recipient.updateOne(
    { tenantId: tenant._id, campaignId: marketingCampaign._id, email: 'konetibaba@gmail.com' },
    { redemptionToken: DEMO_REDEMPTION_TOKEN },
  );

  await Recipient.updateOne(
    { tenantId: tenant._id, campaignId: marketingCampaign._id, email: 'jonnaml2015@gmail.com' },
    {
      redemptionToken: DEMO_ORDER_MOCKUP_TOKEN,
      redemptionStatus: 'order_created',
      redeemedAt: new Date(),
      phone: '+91 98765 00002',
    },
  );

  const mockupRecipient = await Recipient.findOne({
    tenantId: tenant._id,
    campaignId: marketingCampaign._id,
    email: 'jonnaml2015@gmail.com',
  });

  const productionRecipient = await Recipient.create({
    tenantId: tenant._id,
    campaignId: marketingCampaign._id,
    name: 'Arjun Mehta',
    email: 'arjun.mehta@example.com',
    creditAmount: 5000,
    redemptionToken: 'seedDemoOrderProductionRubix26',
    redemptionStatus: 'order_created',
    redeemedAt: new Date(),
  });

  const shippedRecipient = await Recipient.create({
    tenantId: tenant._id,
    campaignId: marketingCampaign._id,
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    phone: '+91 91234 56789',
    creditAmount: 5000,
    redemptionToken: 'seedDemoOrderShippedRubix26',
    redemptionStatus: 'order_created',
    redeemedAt: new Date(),
  });

  const addr = {
    name: 'Jonna Madhavi',
    phone: '+91 98765 00002',
    line1: 'Flat 1004, Tower-9, Eipl Corner Stone',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500032',
    country: 'IN',
  };

  const tee = productByGroup.tee;
  const hoodie = productByGroup.hoodie;
  const item = orderItem(tee, 2);
  const subtotal = item.unitPriceInr * item.qty;
  const gst = Math.round(subtotal * 0.18);
  const breakdown = { subtotal, serviceFee: 0, gst, total: subtotal + gst };

  const mockupOrder = await Order.create({
    tenantId: tenant._id,
    campaignId: marketingCampaign._id,
    recipientId: mockupRecipient._id,
    orderNumber: 'SM-2026-100001',
    items: [item],
    shippingAddress: addr,
    amountBreakdown: breakdown,
    status: 'mockup_pending',
    mockupUrl: '/uploads/mockups/rubix-tee-mockup.png',
    statusHistory: [{ status: 'created', at: new Date(), note: 'Redemption submitted' }, { status: 'mockup_pending', at: new Date(), note: 'Mockup uploaded by ops' }],
  });

  const productionOrder = await Order.create({
    tenantId: tenant._id,
    campaignId: marketingCampaign._id,
    recipientId: productionRecipient._id,
    orderNumber: 'SM-2026-100002',
    items: [orderItem(hoodie, 1)],
    shippingAddress: { ...addr, name: 'Arjun Mehta', line1: '88 Cyber Towers', pincode: '500081' },
    amountBreakdown: { subtotal: hoodie.basePriceInr, serviceFee: 0, gst: Math.round(hoodie.basePriceInr * 0.18), total: Math.round(hoodie.basePriceInr * 1.18) },
    status: 'in_production',
    mockupUrl: '/uploads/mockups/rubix-hoodie-mockup.png',
    statusHistory: [
      { status: 'created', at: new Date() },
      { status: 'mockup_pending', at: new Date() },
      { status: 'mockup_approved', at: new Date(), note: 'Approved by tenant admin' },
      { status: 'in_production', at: new Date() },
    ],
  });

  const shippedOrder = await Order.create({
    tenantId: tenant._id,
    campaignId: marketingCampaign._id,
    recipientId: shippedRecipient._id,
    orderNumber: 'SM-2026-100003',
    items: [orderItem(productByGroup.mug, 1), orderItem(productByGroup.bottle, 1)],
    shippingAddress: { ...addr, name: 'Sneha Reddy', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
    amountBreakdown: { subtotal: 1310, serviceFee: 50, gst: 245, total: 1605 },
    status: 'shipped',
    trackingNumber: 'DLV9876543210',
    statusHistory: [
      { status: 'created', at: new Date() },
      { status: 'mockup_approved', at: new Date() },
      { status: 'in_production', at: new Date() },
      { status: 'packed', at: new Date() },
      { status: 'shipped', at: new Date() },
    ],
  });

  await Notification.insertMany([
    {
      tenantId: tenant._id,
      userId: priya._id,
      type: 'campaign_launched',
      title: 'Diwali Gift 2026 is live',
      body: '2 recipients can redeem their 5,000-point credits.',
      link: '/campaigns',
    },
    {
      tenantId: tenant._id,
      userId: owner._id,
      type: 'order_mockup_pending',
      title: 'Mockup awaiting approval',
      body: `Order ${mockupOrder.orderNumber} — Rubix tee mockup ready for review.`,
      link: '/orders',
      read: false,
    },
    {
      tenantId: tenant._id,
      userId: ravi._id,
      type: 'campaign_launched',
      title: 'Q1 Prospect Gifting launched',
      body: 'Sales campaign is open for 2 prospects.',
      link: '/campaigns',
    },
  ]);

  return {
    salesCampaign,
    orders: { mockupOrder, productionOrder, shippedOrder },
    shopBlr,
  };
}
