import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as controller from './chat.controller.js';
import {
  nodeIdParam,
  sessionIdParam,
  startSessionSchema,
  advanceSessionSchema,
  updateSessionStatusSchema,
} from './chat.validation.js';

const router = Router();
router.use(authenticate);

router.get(
  '/node/:nodeId',
  validate({ params: nodeIdParam }),
  asyncHandler(controller.getNode),
);

router.post(
  '/session/start',
  validate({ body: startSessionSchema }),
  asyncHandler(controller.startSession),
);

router.post(
  '/session/:sessionId/advance',
  validate({ params: sessionIdParam, body: advanceSessionSchema }),
  asyncHandler(controller.advanceSession),
);

router.patch(
  '/session/:sessionId/status',
  validate({ params: sessionIdParam, body: updateSessionStatusSchema }),
  asyncHandler(controller.updateSessionStatus),
);

router.post(
  '/session/:sessionId/restart',
  validate({ params: sessionIdParam }),
  asyncHandler(controller.restartSession),
);

router.post(
  '/session/:sessionId/handoff',
  validate({ params: sessionIdParam }),
  asyncHandler(controller.handoffSession),
);

export default router;
