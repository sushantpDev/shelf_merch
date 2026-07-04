import { z } from 'zod';
import { objectId } from '../users/users.validation.js';

export const createShopSchema = z.object({
  name: z.string().min(1),
  currencyMode: z.enum(['points', 'inr', 'priceless']).optional().default('points'),
  pointsConversionEnabled: z.boolean().optional().default(false),
  logoUrl: z.string().optional().default(''),
  bannerConfig: z.record(z.any()).optional().default({}),
  categories: z.array(z.string().min(1)).optional().default([]),
});

export const updateShopSchema = z
  .object({
    name: z.string().min(1),
    currencyMode: z.enum(['points', 'inr', 'priceless']),
    pointsConversionEnabled: z.boolean(),
    logoUrl: z.string(),
    bannerConfig: z.record(z.any()),
    categories: z.array(z.string().min(1)),
    selectedCatalogProductIds: z.array(objectId).optional(),
  })
  .partial();

export const shopIdParams = z.object({ id: objectId });
