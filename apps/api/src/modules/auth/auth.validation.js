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

/** Personal / consumer inbox domains — work emails only for auth. */
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'gmx.com',
  'yandex.com',
]);

const workEmail = z
  .string()
  .email()
  .refine((value) => {
    const domain = value.trim().toLowerCase().split('@')[1];
    return Boolean(domain) && !PERSONAL_EMAIL_DOMAINS.has(domain);
  }, {
    message: 'Use a work email address. Personal emails like Gmail are not allowed.',
  });

export const loginSchema = z.object({
  email: workEmail,
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(1),
  email: workEmail,
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
