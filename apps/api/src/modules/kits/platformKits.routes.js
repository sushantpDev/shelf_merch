import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant } from '../../middleware/tenant.middleware.js';
import { platformArea } from '../../middleware/platformAccess.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { objectId } from '../users/users.validation.js';
import { writeAudit } from '../../services/audit.service.js';
import { ApiError, NotFoundError } from '../../utils/errors.js';
import { PlatformKit } from './platformKit.model.js';
import { CatalogProduct } from '../catalog/catalogProduct.model.js';

const idParam = z.object({ id: objectId });

const kitItemSchema = z.object({
  catalogProductId: objectId,
  variantSku: z.string().optional().default(''),
  qty: z.number().int().positive().optional().default(1),
});

const createKitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  packaging: z.enum(['none', 'box', 'premium_box']).optional().default('box'),
  eligibleCampaignTypes: z.array(z.string()).optional().default([]),
  approxValueInr: z.number().nonnegative().optional().default(0),
  imageUrls: z.array(z.string()).optional().default([]),
});

async function getKit(id) {
  const kit = await PlatformKit.findById(id);
  if (!kit) throw new NotFoundError('Kit not found');
  return kit;
}

export const platformKitsRouter = Router();
platformKitsRouter.use(authenticate, resolveTenant);

const kitsRead = platformArea('kits', 'read');
const kitsWrite = platformArea('kits', 'write');

platformKitsRouter.get(
  '/',
  kitsRead,
  asyncHandler(async (req, res) => {
    const filter = req.query.status ? { status: req.query.status } : {};
    res.json(await PlatformKit.find(filter).sort({ createdAt: -1 }));
  }),
);

platformKitsRouter.get(
  '/:id',
  kitsRead,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => res.json(await getKit(req.params.id))),
);

platformKitsRouter.post(
  '/',
  kitsWrite,
  validate({ body: createKitSchema }),
  asyncHandler(async (req, res) => {
    const kit = await PlatformKit.create(req.body);
    writeAudit({ req, action: 'kit.create', entityType: 'PlatformKit', entityId: kit._id, after: { name: kit.name } });
    res.status(201).json(kit);
  }),
);

platformKitsRouter.patch(
  '/:id',
  kitsWrite,
  validate({ params: idParam, body: createKitSchema.partial().extend({ status: z.enum(['draft', 'archived']).optional() }) }),
  asyncHandler(async (req, res) => {
    const kit = await getKit(req.params.id);
    const before = kit.toObject();
    Object.assign(kit, req.body);
    await kit.save();
    writeAudit({ req, action: 'kit.update', entityType: 'PlatformKit', entityId: kit._id, before: { name: before.name, status: before.status }, after: req.body });
    res.json(kit);
  }),
);

platformKitsRouter.post(
  '/:id/items',
  kitsWrite,
  validate({ params: idParam, body: kitItemSchema }),
  asyncHandler(async (req, res) => {
    const kit = await getKit(req.params.id);
    const product = await CatalogProduct.findById(req.body.catalogProductId);
    if (!product) throw new NotFoundError('Catalog product not found');
    kit.items.push(req.body);
    await kit.save();
    writeAudit({ req, action: 'kit.item_add', entityType: 'PlatformKit', entityId: kit._id, after: req.body });
    res.status(201).json(kit.items);
  }),
);

platformKitsRouter.delete(
  '/:id/items/:itemId',
  kitsWrite,
  validate({ params: z.object({ id: objectId, itemId: objectId }) }),
  asyncHandler(async (req, res) => {
    const kit = await getKit(req.params.id);
    const item = kit.items.id(req.params.itemId);
    if (!item) throw new NotFoundError('Kit item not found');
    item.deleteOne();
    await kit.save();
    writeAudit({ req, action: 'kit.item_remove', entityType: 'PlatformKit', entityId: kit._id, after: { itemId: req.params.itemId } });
    res.json(kit.items);
  }),
);

platformKitsRouter.post(
  '/:id/publish',
  kitsWrite,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const kit = await getKit(req.params.id);
    if (!kit.items.length) {
      throw new ApiError(422, 'A kit needs at least one item before publishing', 'KIT_EMPTY');
    }
    kit.status = 'active';
    await kit.save();
    writeAudit({ req, action: 'kit.publish', entityType: 'PlatformKit', entityId: kit._id });
    res.json(kit);
  }),
);
