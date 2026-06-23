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
import { NotFoundError, ApiError } from '../../utils/errors.js';
import { collectionsForShopFilter } from './collectionQueries.js';

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
  artworkUrl: z.string().optional().default(''),
  isShopSpecific: z.boolean().optional(),
});

router.get(
  '/',
  canRead,
  validate({ query: z.object({ shopId: objectId.optional() }) }),
  asyncHandler(async (req, res) => {
    const filter = {
      tenantId: req.tenantId,
      ...(req.query.shopId
        ? { $or: [{ shopId: req.query.shopId }, { shopIds: req.query.shopId }] }
        : {}),
    };
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
    const artworkUrl = req.body.artworkUrl || '';
    if (shopId && req.body.isShopSpecific && req.body.productRefs?.length) {
      const catalogProductId = req.body.productRefs[0].catalogProductId;
      const duplicate = await Collection.findOne({
        ...collectionsForShopFilter(shopId),
        tenantId: req.tenantId,
        status: { $ne: 'archived' },
        artworkUrl,
        'productRefs.catalogProductId': catalogProductId,
      });
      if (duplicate) {
        throw new ApiError(400, 'This product is already in this shop', 'PRODUCT_ALREADY_IN_SHOP');
      }
    }
    const collection = await Collection.create({
      tenantId: req.tenantId,
      shopId,
      shopIds: shopId ? [shopId] : [],
      code: `C${crypto.randomInt(100_000_000, 999_999_999)}`,
      name: req.body.name,
      productRefs: req.body.productRefs,
      preferredColors: req.body.preferredColors || [],
      artworkUrl,
      status: artworkUrl ? 'ready' : 'draft',
      createdBy: req.user.userId,
      isShopSpecific: req.body.isShopSpecific || false,
    });
    writeAudit({ req, action: 'collection.create', entityType: 'Collection', entityId: collection._id, after: collection.toObject() });
    res.status(201).json(collection);
  }),
);

const patchSchema = z.object({
  shopId: objectId.optional(),
  status: z.enum(['draft', 'ready', 'archived']).optional(),
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
      const shopKey = String(shop._id);
      let nextIds = [...(collection.shopIds || [])];
      const linked = nextIds.map(String);
      if (!linked.length && collection.shopId) nextIds = [collection.shopId];
      if (!nextIds.map(String).includes(shopKey)) nextIds.push(shop._id);
      collection.shopIds = nextIds;
      if (!collection.shopId) collection.shopId = shop._id;
    }
    if (req.body.status) collection.status = req.body.status;
    await collection.save();
    writeAudit({ req, action: 'collection.update', entityType: 'Collection', entityId: collection._id, after: collection.toObject() });
    res.json(collection);
  }),
);

router.post(
  '/:id/archive',
  adminOnly,
  validate({ params: z.object({ id: objectId }) }),
  asyncHandler(async (req, res) => {
    const collection = await Collection.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!collection) throw new NotFoundError('Collection not found');
    collection.status = 'archived';
    await collection.save();
    writeAudit({ req, action: 'collection.archive', entityType: 'Collection', entityId: collection._id, after: { status: 'archived' } });
    res.json(collection);
  }),
);

router.post(
  '/:id/restore',
  adminOnly,
  validate({ params: z.object({ id: objectId }) }),
  asyncHandler(async (req, res) => {
    const collection = await Collection.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!collection) throw new NotFoundError('Collection not found');
    collection.status = collection.artworkUrl ? 'ready' : 'draft';
    await collection.save();
    writeAudit({ req, action: 'collection.restore', entityType: 'Collection', entityId: collection._id, after: { status: collection.status } });
    res.json(collection);
  }),
);

router.delete(
  '/:id',
  adminOnly,
  validate({ params: z.object({ id: objectId }) }),
  asyncHandler(async (req, res) => {
    const collection = await Collection.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!collection) throw new NotFoundError('Collection not found');
    await collection.softDelete();
    writeAudit({ req, action: 'collection.delete', entityType: 'Collection', entityId: collection._id });
    res.status(204).send();
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

const mockupMetaItem = z.object({
  catalogProductId: objectId,
});

// Upload pre-baked product mockups (one PNG per catalog product in the collection).
router.post(
  '/:id/mockups',
  adminOnly,
  validate({ params: z.object({ id: objectId }) }),
  upload.array('mockups', 50),
  asyncHandler(async (req, res) => {
    const collection = await Collection.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!collection) throw new NotFoundError('Collection not found');
    const files = req.files || [];
    let meta;
    try {
      meta = mockupMetaItem.array().parse(JSON.parse(req.body.meta || '[]'));
    } catch {
      throw new ApiError(400, 'Invalid mockup metadata', 'MOCKUP_META_INVALID');
    }
    if (meta.length !== files.length) {
      throw new ApiError(400, 'Mockup file count does not match metadata', 'MOCKUP_COUNT_MISMATCH');
    }
    for (let i = 0; i < files.length; i++) {
      const { catalogProductId } = meta[i];
      const { url } = await uploadFile({ tenantId: req.tenantId, kind: 'mockup', file: files[i] });
      const ref = collection.productRefs.find(
        (r) => String(r.catalogProductId) === String(catalogProductId),
      );
      if (ref) ref.mockupUrl = url;
    }
    collection.markModified('productRefs');
    await collection.save();
    writeAudit({
      req,
      action: 'collection.mockups',
      entityType: 'Collection',
      entityId: collection._id,
      after: { mockupCount: files.length },
    });
    res.json(collection);
  }),
);

export default router;
