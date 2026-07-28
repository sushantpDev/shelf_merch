import { z } from 'zod';

/** Indian GSTIN — 15 chars: state(2) + PAN(10) + entity(1) + Z + checksum(1). */
export const INDIAN_GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const addressField = z.string().trim().min(1, 'Address is required');

const pinCodeField = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Pin code must be exactly 6 digits');

const mobileNumberField = z
  .string()
  .trim()
  .regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits');

const gstinField = z
  .string()
  .trim()
  .length(15, 'GSTIN must be exactly 15 characters')
  .regex(INDIAN_GSTIN, 'Invalid GSTIN format')
  .transform((s) => s.toUpperCase());

/** Required on new wallet setup / create flows. */
export const walletContactFieldsRequired = {
  address: addressField,
  pinCode: pinCodeField,
  mobileNumber: mobileNumberField,
  gstin: gstinField,
};

/** Optional on PATCH — validated only when provided. */
export const walletContactFieldsOptional = {
  address: addressField.optional(),
  pinCode: pinCodeField.optional(),
  mobileNumber: mobileNumberField.optional(),
  gstin: gstinField.optional(),
};
