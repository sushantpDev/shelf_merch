import { z } from 'zod';
import { objectId } from '../users/users.validation.js';

export const createRazorpayOrderSchema = z.object({
  walletId: objectId,
  amount: z.number().positive(),
});

export const verifyRazorpayPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
