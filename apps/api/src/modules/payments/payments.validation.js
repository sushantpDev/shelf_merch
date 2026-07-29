import { z } from 'zod';
import { objectId } from '../users/users.validation.js';

export const createRazorpayOrderSchema = z.object({
  walletId: objectId,
  amount: z.number().positive(),
  /** wallet_funding = top-up (finance approval). campaign_spend = pay for send via UPI/card. */
  purpose: z.enum(['wallet_funding', 'campaign_spend']).optional().default('wallet_funding'),
});

export const verifyRazorpayPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
