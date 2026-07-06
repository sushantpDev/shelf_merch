import { z } from 'zod';
import { objectId } from '../users/users.validation.js';
import { TRANSACTION_TYPES } from './walletTransaction.model.js';

export const createWalletSchema = z.object({
  name: z.string().min(1),
  currency: z.enum(['INR', 'USD']).optional().default('INR'),
  validFrom: z.coerce.date().optional().nullable().default(null),
  validTo: z.coerce.date().optional().nullable().default(null),
  fundingMethod: z.enum(['po_upload', 'online']).optional().default('po_upload'),
  fundingDocument: z
    .object({
      docType: z.string().optional().default(''),
      docNumber: z.string().optional().default(''),
      fileUrl: z.string().optional().default(''),
    })
    .optional(),
});

/** Multipart wallet wizard — create + optional PO upload + funding request in one call. */
export const setupWalletSchema = z.object({
  name: z.string().min(1),
  currency: z.enum(['INR', 'USD']).optional().default('INR'),
  validFrom: z.coerce.date().optional().nullable().default(null),
  validTo: z.coerce.date().optional().nullable().default(null),
  fundingMethod: z.enum(['po_upload', 'online']).optional().default('po_upload'),
  docType: z.string().optional().default(''),
  docNumber: z.string().optional().default(''),
  amount: z.coerce.number().nonnegative().optional().default(0),
});

export const updateWalletSchema = z
  .object({
    name: z.string().min(1),
    validFrom: z.coerce.date().nullable(),
    validTo: z.coerce.date().nullable(),
    fundingMethod: z.enum(['po_upload', 'online']),
    fundingDocument: z
    .object({
      docType: z.string().optional(),
      docNumber: z.string().optional(),
      fileUrl: z.string().optional(),
      plannedAllocations: z
        .array(
          z.object({
            entityId: objectId,
            amount: z.number().nonnegative(),
          }),
        )
        .optional(),
    })
    .partial()
    .optional(),
  })
  .partial();

export const fundWalletSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional().default(''),
  /** Per-request method for top-ups; online must use Razorpay order endpoint. */
  fundingMethod: z.enum(['po_upload', 'online']).optional(),
  docType: z.string().optional().default(''),
  docNumber: z.string().optional().default(''),
});

export const allocateSchema = z.object({
  allocations: z
    .array(
      z.object({
        entityId: objectId,
        amount: z.number().refine((n) => n !== 0, { message: 'Allocation amount must be non-zero' }),
      }),
    )
    .min(1),
});

export const transferSchema = z.object({
  toWalletId: objectId,
  amount: z.number().positive(),
});

export const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
});

export const walletIdParams = z.object({ id: objectId });
