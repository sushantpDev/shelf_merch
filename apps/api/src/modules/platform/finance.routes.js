import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, blockDuringImpersonation } from '../../middleware/tenant.middleware.js';
import { platformArea } from '../../middleware/platformAccess.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { idempotency } from '../../middleware/idempotency.middleware.js';
import { objectId } from '../users/users.validation.js';
import { writeAudit } from '../../services/audit.service.js';
import * as financeService from './finance.service.js';

const router = Router();
router.use(authenticate, resolveTenant);

const financeRead = platformArea('finance', 'read');
// §4 / non-negotiable #7 — money writes are blocked during impersonation.
const financeWrite = [platformArea('finance', 'write'), blockDuringImpersonation];

const walletIdParam = z.object({ walletId: objectId });
const idParam = z.object({ id: objectId });

const lineItemSchema = z.object({
  description: z.string().min(1),
  hsnCode: z.string().optional().default(''),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  gstRate: z.number().min(0).max(28).optional().default(18),
});

const reportQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// ---- Funding approvals ----

router.get('/funding-approvals', financeRead, asyncHandler(async (_req, res) => {
  res.json(await financeService.listFundingApprovals());
}));

router.post(
  '/funding-approvals/:walletId/approve',
  ...financeWrite,
  idempotency(),
  validate({ params: walletIdParam, body: z.object({ amount: z.number().positive() }) }),
  asyncHandler(async (req, res) => {
    const { transaction, wallet } = await financeService.approveFunding({
      walletId: req.params.walletId,
      amount: req.body.amount,
      performedBy: req.user.userId,
    });
    writeAudit({
      req,
      action: 'finance.funding_approve',
      entityType: 'Wallet',
      entityId: wallet._id,
      after: { amount: req.body.amount, transactionId: String(transaction._id) },
    });
    res.status(201).json({ transaction, wallet });
  }),
);

router.post(
  '/funding-approvals/:walletId/reject',
  ...financeWrite,
  validate({ params: walletIdParam, body: z.object({ reason: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const { wallet } = await financeService.rejectFunding({
      walletId: req.params.walletId,
      reason: req.body.reason,
    });
    writeAudit({
      req,
      action: 'finance.funding_reject',
      entityType: 'Wallet',
      entityId: wallet._id,
      after: { reason: req.body.reason },
    });
    res.json({ wallet });
  }),
);

// ---- Wallet adjustments ----

router.post(
  '/wallet-adjustments',
  ...financeWrite,
  idempotency(),
  validate({
    body: z.object({
      walletId: objectId,
      amount: z.number().refine((v) => v !== 0, 'Amount cannot be zero'),
      reason: z.string().min(1),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { transaction, wallet } = await financeService.walletAdjustment({
      walletId: req.body.walletId,
      amount: req.body.amount,
      reason: req.body.reason,
      performedBy: req.user.userId,
    });
    writeAudit({
      req,
      action: 'finance.wallet_adjustment',
      entityType: 'Wallet',
      entityId: wallet._id,
      after: { amount: req.body.amount, reason: req.body.reason, transactionId: String(transaction._id) },
    });
    res.status(201).json({ transaction, wallet });
  }),
);

// ---- Invoices & credit notes ----

router.get(
  '/invoices',
  financeRead,
  validate({
    query: z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().optional(),
      tenantId: objectId.optional(),
      type: z.enum(['proforma', 'tax']).optional(),
      status: z.enum(['draft', 'issued', 'paid', 'void']).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    res.json(await financeService.listPlatformInvoices({ query: req.query }));
  }),
);

router.post(
  '/invoices/proforma',
  ...financeWrite,
  validate({
    body: z.object({
      tenantId: objectId,
      lineItems: z.array(lineItemSchema).min(1),
      dueAt: z.coerce.date().optional().nullable(),
      relatedOrderId: objectId.optional().nullable(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const invoice = await financeService.createProformaInvoice(req.body);
    writeAudit({
      req,
      action: 'finance.proforma_create',
      entityType: 'Invoice',
      entityId: invoice._id,
      after: { invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount },
    });
    res.status(201).json(invoice);
  }),
);

router.post(
  '/credit-notes',
  ...financeWrite,
  validate({
    body: z.object({
      invoiceId: objectId,
      amount: z.number().positive(),
      reason: z.string().min(1),
    }),
  }),
  asyncHandler(async (req, res) => {
    const creditNote = await financeService.createCreditNote({
      ...req.body,
      issuedByUserId: req.user.userId,
    });
    writeAudit({
      req,
      action: 'finance.credit_note_create',
      entityType: 'CreditNote',
      entityId: creditNote._id,
      after: { creditNoteNumber: creditNote.creditNoteNumber, amount: creditNote.amount, reason: req.body.reason },
    });
    res.status(201).json(creditNote);
  }),
);

// ---- Payments ----

router.post(
  '/payments/:id/mark-received',
  ...financeWrite,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const payment = await financeService.markPaymentReceived({ paymentId: req.params.id });
    writeAudit({
      req,
      action: 'finance.payment_mark_received',
      entityType: 'Payment',
      entityId: payment._id,
      after: { status: payment.status },
    });
    res.json(payment);
  }),
);

// ---- Outstanding & reports ----

router.get('/outstanding', financeRead, asyncHandler(async (_req, res) => {
  res.json(await financeService.getOutstanding());
}));

router.get('/reports/gmv', financeRead, validate({ query: reportQuery }), asyncHandler(async (req, res) => {
  res.json(await financeService.gmvReport({ query: req.query }));
}));

router.get('/reports/margin', financeRead, validate({ query: reportQuery }), asyncHandler(async (req, res) => {
  res.json(await financeService.marginReport({ query: req.query }));
}));

router.get('/reports/gst-export', financeRead, validate({ query: reportQuery }), asyncHandler(async (req, res) => {
  res.json(await financeService.gstExport({ query: req.query }));
}));

export default router;
