import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.middleware.js';
import { objectId } from '../users/users.validation.js';
import * as storefrontService from './storefront.service.js';

// Public storefront — no auth. A live shop is browsable by anyone with the link.
const router = Router();

router.get(
  '/:shopId',
  validate({ params: z.object({ shopId: objectId }) }),
  asyncHandler(async (req, res) => {
    res.json(await storefrontService.getStorefront(req.params.shopId));
  }),
);

export default router;
