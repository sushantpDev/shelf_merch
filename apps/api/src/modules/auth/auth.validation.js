import { z } from 'zod';

/**
 * §security hardening B2 — shared credential policy for set-password flows
 * (register, reset, invite acceptance). Login itself keeps min(1) so existing
 * accounts can still authenticate.
 */
export const strongPassword = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
    message: 'Password must include at least one letter and one number',
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: strongPassword,
  companyName: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
  everywhere: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: strongPassword,
});
