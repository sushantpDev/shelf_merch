import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { pinoHttp } from 'pino-http';
import { logger } from './config/logger.js';
import { env } from './config/env.js';
import { ensureRedisReady } from './config/redis.js';
import { LOCAL_UPLOAD_DIR } from './services/storage.service.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { razorpayWebhook } from './modules/payments/payments.controller.js';

import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import { tenantsRouter, platformTenantsRouter } from './modules/tenants/tenants.routes.js';
import walletsRoutes from './modules/wallets/wallets.routes.js';
import entitiesRoutes from './modules/entities/entities.routes.js';
import shopsRoutes from './modules/shops/shops.routes.js';
import catalogRoutes from './modules/catalog/catalog.routes.js';
import collectionsRoutes from './modules/collections/collections.routes.js';
import kitsRoutes from './modules/kits/kits.routes.js';
import contactsRoutes from './modules/contacts/contacts.routes.js';
import campaignsRoutes from './modules/campaigns/campaigns.routes.js';
import redemptionsRoutes from './modules/redemptions/redemptions.routes.js';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));

  // §9.3 — Razorpay webhook must verify signature against the raw body.
  app.post(
    '/api/v1/payments/razorpay/webhook',
    express.raw({ type: 'application/json' }),
    asyncHandler(razorpayWebhook),
  );

  app.use(express.json({ limit: '1mb' }));
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url.includes('/health') } }));
  }

  app.use('/uploads', express.static(LOCAL_UPLOAD_DIR));

  const api = express.Router();

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

  api.use('/auth', authRoutes);
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
  api.use('/notifications', notificationsRoutes);
  api.use('/payments', paymentsRoutes);
  api.use('/invoices', invoicesRoutes);
  api.use('/orders', ordersRoutes);
  api.use('/support-tickets', tenantSupportRouter);
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
