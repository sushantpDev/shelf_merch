import { z } from 'zod';
import { objectId } from '../users/users.validation.js';
import { ORDER_STATUSES } from '../orders/order.model.js';
import { PRODUCTION_TASK_STATUSES } from './productionTask.model.js';
import { PLATFORM_ROLES } from '../roles/roleAssignment.model.js';

export const listPlatformOrdersQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  tenantId: objectId.optional(),
  vendorId: objectId.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const orderIdParam = z.object({ id: objectId });

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().optional().default(''),
});

export const assignVendorSchema = z.object({
  vendorId: objectId,
});

export const orderNoteSchema = z.object({
  body: z.string().min(1),
});

export const orderMockupSchema = z.object({
  url: z.string().min(1),
});

export const replacementSchema = z.object({
  reason: z.string().min(1),
});

export const createProductionTaskSchema = z.object({
  orderId: objectId,
  assignedTo: z.string().optional().default(''),
  expectedDispatchAt: z.coerce.date().optional().nullable(),
});

export const listProductionTasksQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(PRODUCTION_TASK_STATUSES).optional(),
  tenantId: objectId.optional(),
  assignedTo: z.string().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(PRODUCTION_TASK_STATUSES),
  note: z.string().optional().default(''),
});

export const qcSchema = z.object({
  passed: z.boolean(),
  reason: z.string().optional().default(''),
  photoUrl: z.string().optional().default(''),
});

export const updateTaskSchema = z.object({
  assignedTo: z.string().optional(),
  expectedDispatchAt: z.coerce.date().optional().nullable(),
  mockupUrl: z.string().optional(),
  productionSheetUrl: z.string().optional(),
  qcPhotoUrl: z.string().optional(),
  note: z.string().optional(),
});

export const listAuditLogsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  tenantId: objectId.optional(),
  actorUserId: objectId.optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const inviteTeamSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(PLATFORM_ROLES),
});

export const changeTeamRoleSchema = z.object({
  role: z.enum(PLATFORM_ROLES),
});

export const teamUserIdParam = z.object({ userId: objectId });

export const settingKeyParam = z.object({ key: z.string().min(1) });

export const putSettingSchema = z.object({
  value: z.any(),
});
