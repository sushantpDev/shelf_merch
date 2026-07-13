import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { pinoHttp } from 'pino-http';
import { logger } from './config/logger.js';
import { existsSync } from 'node:fs';
import { env, corsOrigins } from './config/env.js';
import { ensureRedisReady } from './config/redis.js';
import { LOCAL_UPLOAD_DIR } from './services/storage.service.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { sanitizeMongoInput } from './middleware/sanitize.middleware.js';
import { globalHttpRateLimit } from './middleware/globalRateLimit.middleware.js';
import { razorpayWebhook } from './modules/payments/payments.controller.js';

import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import {
  tenantsRouter,
  platformTenantsRouter,
} from './modules/tenants/tenants.routes.js';
import walletsRoutes from './modules/wallets/wallets.routes.js';
import entitiesRoutes from './modules/entities/entities.routes.js';
import shopsRoutes from './modules/shops/shops.routes.js';
import catalogRoutes from './modules/catalog/catalog.routes.js';
import collectionsRoutes from './modules/collections/collections.routes.js';
import kitsRoutes from './modules/kits/kits.routes.js';
import contactsRoutes from './modules/contacts/contacts.routes.js';
import campaignsRoutes from './modules/campaigns/campaigns.routes.js';
import redemptionsRoutes from './modules/redemptions/redemptions.routes.js';
import storefrontRoutes from './modules/storefront/storefront.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import invoicesRoutes from './modules/invoices/invoices.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import vendorsRoutes from './modules/vendors/vendors.routes.js';
import shipmentsRoutes from './modules/shipments/shipments.routes.js';
import { tenantSupportRouter, platformSupportRouter } from './modules/support/support.routes.js';
import {
  platformDashboardRouter,
  platformOrdersRouter,
  platformProductionRouter,
  platformAuditRouter,
  platformImpersonateRouter,
  platformTeamRouter,
  platformSettingsRouter,
} from './modules/platform/platform.routes.js';
import platformFinanceRoutes from './modules/platform/finance.routes.js';
import {
  platformProductsRouter,
  platformCategoriesRouter,
  platformInventoryRouter,
} from './modules/catalog/platformCatalog.routes.js';
import { platformKitsRouter } from './modules/kits/platformKits.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST = path.resolve(__dirname, '../../web/dist');

function isSameHostOrigin(origin, hostHeader) {
  if (!origin || !hostHeader) return false;
  try {
    return new URL(origin).host === hostHeader.split(',')[0].trim();
  } catch {
    return false;
  }
}

function resolveCorsOptions(req) {
  if (env.NODE_ENV !== 'production') {
    return { origin: true, credentials: true };
  }
  // Fail closed: an unset CORS_ORIGINS must NOT mean "allow every origin with
  // credentials". Same-origin (unified server) and non-browser requests send no
  // Origin header and are still allowed; cross-origin requests are only allowed
  // when explicitly listed or when the Origin matches the request Host.
  const origins = corsOrigins();
  return {
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) return callback(null, true);
      // Vite emits crossorigin on /assets/*; browsers send Origin even for same-host
      // document loads. Allow when Origin matches the request Host (e.g. shelfmerch.io).
      if (req && isSameHostOrigin(origin, req.headers.host)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  };
}

/**
 * §security hardening A4 — production Content-Security-Policy. The SPA is served
 * same-origin as the API, so 'self' covers scripts/XHR; images may come from
 * R2/S3/data URIs. Defaults to report-only (env.CSP_MODE) so a wrong directive
 * can't white-screen the app on first deploy — flip CSP_MODE=enforce once
 * validated in staging.
 */
function helmetOptions() {
  if (env.NODE_ENV !== 'production') return undefined;
  if (env.CSP_MODE === 'off') return { contentSecurityPolicy: false };

  return {
    contentSecurityPolicy: {
      useDefaults: true,
      reportOnly: env.CSP_MODE === 'report-only',
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // Vite/React inject hashed style tags at runtime; allow inline styles.
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  };
}

export function createApp() {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet(helmetOptions()));
  app.use((req, res, next) => cors(resolveCorsOptions(req))(req, res, next));

  // §9.3 — Razorpay webhook must verify signature against the raw body.
  app.post(
    '/api/v1/payments/razorpay/webhook',
    express.raw({ type: 'application/json' }),
    asyncHandler(razorpayWebhook),
  );

  app.use(express.json({ limit: '1mb' }));
  // Defence-in-depth against NoSQL operator injection on every parsed request.
  app.use(sanitizeMongoInput);
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url.includes('/health') } }));
  }

  // Serve user uploads defused: never sniff the content type, sandbox any
  // markup, and force download for non-image types so an uploaded file can't
  // execute script on the app origin (stored XSS).
  app.use(
    '/uploads',
    express.static(LOCAL_UPLOAD_DIR, {
      setHeaders(res, filePath) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
        const ext = path.extname(filePath).toLowerCase();
        if (!['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
          res.setHeader('Content-Disposition', 'attachment');
        }
      },
    }),
  );

  const api = express.Router();

  // Liveness: the process is up and the event loop responds. Used by the
  // orchestrator to decide whether to restart the container — must NOT depend on
  // Mongo/Redis, or a data blip would kill otherwise-healthy replicas.
  api.get('/health/live', (_req, res) => {
    res.status(200).json({ status: 'live', uptimeSec: Math.round(process.uptime()) });
  });

  // Readiness: this replica can serve traffic. The load balancer gates on this —
  // 503 pulls the replica out of rotation until Mongo AND Redis are reachable.
  api.get('/health/ready', async (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    const redisOk = await ensureRedisReady(2_000);
    const ready = mongoOk && redisOk;
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not-ready',
      mongo: mongoOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'down',
      uptimeSec: Math.round(process.uptime()),
    });
  });

  // Back-compat combined health check.
  api.get('/health', async (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    const redisOk = await ensureRedisReady(2_000);
    res.status(mongoOk ? 200 : 503).json({
      status: mongoOk && redisOk ? 'ok' : mongoOk ? 'degraded' : 'down',
      mongo: mongoOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'down',
      uptimeSec: Math.round(process.uptime()),
    });
  });

  // Coarse per-IP ceiling across the whole API (health excluded above), as
  // defence-in-depth in front of the fine-grained per-identity limits layered on
  // auth/OTP routes. Backed by Redis so the ceiling is shared across replicas.
  api.use(globalHttpRateLimit);

  api.use('/auth', authRoutes);
  api.use('/media', mediaRoutes);
  api.use('/users', usersRoutes);
  api.use('/tenants', tenantsRouter);
  api.use('/platform/tenants', platformTenantsRouter);
  api.use('/wallets', walletsRoutes);
  api.use('/entities', entitiesRoutes);
  api.use('/shops', shopsRoutes);
  api.use('/catalog', catalogRoutes);
  api.use('/collections', collectionsRoutes);
  api.use('/kits', kitsRoutes);
  api.use('/contacts', contactsRoutes);
  api.use('/campaigns', campaignsRoutes);
  api.use('/redemptions', redemptionsRoutes);
  api.use('/storefront', storefrontRoutes);
  api.use('/notifications', notificationsRoutes);
  api.use('/payments', paymentsRoutes);
  api.use('/invoices', invoicesRoutes);
  api.use('/orders', ordersRoutes);
  api.use('/support-tickets', tenantSupportRouter);
  api.use('/chat', chatRoutes);
  // Platform control plane (SUPER_ADMIN_FLOW) — /api/v1/platform/*
  api.use('/platform/dashboard', platformDashboardRouter);
  api.use('/platform/products', platformProductsRouter);
  api.use('/platform/categories', platformCategoriesRouter);
  api.use('/platform/inventory', platformInventoryRouter);
  api.use('/platform/kits', platformKitsRouter);
  api.use('/platform/vendors', vendorsRoutes);
  api.use('/platform/shipments', shipmentsRoutes);
  api.use('/platform/orders', platformOrdersRouter);
  api.use('/platform/production', platformProductionRouter);
  api.use('/platform/finance', platformFinanceRoutes);
  api.use('/platform/audit-logs', platformAuditRouter);
  api.use('/platform/support-tickets', platformSupportRouter);
  api.use('/platform/team', platformTeamRouter);
  api.use('/platform/settings', platformSettingsRouter);
  api.use('/platform/impersonate', platformImpersonateRouter);

  app.use('/api/v1', api);

  // Production: serve the Vite SPA from the same origin as the API.
  if (env.NODE_ENV === 'production' && existsSync(WEB_DIST)) {
    app.use(express.static(WEB_DIST, { index: false, maxAge: '1d' }));
    app.get('*', (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
      res.sendFile('index.html', { root: WEB_DIST });
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
