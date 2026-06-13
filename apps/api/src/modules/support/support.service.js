import { SupportTicket } from './supportTicket.model.js';
import { Order } from '../orders/order.model.js';
import { Recipient } from '../campaigns/recipient.model.js';
import { Campaign } from '../campaigns/campaign.model.js';
import { Shipment } from '../shipments/shipment.model.js';
import { transitionState } from '../../services/stateMachine.service.js';
import { sendNotificationEmail, appUrl } from '../../services/email.service.js';
import { ApiError, NotFoundError } from '../../utils/errors.js';
import { getPagination, paginatedResponse } from '../../utils/pagination.js';

function buildFilter(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.tenantId) filter.tenantId = query.tenantId;
  if (query.type) filter.type = query.type;
  if (query.assignedToUserId) filter.assignedToUserId = query.assignedToUserId;
  return filter;
}

export async function listSupportTickets({ query, tenantId = null }) {
  const { page, limit, skip } = getPagination(query);
  const filter = buildFilter(query);
  if (tenantId) filter.tenantId = tenantId;

  const opts = tenantId ? {} : { skipTenantGuard: true };
  const [items, total] = await Promise.all([
    SupportTicket.find(filter)
      .setOptions(opts)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SupportTicket.countDocuments(filter).setOptions(opts),
  ]);

  return paginatedResponse(items, total, { page, limit });
}

export async function getSupportTicket(ticketId, { tenantId = null } = {}) {
  const filter = { _id: ticketId };
  if (tenantId) filter.tenantId = tenantId;
  const opts = tenantId ? {} : { skipTenantGuard: true };
  const ticket = await SupportTicket.findOne(filter).setOptions(opts);
  if (!ticket) throw new NotFoundError('Support ticket not found');
  return ticket;
}

export async function createSupportTicket({
  tenantId,
  userId,
  subject,
  description,
  type = 'other',
  source = 'tenant',
  relatedOrderId = null,
  relatedRecipientId = null,
}) {
  return SupportTicket.create({
    tenantId,
    raisedByUserId: userId,
    subject,
    description,
    type,
    source,
    relatedOrderId,
    relatedRecipientId,
  });
}

export async function addMessage({ ticketId, authorUserId, body, internal = false, tenantId = null }) {
  const ticket = await getSupportTicket(ticketId, { tenantId });
  ticket.messages.push({ authorUserId, body, internal, at: new Date() });
  await ticket.save();
  return ticket;
}

export async function updateSupportTicketStatus({ ticketId, status, actor, tenantId = null }) {
  const ticket = await getSupportTicket(ticketId, { tenantId });
  transitionState('supportTicket', ticket, status, actor);
  await ticket.save();
  return ticket;
}

export async function assignTicket({ ticketId, userId, actor }) {
  const ticket = await getSupportTicket(ticketId);
  ticket.assignedToUserId = userId;
  if (ticket.status === 'open') {
    transitionState('supportTicket', ticket, 'in_progress', actor, 'Assigned');
  }
  await ticket.save();
  return ticket;
}

export async function linkTicketToOrder({ ticketId, orderId }) {
  const ticket = await getSupportTicket(ticketId);
  // A ticket may only ever link to an order in its OWN tenant — scope by
  // ticket.tenantId even on the platform path (skipTenantGuard).
  const order = await Order.findOne({ _id: orderId, tenantId: ticket.tenantId }).setOptions({
    skipTenantGuard: true,
  });
  if (!order) throw new NotFoundError('Order not found');
  ticket.relatedOrderId = order._id;
  if (!ticket.relatedRecipientId) ticket.relatedRecipientId = order.recipientId;
  await ticket.save();
  return ticket;
}

/**
 * §3.9 cross-tenant search — q matches recipient phone/email, order number,
 * AWB, or campaign name. Returns grouped results for the agent's console.
 */
export async function crossTenantSearch(q) {
  const term = q.trim();
  if (!term) throw new ApiError(422, 'Search term "q" is required', 'INVALID_QUERY');
  const regex = { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const skipGuard = { skipTenantGuard: true };

  const [recipients, orders, shipments, campaigns] = await Promise.all([
    Recipient.find({ $or: [{ email: regex }, { phone: regex }, { name: regex }] })
      .setOptions(skipGuard)
      .select('name email phone tenantId campaignId redemptionStatus')
      .limit(10)
      .lean(),
    Order.find({ orderNumber: regex })
      .setOptions(skipGuard)
      .select('orderNumber status tenantId recipientId amountBreakdown.total')
      .limit(10)
      .lean(),
    Shipment.find({ awb: regex })
      .setOptions(skipGuard)
      .select('awb courier status orderId tenantId')
      .limit(10)
      .lean(),
    Campaign.find({ name: regex })
      .setOptions(skipGuard)
      .select('name status type tenantId')
      .limit(10)
      .lean(),
  ]);

  return { recipients, orders, shipments, campaigns };
}

async function recipientForTicket(ticket) {
  let recipientId = ticket.relatedRecipientId;
  if (!recipientId && ticket.relatedOrderId) {
    const order = await Order.findOne({ _id: ticket.relatedOrderId, tenantId: ticket.tenantId }).setOptions({
      skipTenantGuard: true,
    });
    recipientId = order?.recipientId ?? null;
  }
  if (!recipientId) {
    throw new ApiError(422, 'Ticket has no linked recipient or order', 'NO_RECIPIENT');
  }
  const recipient = await Recipient.findOne({ _id: recipientId, tenantId: ticket.tenantId }).setOptions({
    skipTenantGuard: true,
  });
  if (!recipient?.email) throw new ApiError(422, 'No recipient email on file', 'NO_RECIPIENT_EMAIL');
  return recipient;
}

/** §3.9 — resend the redemption link for the recipient on the ticket. */
export async function resendRedemptionLink({ ticketId }) {
  const ticket = await getSupportTicket(ticketId);
  const recipient = await recipientForTicket(ticket);
  if (['redeemed', 'order_created'].includes(recipient.redemptionStatus)) {
    throw new ApiError(422, 'This recipient has already redeemed', 'ALREADY_REDEEMED');
  }

  await sendNotificationEmail({
    to: recipient.email,
    title: 'Your gift is waiting — redemption link',
    body: `Hi ${recipient.name}, here is your gift redemption link again.`,
    link: appUrl(`/redeem/${recipient.redemptionToken}`),
  });
  return { sent: true, to: recipient.email };
}

/** §3.9 — resend the tracking link for the order on the ticket. */
export async function resendTrackingLink({ ticketId }) {
  const ticket = await getSupportTicket(ticketId);
  if (!ticket.relatedOrderId) throw new ApiError(422, 'Ticket has no linked order', 'NO_ORDER');

  const order = await Order.findOne({ _id: ticket.relatedOrderId, tenantId: ticket.tenantId }).setOptions({
    skipTenantGuard: true,
  });
  if (!order) throw new NotFoundError('Order not found');
  const recipient = await recipientForTicket(ticket);

  const shipment = await Shipment.findOne({ orderId: order._id, tenantId: order.tenantId });
  await sendNotificationEmail({
    to: recipient.email,
    title: `Tracking update for order ${order.orderNumber}`,
    body: shipment
      ? `Your order is with ${shipment.courier || 'our courier'} (AWB ${shipment.awb}).`
      : `Your order ${order.orderNumber} is currently "${order.status}".`,
    link: shipment?.trackingUrl || appUrl(`/redeem/${recipient.redemptionToken}`),
  });
  return { sent: true, to: recipient.email };
}

/** §3.9 — fix a recipient's shipping address on the linked order. */
export async function updateTicketOrderAddress({ ticketId, address }) {
  const ticket = await getSupportTicket(ticketId);
  if (!ticket.relatedOrderId) throw new ApiError(422, 'Ticket has no linked order', 'NO_ORDER');

  const order = await Order.findOne({ _id: ticket.relatedOrderId, tenantId: ticket.tenantId }).setOptions({
    skipTenantGuard: true,
  });
  if (!order) throw new NotFoundError('Order not found');
  if (['shipped', 'delivered'].includes(order.status)) {
    throw new ApiError(422, `Cannot change the address of a ${order.status} order`, 'TOO_LATE');
  }

  const before = order.toObject().shippingAddress;
  Object.assign(order.shippingAddress, address);
  await order.save();
  return { order, before };
}
