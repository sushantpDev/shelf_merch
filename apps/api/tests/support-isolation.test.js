import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { Tenant } from '../src/modules/tenants/tenant.model.js';
import { Order } from '../src/modules/orders/order.model.js';
import { SupportTicket } from '../src/modules/support/supportTicket.model.js';
import * as support from '../src/modules/support/support.service.js';
import { NotFoundError } from '../src/utils/errors.js';

let tenantA;
let tenantB;
let orderB;

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

beforeEach(async () => {
  await clearTestDb();
  tenantA = await Tenant.create({ name: 'Rubix', slug: 'rubix' });
  tenantB = await Tenant.create({ name: 'Acme', slug: 'acme' });
  // An order that belongs to tenant B.
  orderB = await Order.create({
    tenantId: tenantB._id,
    campaignId: new mongoose.Types.ObjectId(),
    recipientId: new mongoose.Types.ObjectId(),
    orderNumber: `SM-B-${Date.now()}`,
    status: 'created',
  });
});

describe('support module cross-tenant isolation', () => {
  it("a tenant A ticket cannot be linked to tenant B's order", async () => {
    const ticketA = await SupportTicket.create({ tenantId: tenantA._id, subject: 'Help' });
    await expect(
      support.linkTicketToOrder({ ticketId: ticketA._id, orderId: orderB._id }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const reloaded = await SupportTicket.findOne({ _id: ticketA._id, tenantId: tenantA._id });
    expect(reloaded.relatedOrderId).toBeNull();
  });

  it('a ticket links to an order in its own tenant', async () => {
    const orderA = await Order.create({
      tenantId: tenantA._id,
      campaignId: new mongoose.Types.ObjectId(),
      recipientId: new mongoose.Types.ObjectId(),
      orderNumber: `SM-A-${Date.now()}`,
      status: 'created',
    });
    const ticketA = await SupportTicket.create({ tenantId: tenantA._id, subject: 'Help' });

    const linked = await support.linkTicketToOrder({ ticketId: ticketA._id, orderId: orderA._id });
    expect(String(linked.relatedOrderId)).toBe(String(orderA._id));
  });

  it("cannot change the address of a cross-tenant order via a ticket", async () => {
    // Force a stale cross-tenant link straight in the DB, then attempt the update.
    const ticketA = await SupportTicket.create({
      tenantId: tenantA._id,
      subject: 'Address',
      relatedOrderId: orderB._id,
    });
    await expect(
      support.updateTicketOrderAddress({ ticketId: ticketA._id, address: { city: 'Pune' } }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
