import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.middleware.js';
import { objectId } from '../users/users.validation.js';
import { strongPassword, resetPasswordPolicy } from '../auth/auth.validation.js';
import { requireShopCustomer } from '../../middleware/shopAuth.middleware.js';
import {
  loginRateLimit,
  forgotPasswordRateLimit,
  resetPasswordRateLimit,
  signupStartRateLimit,
  signupVerifyRateLimit,
  signupResendRateLimit,
} from '../../middleware/rateLimit.middleware.js';
import * as shopAuth from './shopAuth.service.js';

const router = Router({ mergeParams: true });

const shopParams = z.object({ shopId: objectId });

const startBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: strongPassword,
});

const resendBody = z.object({
  pendingId: z.string().uuid(),
});

const verifyBody = z.object({
  pendingId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const claimBody = z.object({
  token: z.string().min(8),
  password: z.string().min(8).optional(),
});

const forgotBody = z.object({
  email: z.string().email(),
});

const resetBody = z.object({
  token: z.string().min(1),
  newPassword: resetPasswordPolicy,
});

router.post(
  '/signup/start',
  validate({ params: shopParams, body: startBody }),
  signupStartRateLimit,
  asyncHandler(async (req, res) => {
    res.json(
      await shopAuth.startShopSignup({
        shopId: req.params.shopId,
        ...req.body,
        ip: req.ip,
      }),
    );
  }),
);

router.post(
  '/signup/resend',
  validate({ params: shopParams, body: resendBody }),
  signupResendRateLimit,
  asyncHandler(async (req, res) => {
    res.json(
      await shopAuth.resendShopSignupOtp({
        shopId: req.params.shopId,
        pendingId: req.body.pendingId,
      }),
    );
  }),
);

router.post(
  '/signup/verify',
  validate({ params: shopParams, body: verifyBody }),
  signupVerifyRateLimit,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await shopAuth.verifyShopSignupOtp({
        shopId: req.params.shopId,
        pendingId: req.body.pendingId,
        otp: req.body.otp,
      }),
    );
  }),
);

router.post(
  '/login',
  validate({ params: shopParams, body: loginBody }),
  loginRateLimit,
  asyncHandler(async (req, res) => {
    res.json(
      await shopAuth.loginShopCustomer({
        shopId: req.params.shopId,
        email: req.body.email,
        password: req.body.password,
      }),
    );
  }),
);

router.get(
  '/me',
  validate({ params: shopParams }),
  requireShopCustomer,
  asyncHandler(async (req, res) => {
    res.json(
      await shopAuth.getShopCustomerSession({
        shopId: req.params.shopId,
        customerId: req.shopCustomer.customerId,
      }),
    );
  }),
);

router.post(
  '/forgot-password',
  validate({ params: shopParams, body: forgotBody }),
  forgotPasswordRateLimit,
  asyncHandler(async (req, res) => {
    await shopAuth.forgotShopPassword({
      shopId: req.params.shopId,
      email: req.body.email,
    });
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  }),
);

/** Shop-agnostic claim via redeem token (shop resolved from campaign). */
export const claimRedeemRouter = Router();
claimRedeemRouter.post(
  '/claim-redeem',
  validate({ body: claimBody }),
  asyncHandler(async (req, res) => {
    res.json(
      await shopAuth.claimRedeemShopAccount({
        token: req.body.token,
        password: req.body.password,
      }),
    );
  }),
);

claimRedeemRouter.post(
  '/reset-password',
  validate({ body: resetBody }),
  resetPasswordRateLimit,
  asyncHandler(async (req, res) => {
    res.json(await shopAuth.resetShopPassword(req.body));
  }),
);

export default router;
