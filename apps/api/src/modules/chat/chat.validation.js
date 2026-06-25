import { z } from 'zod';
import { objectId } from '../users/users.validation.js';
import { CHAT_SESSION_STATUSES } from './chatSession.model.js';

export const nodeIdParam = z.object({
  nodeId: z.string().min(1),
});

export const sessionIdParam = z.object({
  sessionId: z.string().uuid(),
});

export const startSessionSchema = z.object({
  sessionId: z.string().uuid(),
  userId: objectId.optional(),
});

export const advanceSessionSchema = z.object({
  selectedOption: z.object({
    label: z.string().min(1),
    next: z.string().min(1),
  }),
});

export const updateSessionStatusSchema = z.object({
  status: z.enum(CHAT_SESSION_STATUSES),
});
