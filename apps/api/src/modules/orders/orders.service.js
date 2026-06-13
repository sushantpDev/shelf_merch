import { Order, sanitizeOrderItems } from './order.model.js';
import { Campaign } from '../campaigns/campaign.model.js';
import { Recipient } from '../campaigns/recipient.model.js';
import { transitionState, validNextStatuses } from '../../services/stateMachine.service.js';
import { ApiError, NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { getPagination, paginatedResponse } from '../../utils/pagination.js';

/**
 * §3.5 — tenants only keep the mockup quality gate. Every other transition is
 * platform-only via /platform/orders/:id/status.
 */
const TENANT_ALLOWED_STATUSES = ['mockup_approved', 'issue_raised'];

async function campaignIdsForUser(tenantId, user) {
  if (user.scopeType !== 'entity') return null;
  const campaigns = await Campaign.find({
    tenantId,
    entityId: { $in: user.assignedEntityIds ?? [] },
  }).select('_id');
  return campaigns.map((c) => c._id);
}

async function assertOrderAccess({ tenantId, user, order }) {
  if (user.scopeType !== 'entity') return;
  const campaign = await Campaign.findOne({ _id: order.campaignId, tenantId }).select('entityId');
  if (!campaign) throw new NotFoundError('Order not found');
  const allowed = (user.assignedEntityIds ?? []).map(String);
  if (!allowed.includes(String(campaign.entityId))) {
    throw new ForbiddenError('You do not have access to this order');
  }
}

function withMeta(order, extras = {}) {
  const obj = order.toObject ? order.toObject() : order;
  const { internalNotes, ...safe } = obj; // internal notes are platform-only
  return {
    ...safe,
    items: sanitizeOrderItems(obj.items ?? []),
    validNextStatuses: validNextStatuses('order', obj.status),
    ...extras,
  };
}

export async function listOrders({ tenantId, user, query }) {
  const { page, limit, skip } = getPagination(query);
  const filter = { tenantId };
  if (query.status) filter.status = query.status;

  const scopedCampaignIds = await campaignIdsForUser(tenantId, user);
  if (scopedCampaignIds) {
    if (!scopedCampaignIds.length) {
      return paginatedResponse([], 0, { page, limit });
    }
    filter.campaignId = { $in: scopedCampaignIds };
  }

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  const campaignIds = [...new Set(items.map((o) => String(o.campaignId)))];
  const campaigns = await Campaign.find({ _id: { $in: campaignIds }, tenantId }).select('name entityId');
  const campaignById = Object.fromEntries(campaigns.map((c) => [String(c._id), c]));

  const enriched = items.map((o) =>
    withMeta(o, {
      campaignName: campaignById[String(o.campaignId)]?.name ?? '',
    }),
  );

  return paginatedResponse(enriched, total, { page, limit });
}

export async function getOrder({ tenantId, user, orderId }) {
  const order = await Order.findOne({ _id: orderId, tenantId });
  if (!order) throw new NotFoundError('Order not found');
  await assertOrderAccess({ tenantId, user, order });

  const [campaign, recipient] = await Promise.all([
    Campaign.findOne({ _id: order.campaignId, tenantId }).select('name entityId'),
    Recipient.findOne({ _id: order.recipientId, tenantId }).select('name email'),
  ]);

  return withMeta(order, {
    campaignName: campaign?.name ?? '',
    recipient: recipient ? { name: recipient.name, email: recipient.email } : null,
  });
}

export async function updateOrderStatus({ tenantId, user, orderId, status, note, trackingNumber }) {
  const order = await Order.findOne({ _id: orderId, tenantId });
  if (!order) throw new NotFoundError('Order not found');

  // Platform users (impersonating or not) keep full control; tenant admins
  // only retain the mockup approve/reject gate and raising an issue (§3.5).
  const isPlatform = String(user.role ?? '').startsWith('platform_');
  if (!isPlatform && !TENANT_ALLOWED_STATUSES.includes(status)) {
    throw new ApiError(
      403,
      'Order status changes are managed by ShelfMerch operations. You can only approve/reject mockups or raise an issue.',
      'PLATFORM_ONLY_TRANSITION',
    );
  }

  transitionState('order', order, status, { userId: user.userId }, note);
  if (trackingNumber) order.trackingNumber = trackingNumber;
  await order.save();

  return getOrder({ tenantId, user, orderId: order._id });
}
