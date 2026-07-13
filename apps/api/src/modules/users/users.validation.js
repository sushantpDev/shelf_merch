import { z } from 'zod';
import { strongPassword } from '../auth/auth.validation.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const inviteUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(''),
  role: z.enum(['company_admin', 'entity_manager']),
  scopeType: z.enum(['tenant', 'entity']).optional().default('tenant'),
  scopeId: objectId.nullable().optional().default(null),
  assignedEntityIds: z.array(objectId).optional().default([]),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: strongPassword,
});

export const changeRoleSchema = z.object({
  role: z.enum(['company_admin', 'entity_manager']),
  scopeType: z.enum(['tenant', 'entity']),
  scopeId: objectId.nullable().optional().default(null),
  assignedEntityIds: z.array(objectId).optional().default([]),
});
