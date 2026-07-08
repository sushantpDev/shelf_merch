import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext } from '../../middleware/tenant.middleware.js';
import { tenantArea } from '../../middleware/tenantAccess.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { objectId } from '../users/users.validation.js';
import { Kit } from './kit.model.js';
import { uploadFile } from '../../services/storage.service.js';
import { writeAudit } from '../../services/audit.service.js';
import { NotFoundError } from '../../utils/errors.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const router = Router();

router.use(authenticate, resolveTenant, requireTenantContext);
const canWrite = tenantArea('kits', 'write');
const canRead = tenantArea('kits', 'read');

const productRef = z.object({
  catalogProductId: objectId,
  brand: z.string().optional().default(''),
  name: z.string().min(1),
  group: z.string().optional().default(''),
});

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  productRefs: z.array(productRef).min(1),
  designNotes: z.string().optional().default(''),
  packaging: z.enum(['none', 'box']).optional().default('none'),
  status: z.enum(['draft', 'live', 'archived']).optional().default('draft'),
});

const updateSchema = createSchema.partial();

router.get(
  '/',
  canRead,
  asyncHandler(async (req, res) => {
    res.json(await Kit.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }));
  }),
);

router.post(
  '/',
  canWrite,
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const kit = await Kit.create({ tenantId: req.tenantId, ...req.body });
    writeAudit({ req, action: 'kit.create', entityType: 'Kit', entityId: kit._id, after: kit.toObject() });
    res.status(201).json(kit);
  }),
);

router.patch(
  '/:id',
  canWrite,
  validate({ params: z.object({ id: objectId }), body: updateSchema }),
  asyncHandler(async (req, res) => {
    const kit = await Kit.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!kit) throw new NotFoundError('Kit not found');
    const before = kit.toObject();
    Object.assign(kit, req.body);
    await kit.save();
    writeAudit({ req, action: 'kit.update', entityType: 'Kit', entityId: kit._id, before, after: kit.toObject() });
    res.json(kit);
  }),
);

router.post(
  '/:id/artwork',
  canWrite,
  validate({ params: z.object({ id: objectId }) }),
  upload.single('artwork'),
  asyncHandler(async (req, res) => {
    const kit = await Kit.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!kit) throw new NotFoundError('Kit not found');
    const { url } = await uploadFile({ tenantId: req.tenantId, kind: 'artwork', file: req.file });
    kit.artworkUrl = url;
    await kit.save();
    writeAudit({ req, action: 'kit.artwork', entityType: 'Kit', entityId: kit._id, after: { artworkUrl: url } });
    res.json(kit);
  }),
);

export default router;
