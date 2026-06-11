import * as ordersService from './orders.service.js';
import { writeAudit } from '../../services/audit.service.js';

export async function list(req, res) {
  res.json(await ordersService.listOrders({ tenantId: req.tenantId, user: req.user, query: req.query }));
}

export async function getOne(req, res) {
  res.json(await ordersService.getOrder({ tenantId: req.tenantId, user: req.user, orderId: req.params.id }));
}

export async function updateStatus(req, res) {
  const before = await ordersService.getOrder({
    tenantId: req.tenantId,
    user: req.user,
    orderId: req.params.id,
  });
  const order = await ordersService.updateOrderStatus({
    tenantId: req.tenantId,
    user: req.user,
    orderId: req.params.id,
    ...req.body,
  });
  writeAudit({
    req,
    action: 'order.status_update',
    entityType: 'Order',
    entityId: req.params.id,
    before: { status: before.status },
    after: { status: order.status, trackingNumber: order.trackingNumber },
  });
  res.json(order);
}
