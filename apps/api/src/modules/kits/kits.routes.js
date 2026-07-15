import { Router } from 'express';
import { z } from 'zod';
import { uploader, DOCUMENT_TYPES } from '../../middleware/upload.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenantContext } from '../../middleware/tenant.middleware.js';
import { tenantArea } from '../../middleware/tenantAccess.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { objectId } from '../users/users.validation.js';
import { Kit } from './kit.model.js';
import { PlatformKit } from './platformKit.model.js';
import { CatalogProduct } from '../catalog/catalogProduct.model.js';
import { uploadFile } from '../../services/storage.service.js';
import { writeAudit } from '../../services/audit.service.js';
import { ApiError, NotFoundError } from '../../utils/errors.js';

const upload = uploader({ allow: DOCUMENT_TYPES, maxSizeMb: 25 });
const router = Router();

router.use(authenticate, resolveTenant, requireTenantContext);
const canWrite = tenantArea('kits', 'write');
const canRead = tenantArea('kits', 'read');
/** Clone a curated platform kit into the tenant workspace for send — ops only. */
const canOperate = tenantArea('campaignOps', 'write');

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

function parseCuratedMeta(designNotes) {
  try {
    if (!designNotes) return null;
    const parsed = JSON.parse(designNotes);
    if (parsed && parsed.curated) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

router.get(
  '/',
  canRead,
  asyncHandler(async (req, res) => {
    res.json(await Kit.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }));
  }),
);

/**
 * Ensure a tenant-scoped clone of a platform curated kit exists for sending.
 * Reuses an existing curated clone when present. Allowed for campaignOps write
 * (entity_manager + super) without granting general kits write.
 *
 * Body may include productRefs resolved from the tenant catalog (preferred).
 * Falls back to platform kit items / active catalog products when needed.
 */
router.post(
  '/from-platform/:platformKitId',
  canOperate,
  validate({
    params: z.object({ platformKitId: objectId }),
    body: z
      .object({
        productRefs: z.array(productRef).min(1).optional(),
      })
      .optional(),
  }),
  asyncHandler(async (req, res) => {
    const platformKitId = String(req.params.platformKitId);
    const existing = await Kit.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    const reuse = existing.find((k) => {
      const meta = parseCuratedMeta(k.designNotes);
      return meta && String(meta.originalId) === platformKitId;
    });
    if (reuse) {
      return res.json(reuse);
    }

    const platformKit = await PlatformKit.findOne({ _id: platformKitId, status: 'active' });
    if (!platformKit) throw new NotFoundError('Curated kit not found');

    let productRefs = Array.isArray(req.body?.productRefs) ? [...req.body.productRefs] : [];

    if (productRefs.length === 0) {
      const catalogIds = (platformKit.items || [])
        .map((item) => item.catalogProductId)
        .filter(Boolean);
      const products = catalogIds.length
        ? await CatalogProduct.find({ _id: { $in: catalogIds } }).lean()
        : [];
      const byId = new Map(products.map((p) => [String(p._id), p]));

      for (const item of platformKit.items || []) {
        const pid = item.catalogProductId;
        if (!pid) continue;
        const product = byId.get(String(pid));
        productRefs.push({
          catalogProductId: pid,
          brand: product?.brand || '',
          name: product?.name || 'Product',
          group: product?.category || product?.group || '',
        });
      }
    }

    // Shopify-imported curated kits often have empty `items`. Fall back to
    // active catalog products so Send still works (mirrors prior frontend behaviour).
    if (productRefs.length === 0) {
      const fallbackCount = Math.max(1, (platformKit.imageUrls?.length || 1) - 1 || 1);
      const fallbackProducts = await CatalogProduct.find({ status: 'active' })
        .sort({ name: 1 })
        .limit(fallbackCount)
        .lean();
      productRefs = fallbackProducts.map((product) => ({
        catalogProductId: product._id,
        brand: product.brand || '',
        name: product.name || 'Product',
        group: product.category || product.group || '',
      }));
    }

    if (productRefs.length === 0) {
      throw new ApiError(
        422,
        'Curated kit has no resolvable catalog products. Add products to the catalog first.',
        'EMPTY_CURATED_KIT',
      );
    }

    const designNotes = JSON.stringify({
      curated: true,
      originalId: platformKitId,
      description: platformKit.description || '',
      imageUrls: platformKit.imageUrls || [],
    });

    const kit = await Kit.create({
      tenantId: req.tenantId,
      name: platformKit.name,
      description: platformKit.description || '',
      productRefs,
      packaging: platformKit.packaging === 'none' ? 'none' : 'box',
      designNotes,
      status: 'live',
      artworkUrl: platformKit.imageUrls?.[0] || '',
    });

    writeAudit({
      req,
      action: 'kit.clone_curated',
      entityType: 'Kit',
      entityId: kit._id,
      after: kit.toObject(),
    });
    res.status(201).json(kit);
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
