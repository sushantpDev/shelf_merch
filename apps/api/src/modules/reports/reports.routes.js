import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant } from '../../middleware/tenant.middleware.js';
import { platformArea } from '../../middleware/platformAccess.middleware.js';
import * as controller from './reports.controller.js';

// §Gap G — /api/v1/platform/reports/* : reads the precomputed BI snapshots.
export const platformReportsRouter = Router();
platformReportsRouter.use(authenticate, resolveTenant, platformArea('dashboard', 'read'));

platformReportsRouter.get('/summary', asyncHandler(controller.summary));
platformReportsRouter.post('/recompute', asyncHandler(controller.recompute));
