import * as shipmentsService from './shipments.service.js';
import { writeAudit } from '../../services/audit.service.js';

export async function list(req, res) {
  res.json(await shipmentsService.listShipments({ query: req.query }));
}

export async function create(req, res) {
  const shipment = await shipmentsService.createShipment({
    ...req.body,
    actor: { userId: req.user.userId },
  });
  writeAudit({
    req,
    action: 'shipment.create',
    entityType: 'Shipment',
    entityId: shipment._id,
    after: { orderId: String(shipment.orderId), courier: shipment.courier, awb: shipment.awb },
  });
  res.status(201).json(shipment);
}

export async function bulkAwb(req, res) {
  const rows = req.body.rows?.length
    ? req.body.rows
    : shipmentsService.parseBulkAwbCsv(req.body.csv);
  const result = await shipmentsService.bulkAddAwb({ rows, actor: { userId: req.user.userId } });
  writeAudit({
    req,
    action: 'shipment.bulk_awb',
    entityType: 'Shipment',
    after: { created: result.created, failed: result.failed },
  });
  res.status(201).json(result);
}

export async function addEvent(req, res) {
  const before = await shipmentsService.getShipment(req.params.id);
  const shipment = await shipmentsService.addShipmentEvent({
    shipmentId: req.params.id,
    status: req.body.status,
    location: req.body.location,
    note: req.body.note,
    at: req.body.at,
    actor: { userId: req.user.userId },
  });
  writeAudit({
    req,
    action: 'shipment.event',
    entityType: 'Shipment',
    entityId: shipment._id,
    before: { status: before.status, eventsCount: before.events.length },
    after: { status: shipment.status, eventsCount: shipment.events.length },
  });
  res.json(shipment);
}

export async function update(req, res) {
  const before = await shipmentsService.getShipment(req.params.id);
  const shipment = await shipmentsService.updateShipment({ shipmentId: req.params.id, patch: req.body });
  writeAudit({
    req,
    action: 'shipment.update',
    entityType: 'Shipment',
    entityId: shipment._id,
    before: { courier: before.courier, awb: before.awb },
    after: req.body,
  });
  res.json(shipment);
}

export async function resendTracking(req, res) {
  const result = await shipmentsService.resendTrackingLink({ shipmentId: req.params.id });
  writeAudit({
    req,
    action: 'shipment.resend_tracking',
    entityType: 'Shipment',
    entityId: req.params.id,
    after: result,
  });
  res.json(result);
}
