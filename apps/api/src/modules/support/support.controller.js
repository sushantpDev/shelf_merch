import * as supportService from './support.service.js';
import { writeAudit } from '../../services/audit.service.js';

export async function listPlatform(req, res) {
  res.json(await supportService.listSupportTicketsWithTenants({ query: req.query }));
}

export async function getOne(req, res) {
  res.json(await supportService.getSupportTicketDetail(req.params.id));
}

export async function listMine(req, res) {
  res.json(await supportService.listTenantTickets({ tenantId: req.tenantId, query: req.query }));
}

export async function getMine(req, res) {
  res.json(await supportService.getTenantTicket({ ticketId: req.params.id, tenantId: req.tenantId }));
}

export async function addMyMessage(req, res) {
  const ticket = await supportService.addTenantMessage({
    ticketId: req.params.id,
    tenantId: req.tenantId,
    userId: req.user.userId,
    body: req.body.body,
  });
  writeAudit({
    req,
    action: 'support_ticket.message',
    entityType: 'SupportTicket',
    entityId: ticket._id,
    after: { messagesCount: ticket.messages.length, internal: false },
  });
  res.json(ticket);
}

export async function create(req, res) {
  const ticket = await supportService.createSupportTicket({
    tenantId: req.tenantId,
    userId: req.user.userId,
    source: 'tenant',
    ...req.body,
  });
  writeAudit({
    req,
    action: 'support_ticket.create',
    entityType: 'SupportTicket',
    entityId: ticket._id,
    after: { subject: ticket.subject, status: ticket.status },
  });
  res.status(201).json(ticket);
}

export async function createPlatform(req, res) {
  const { tenantId, ...rest } = req.body;
  const ticket = await supportService.createSupportTicket({
    tenantId,
    userId: req.user.userId,
    source: 'platform',
    ...rest,
  });
  writeAudit({
    req,
    action: 'support_ticket.create',
    entityType: 'SupportTicket',
    entityId: ticket._id,
    after: { subject: ticket.subject, status: ticket.status, tenantId: String(tenantId) },
  });
  res.status(201).json(ticket);
}

export async function search(req, res) {
  res.json(await supportService.crossTenantSearch(req.query.q));
}

export async function addMessage(req, res) {
  const ticket = await supportService.addMessage({
    ticketId: req.params.id,
    authorUserId: req.user.userId,
    body: req.body.body,
    internal: req.body.internal,
  });
  writeAudit({
    req,
    action: 'support_ticket.message',
    entityType: 'SupportTicket',
    entityId: ticket._id,
    after: { messagesCount: ticket.messages.length, internal: req.body.internal ?? false },
  });
  res.json(ticket);
}

export async function updateStatus(req, res) {
  const before = await supportService.getSupportTicket(req.params.id);
  const ticket = await supportService.updateSupportTicketStatus({
    ticketId: req.params.id,
    status: req.body.status,
    actor: { userId: req.user.userId },
  });
  writeAudit({
    req,
    action: 'support_ticket.status_update',
    entityType: 'SupportTicket',
    entityId: ticket._id,
    before: { status: before.status },
    after: { status: ticket.status },
  });
  res.json(ticket);
}

export async function assign(req, res) {
  const ticket = await supportService.assignTicket({
    ticketId: req.params.id,
    userId: req.body.userId,
    actor: { userId: req.user.userId },
  });
  writeAudit({
    req,
    action: 'support_ticket.assign',
    entityType: 'SupportTicket',
    entityId: ticket._id,
    after: { assignedToUserId: String(ticket.assignedToUserId) },
  });
  res.json(ticket);
}

export async function linkOrder(req, res) {
  const ticket = await supportService.linkTicketToOrder({
    ticketId: req.params.id,
    orderId: req.body.orderId,
  });
  writeAudit({
    req,
    action: 'support_ticket.link_order',
    entityType: 'SupportTicket',
    entityId: ticket._id,
    after: { relatedOrderId: String(ticket.relatedOrderId) },
  });
  res.json(ticket);
}

export async function resendRedemptionLink(req, res) {
  const result = await supportService.resendRedemptionLink({ ticketId: req.params.id });
  writeAudit({
    req,
    action: 'support_ticket.resend_redemption_link',
    entityType: 'SupportTicket',
    entityId: req.params.id,
    after: result,
  });
  res.json(result);
}

export async function resendTrackingLink(req, res) {
  const result = await supportService.resendTrackingLink({ ticketId: req.params.id });
  writeAudit({
    req,
    action: 'support_ticket.resend_tracking_link',
    entityType: 'SupportTicket',
    entityId: req.params.id,
    after: result,
  });
  res.json(result);
}

export async function updateAddress(req, res) {
  const { order, before } = await supportService.updateTicketOrderAddress({
    ticketId: req.params.id,
    address: req.body.address,
  });
  writeAudit({
    req,
    action: 'support_ticket.address_update',
    entityType: 'Order',
    entityId: order._id,
    before: { shippingAddress: before },
    after: { shippingAddress: order.toObject().shippingAddress },
  });
  res.json(order);
}
