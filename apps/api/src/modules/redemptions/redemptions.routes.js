import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.middleware.js';
import { idempotency } from '../../middleware/idempotency.middleware.js';
import { sendOtpRateLimit, verifyOtpRateLimit } from '../../middleware/rateLimit.middleware.js';
import { objectId } from '../users/users.validation.js';
import { ApiError } from '../../utils/errors.js';
import { Recipient } from '../campaigns/recipient.model.js';
import { requireRedemptionSession } from '../../middleware/redemptionSession.middleware.js';
import * as redemptionsService from './redemptions.service.js';

async function attachRedemptionScope(req, _res, next) {
  const recipient = await Recipient.findOne({ redemptionToken: req.params.token }).setOptions({
    skipTenantGuard: true,
  });
  if (recipient) {
    req.tenantId = recipient.tenantId;
    req.user = { userId: String(recipient._id) };
  }
  next();
}

const router = Router();

const tokenParams = z.object({ token: z.string().min(16) });

router.get(
  '/:token',
  validate({ params: tokenParams }),
  asyncHandler(async (req, res) => {
    try {
      res.json(await redemptionsService.getRedemptionPortal(req.params.token));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_REDEEMED') {
        return res.status(409).json({
          error: { code: err.code, message: err.message },
          orderNumber: err.details?.orderNumber,
          trackUrl: err.details?.trackUrl,
        });
      }
      throw err;
    }
  }),
);

router.post(
  '/:token/send-otp',
  validate({
    params: tokenParams,
    body: z.object({ contact: z.string().min(3) }),
  }),
  sendOtpRateLimit,
  asyncHandler(async (req, res) => {
    res.json(await redemptionsService.sendOtp(req.params.token, req.body));
  }),
);

router.post(
  '/:token/verify-otp',
  validate({
    params: tokenParams,
    body: z.object({ code: z.string().length(6) }),
  }),
  verifyOtpRateLimit,
  asyncHandler(async (req, res) => {
    res.json(await redemptionsService.verifyOtp(req.params.token, req.body));
  }),
);

router.get(
  '/:token/catalog',
  validate({ params: tokenParams }),
  requireRedemptionSession,
  asyncHandler(async (req, res) => {
    res.json(await redemptionsService.getCatalog(req.params.token));
  }),
);

router.get(
  '/:token/kit',
  validate({ params: tokenParams }),
  requireRedemptionSession,
  asyncHandler(async (req, res) => {
    res.json(await redemptionsService.getKitContents(req.params.token));
  }),
);

router.post(
  '/:token/razorpay/order',
  validate({
    params: tokenParams,
    body: z.object({ amountInr: z.number().positive() }),
  }),
  requireRedemptionSession,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await redemptionsService.createRedemptionRazorpayOrder(req.params.token, req.body),
    );
  }),
);

router.post(
  '/:token/submit',
  validate({ params: tokenParams }),
  requireRedemptionSession,
  attachRedemptionScope,
  idempotency({ required: true }),
  validate({
    params: tokenParams,
    body: z.object({
      items: z
        .array(
          z.object({
            productId: objectId,
            variant: z.object({ size: z.string().optional(), color: z.string().optional() }).optional(),
            qty: z.number().int().positive(),
          }),
        )
        .min(1),
      shippingAddress: z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        line1: z.string().min(1),
        line2: z.string().optional().default(''),
        city: z.string().min(1),
        state: z.string().min(1),
        pincode: z.string().min(1),
        country: z.string().optional().default('IN'),
      }),
      paymentMode: z.enum(['points', 'points_upi', 'upi']).optional().default('points'),
      razorpayPayment: z
        .object({
          orderId: z.string().min(1),
          paymentId: z.string().min(1),
          signature: z.string().min(1),
        })
        .optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await redemptionsService.submitRedemption(req.params.token, req.body));
  }),
);

router.get(
  '/:token/orders',
  validate({ params: tokenParams }),
  requireRedemptionSession,
  asyncHandler(async (req, res) => {
    res.json(await redemptionsService.listRedemptionOrders(req.params.token));
  }),
);

router.get(
  '/:token/track',
  validate({ params: tokenParams }),
  asyncHandler(async (req, res) => {
    res.json(await redemptionsService.trackRedemption(req.params.token));
  }),
);

export default router;
