import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  forgotPasswordRateLimit,
  loginRateLimit,
  registerRateLimit,
  resetPasswordRateLimit,
  signupResendRateLimit,
  signupStartRateLimit,
  signupVerifyRateLimit,
} from '../../middleware/rateLimit.middleware.js';
import * as controller from './auth.controller.js';
import {
  loginSchema,
  registerSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateResetTokenSchema,
  startSignupSchema,
  resendSignupOtpSchema,
  verifySignupOtpSchema,
} from './auth.validation.js';

const router = Router();

router.post('/register', validate({ body: registerSchema }), registerRateLimit, asyncHandler(controller.register));
router.post(
  '/signup/start',
  validate({ body: startSignupSchema }),
  signupStartRateLimit,
  asyncHandler(controller.startSignup),
);
router.post(
  '/signup/resend',
  validate({ body: resendSignupOtpSchema }),
  signupResendRateLimit,
  asyncHandler(controller.resendSignupOtp),
);
router.post(
  '/signup/verify',
  validate({ body: verifySignupOtpSchema }),
  signupVerifyRateLimit,
  asyncHandler(controller.verifySignupOtp),
);
router.post('/login', validate({ body: loginSchema }), loginRateLimit, asyncHandler(controller.login));
router.post('/refresh', validate({ body: refreshSchema }), asyncHandler(controller.refresh));
router.post('/logout', validate({ body: logoutSchema }), asyncHandler(controller.logout));
router.post(
  '/forgot-password',
  validate({ body: forgotPasswordSchema }),
  forgotPasswordRateLimit,
  asyncHandler(controller.forgotPassword),
);
router.get(
  '/reset-password/validate',
  validate({ query: validateResetTokenSchema }),
  asyncHandler(controller.validateResetToken),
);
router.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  resetPasswordRateLimit,
  asyncHandler(controller.resetPassword),
);

router.get('/google', asyncHandler(controller.googleStart));
router.get('/google/callback', asyncHandler(controller.googleCallback));

export default router;
