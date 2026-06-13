import { Vendor } from './vendor.model.js';
import { NotFoundError, ApiError } from '../../utils/errors.js';

export async function listVendors({ status, type } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  return Vendor.find(filter).sort({ name: 1 });
}

export async function getVendor(vendorId) {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new NotFoundError('Vendor not found');
  return vendor;
}

export async function createVendor(data) {
  return Vendor.create(data);
}

export async function updateVendor(vendorId, patch) {
  const vendor = await Vendor.findByIdAndUpdate(vendorId, patch, { new: true });
  if (!vendor) throw new NotFoundError('Vendor not found');
  return vendor;
}

export async function assertActiveVendor(vendorId) {
  const vendor = await getVendor(vendorId);
  if (vendor.status !== 'active') {
    throw new ApiError(422, 'Vendor is not active', 'VENDOR_INACTIVE');
  }
  return vendor;
}
