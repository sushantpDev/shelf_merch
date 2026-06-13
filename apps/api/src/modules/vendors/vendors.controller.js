import * as vendorsService from './vendors.service.js';
import { writeAudit } from '../../services/audit.service.js';

export async function list(req, res) {
  res.json(await vendorsService.listVendors(req.query));
}

export async function create(req, res) {
  const vendor = await vendorsService.createVendor(req.body);
  writeAudit({ req, action: 'vendor.create', entityType: 'Vendor', entityId: vendor._id, after: vendor.toObject() });
  res.status(201).json(vendor);
}

export async function update(req, res) {
  const before = await vendorsService.getVendor(req.params.id);
  const vendor = await vendorsService.updateVendor(req.params.id, req.body);
  writeAudit({
    req,
    action: 'vendor.update',
    entityType: 'Vendor',
    entityId: vendor._id,
    before: before.toObject(),
    after: vendor.toObject(),
  });
  res.json(vendor);
}
