import * as paymentsService from './payments.service.js';
import { writeAudit } from '../../services/audit.service.js';

export async function createRazorpayOrder(req, res) {
  const result = await paymentsService.createRazorpayOrder({
    tenantId: req.tenantId,
    userId: req.user.userId,
    walletId: req.body.walletId,
    amountInr: req.body.amount,
    purpose: req.body.purpose,
  });
  writeAudit({
    req,
    action: 'payment.razorpay_order_created',
    entityType: 'Payment',
    entityId: result.paymentId,
    after: { orderId: result.orderId, amount: result.amount },
  });
  res.status(201).json(result);
}

export async function verifyRazorpayPayment(req, res) {
  const result = await paymentsService.verifyWalletPayment({
    tenantId: req.tenantId,
    userId: req.user.userId,
    razorpayOrderId: req.body.razorpay_order_id,
    razorpayPaymentId: req.body.razorpay_payment_id,
    razorpaySignature: req.body.razorpay_signature,
  });
  writeAudit({
    req,
    action: 'payment.razorpay_verified',
    entityType: 'Payment',
    entityId: result.paymentId,
    after: { walletId: result.walletId, amount: result.amount, status: result.status },
  });
  res.json(result);
}

export async function razorpayWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).json({ error: { code: 'MISSING_SIGNATURE', message: 'X-Razorpay-Signature required' } });
  }
  const result = await paymentsService.handleRazorpayWebhook(req.body, signature);
  res.json({ received: true, ...result });
}
