import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.middleware.js';
import { objectId } from '../users/users.validation.js';
import * as storefrontService from './storefront.service.js';

// Public storefront — no auth. A live shop is browsable by anyone with the link.
const router = Router();

const slugParams = z.object({
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i),
});

router.get(
  '/by-slug/:slug',
  validate({ params: slugParams }),
  asyncHandler(async (req, res) => {
    res.json(await storefrontService.getStorefrontBySlug(req.params.slug));
  }),
);

router.post(
  '/by-slug/:slug/resolve',
  validate({
    params: slugParams,
    body: z.object({ email: z.string().min(3) }),
  }),
  asyncHandler(async (req, res) => {
    res.json(
      await storefrontService.resolveShopRedemption({
        slug: req.params.slug,
        email: req.body.email,
      }),
    );
  }),
);

router.get(
  '/:shopId',
  validate({ params: z.object({ shopId: objectId }) }),
  asyncHandler(async (req, res) => {
    res.json(await storefrontService.getStorefront(req.params.shopId));
  }),
);

export default router;
