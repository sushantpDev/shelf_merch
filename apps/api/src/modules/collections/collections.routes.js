import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import crypto from 'node:crypto';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext } from '../../middleware/tenant.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { objectId } from '../users/users.validation.js';
import { Collection } from './collection.model.js';
import { Shop } from '../shops/shop.model.js';
import { uploadFile } from '../../services/storage.service.js';
import { writeAudit } from '../../services/audit.service.js';
import { NotFoundError } from '../../utils/errors.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const router = Router();

router.use(authenticate, resolveTenant, requireTenantContext);
const adminOnly = requireRole('company_admin', 'platform_super_admin');
const canRead = requireRole('company_admin', 'entity_manager', 'platform_super_admin');

const productRef = z.object({
  catalogProductId: objectId,
  brand: z.string().optional().default(''),
  name: z.string().min(1),
  group: z.string().optional().default(''),
});

const createSchema = z.object({
  shopId: objectId.optional(),
  name: z.string().min(1),
  productRefs: z.array(productRef).min(1),
  preferredColors: z.array(z.string().min(1)).optional().default([]),
});

router.get(
  '/',
  canRead,
  validate({ query: z.object({ shopId: objectId.optional() }) }),
  asyncHandler(async (req, res) => {
    const filter = { tenantId: req.tenantId, ...(req.query.shopId ? { shopId: req.query.shopId } : {}) };
    res.json(await Collection.find(filter).sort({ createdAt: -1 }));
  }),
);

router.post(
  '/',
  adminOnly,
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    let shopId = null;
    if (req.body.shopId) {
      const shop = await Shop.findOne({ _id: req.body.shopId, tenantId: req.tenantId });
      if (!shop) throw new NotFoundError('Shop not found');
      shopId = shop._id;
    }
    const collection = await Collection.create({
      tenantId: req.tenantId,
      shopId,
      code: `C${crypto.randomInt(100_000_000, 999_999_999)}`,
      name: req.body.name,
      productRefs: req.body.productRefs,
      preferredColors: req.body.preferredColors || [],
      createdBy: req.user.userId,
    });
    writeAudit({ req, action: 'collection.create', entityType: 'Collection', entityId: collection._id, after: collection.toObject() });
    res.status(201).json(collection);
  }),
);

const patchSchema = z.object({
  shopId: objectId.optional(),
});

router.patch(
  '/:id',
  adminOnly,
  validate({ params: z.object({ id: objectId }), body: patchSchema }),
  asyncHandler(async (req, res) => {
    const collection = await Collection.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!collection) throw new NotFoundError('Collection not found');
    if (req.body.shopId) {
      const shop = await Shop.findOne({ _id: req.body.shopId, tenantId: req.tenantId });
      if (!shop) throw new NotFoundError('Shop not found');
      collection.shopId = shop._id;
    }
    await collection.save();
    writeAudit({ req, action: 'collection.update', entityType: 'Collection', entityId: collection._id, after: collection.toObject() });
    res.json(collection);
  }),
);

// §7.6 — artwork upload flips the collection to "ready".
router.post(
  '/:id/artwork',
  adminOnly,
  validate({ params: z.object({ id: objectId }) }),
  upload.single('artwork'),
  asyncHandler(async (req, res) => {
    const collection = await Collection.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!collection) throw new NotFoundError('Collection not found');
    const { url } = await uploadFile({ tenantId: req.tenantId, kind: 'artwork', file: req.file });
    collection.artworkUrl = url;
    collection.status = 'ready';
    await collection.save();
    writeAudit({ req, action: 'collection.artwork', entityType: 'Collection', entityId: collection._id, after: { artworkUrl: url, status: 'ready' } });
    res.json(collection);
  }),
);

export default router;
