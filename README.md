# ShelfMerch

Multi-tenant B2B SaaS for corporate swag, gifting, budget wallets, and employee
redemption — India-first (INR, GST, Razorpay).

## Repository Layout (npm workspaces monorepo)

```text
shelf_merch/
├── apps/
│   ├── api/                ← Backend (Node.js + Express + Mongoose, modular monolith)
│   └── web/                ← Frontend (Vite + React SPA, TanStack Router)
├── docs/                   ← Build spec (shelfmerch_backend_integration_prompt.md)
├── docker-compose.yml      ← Optional local Redis only (MongoDB = Atlas via MONGO_URL)
├── package.json            ← workspace root
├── .env.example
└── README.md
```

## Quick Start

Prereqs: Node 20+, MongoDB Atlas cluster (M0+ — replica set required for ledger transactions).

```bash
# 1. Env — set MONGO_URL to your Atlas connection string
copy .env.example .env
# Edit .env: MONGO_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/shelfmerch

# 2. Install everything (workspaces)
npm install

# 3. (Optional) Local Redis for background job queues
docker compose up -d

# 4. Run
npm run seed       # WIPES and re-seeds demo data — only run on dev/staging Atlas DBs
npm run dev:api    # http://localhost:4000/api/v1
npm run dev:web    # http://localhost:8080

# Frontend talks to the API when VITE_USE_MOCKS is not "true" (see .env.example).
# Vite proxies /api → localhost:4000 in dev.
```

### Redemption portal (public)

After seeding, open `http://localhost:8080/redeem/seedDemoRedemptionTokenRubix26!`
to test the recipient flow (OTP → catalog → order).

### Demo logins (password: `demo1234`)

| Email | Role |
|---|---|
| `admin@shelfmerch.io` | platform_super_admin |
| `hr@rubix.net` | company_admin (Rubix) |
| `jonnaml2015@gmail.com` | company_admin (Rubix) |
| `priya@rubix.net` | entity_manager (Marketing) |

### Tests

```bash
npm test           # runs the API suite (vitest)
```

Tests prefer the Docker Mongo replica set (`shelfmerch_test` db) and fall back
to `mongodb-memory-server` when Docker isn't available.

## Architecture Invariants (enforced in code)

- **Tenant isolation** — every tenant-scoped model uses a Mongoose plugin that
  rejects any query missing a `tenantId` filter (platform routes opt out
  explicitly with `skipTenantGuard`).
- **Ledger** — `WalletTransaction` is append-only (update/delete hooks throw);
  `wallet.balance` is a cached value, always recomputable via
  `ledger.recomputeBalance()`. All ledger writes run in MongoDB transactions.
- **State machines** — Wallet/Campaign/Order/Redemption status changes only
  flow through `stateMachine.service.js`; API responses include
  `validNextStatuses`.
- **RBAC + ABAC** — middleware order: `authenticate → resolveTenant →
  requireRole → requireScope`. Entity managers only see/touch their assigned
  entities.
- **Idempotency** — mutating money routes accept an `Idempotency-Key` header;
  replays return the cached response (24h TTL).
- **Audit + soft deletes** — every state-changing action writes an `AuditLog`;
  tenant data is never hard-deleted (`deletedAt`).

## Delivery Status (per §12 of the build spec)

- [x] **Phase 1 — Foundation**: scaffolding, env validation, Mongo/Redis,
      auth (login/refresh/logout/forgot/reset/invites), tenants, users, roles,
      RBAC/ABAC middleware, health check, seed
- [x] **Phase 2 — Wallet Ledger**: Wallet/WalletTransaction/Entity models,
      ledger service, full wallet setup wizard endpoints, transfers, paginated
      ledger, activation gating
- [x] **Phase 3 — Catalog & Store**: shops, platform catalog, collections, kits, R2/local uploads
- [x] **Phase 4 — Contacts & Campaigns**: CSV import (BullMQ + inline fallback), campaign state machine, launch debits
- [x] **Phase 5 — Redemption Portal**: public token routes, MSG91 OTP/SMS, session JWT on catalog/submit
- [x] **Phase 6 (partial) — Orders API**: list/detail, status transitions + ABAC; frontend Orders page wired. Platform impersonation/shipments still pending.
- [x] **Phase 7 — Payments & Invoicing**: Razorpay order + signed webhook → wallet fund, GST invoices (PDF), in-app + SMS notifications
- [ ] Phase 8 — Hardening & deployment
- [x] **Frontend API integration (MVP)**: `apps/web/src/services/` API client,
      real login/session restore, workspace hydration (shops, contacts, kits,
      catalog, wallets/entities, campaigns), shop publish + contact create;
      public redemption portal at `/redeem/:token`. Set `VITE_USE_MOCKS=true`
      to fall back to in-memory demo data.
