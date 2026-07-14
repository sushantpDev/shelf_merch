import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const processEnv = { ...process.env };
if (processEnv.MONGO_URL && !processEnv.MONGODB_URI) {
  processEnv.MONGODB_URI = processEnv.MONGO_URL;
}

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const requiredSecret = (devDefault) =>
  isProd ? z.string().min(16) : z.string().min(1).default(devDefault);

const mongoUriSchema = isTest
  ? z.string().optional().default('')
  : z.string().min(1, 'Set MONGO_URL or MONGODB_URI to your MongoDB Atlas connection string');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** Bind address — use 0.0.0.0 in production so the VPS IP is reachable. */
  HOST: z.string().default(isProd ? '0.0.0.0' : '0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(isProd ? 8080 : 4000),
  /**
   * Number of trusted reverse-proxy hops in front of the app (Express `trust
   * proxy`). Behind the HAProxy LB = 1; behind Cloudflare → HAProxy = 2. Only
   * trusted hops may set `X-Forwarded-For`, so this must match the real topology
   * or per-IP rate limits can be spoofed.
   */
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  MONGODB_URI: mongoUriSchema,
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // §Gap F — observability. LOG_LEVEL tunes pino; SENTRY_DSN /
  // OTEL_EXPORTER_OTLP_ENDPOINT activate error reporting + tracing when their
  // (optional) packages are installed. Empty = disabled.
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  SENTRY_DSN: z.string().optional().default(''),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional().default(''),

  JWT_ACCESS_SECRET: requiredSecret('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: requiredSecret('dev-refresh-secret-change-me'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  R2_ENDPOINT: z.string().optional().default(''),
  R2_ACCESS_KEY: z.string().optional().default(''),
  R2_SECRET_KEY: z.string().optional().default(''),
  R2_BUCKET: z.string().optional().default('shelfmerch-assets'),

  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  AWS_REGION: z.string().optional().default(''),
  S3_BUCKET_NAME: z.string().optional().default(''),
  /** Optional CDN or custom domain base, e.g. https://shelfmerch.io */
  S3_PUBLIC_BASE_URL: z.string().optional().default(''),
  /** auto = R2 → S3 → local; override with local while fixing IAM */
  STORAGE_DRIVER: z.enum(['auto', 'local', 's3', 'r2']).default('auto'),

  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),

  MSG91_AUTH_KEY: z.string().optional().default(''),
  MSG91_SENDER_ID: z.string().optional().default('SLFMRH'),
  MSG91_OTP_TEMPLATE_ID: z.string().optional().default(''),

  EMAIL_PROVIDER_API_KEY: z.string().optional().default(''),
  EMAIL_SERVICE: z.string().optional().default('gmail'),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_PASSWORD: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default(''),
  APP_URL: z.string().optional().default('http://localhost:8080'),
  /**
   * Comma-separated allowed CORS origins in production (e.g. http://72.62.76.198:8080).
   * Empty no longer means "allow all" — cross-origin requests are refused unless the
   * Origin is listed or matches the request Host (see resolveCorsOptions).
   */
  CORS_ORIGINS: z.string().optional().default(''),

  /**
   * Content-Security-Policy mode for the production SPA + API:
   *   report-only (default) — send CSP as report-only so a misconfigured policy
   *     can't break the app; validate in staging, then switch to enforce.
   *   enforce — send an enforcing Content-Security-Policy.
   *   off — no CSP header (not recommended).
   */
  CSP_MODE: z.enum(['enforce', 'report-only', 'off']).default('report-only'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().optional().default(''),
  BASE_URL: z.string().optional().default(''),
  /** SPA route that receives tokens after Google OAuth (hash fragment). */
  CLIENT_URL: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(processEnv);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = () =>
  env.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

export const razorpayConfigured = () =>
  Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_WEBHOOK_SECRET);

export const msg91Configured = () =>
  Boolean(env.MSG91_AUTH_KEY && env.MSG91_OTP_TEMPLATE_ID);

export const emailConfigured = () => Boolean(env.EMAIL_USER && env.EMAIL_PASSWORD);

export const googleAuthConfigured = () =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const googleCallbackUrl = () => {
  if (env.GOOGLE_CALLBACK_URL) return env.GOOGLE_CALLBACK_URL.replace(/\/$/, '');
  const base = (env.BASE_URL || env.APP_URL).replace(/\/$/, '');
  return `${base}/api/v1/auth/google/callback`;
};

export const googleClientUrl = () => {
  if (env.CLIENT_URL) return env.CLIENT_URL.replace(/\/$/, '');
  const base = (env.BASE_URL || env.APP_URL).replace(/\/$/, '');
  return `${base}/auth/google`;
};

export const s3Configured = () =>
  Boolean(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_REGION && env.S3_BUCKET_NAME);
