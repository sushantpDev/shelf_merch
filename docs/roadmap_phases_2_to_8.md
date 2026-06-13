# ShelfMerch.io — Roadmap Beyond Phase 1 (Phases 2–8)

> Phase 1 (`shelfmerch_io_phase1_canonical_spec.md`) proves the core loop:
> **Catalog → Campaign → Redemption → Order → Production → Shipment → Billing →
> Support**, all manual where it can be. It deliberately *defers* everything that
> automates margin, logistics, money, approvals, design, and integrations.
>
> This document picks those up. Each phase has: **Goal**, **Why now**
> (dependency), **Build**, **New models/endpoints**, and **Exit criteria**.
> Phases are roughly sequential but 3/4 can run in parallel once 2 lands.

---

## Phase map at a glance

| Phase | Theme | Turns this Phase-1 "manual/deferred"… | …into this |
|---|---|---|---|
| 2 | Vendor & margin engine | free-text `assignedTo`, no cost truth | real vendors, price lists, batched jobs, live margin |
| 3 | Logistics automation | manual AWB + manual events | Shiprocket/Delhivery API, auto-tracking, NDR/RTO |
| 4 | Payments & finance automation | manual PO approval, manual invoices | live Razorpay, auto-invoicing, dunning, reconciliation |
| 5 | Approvals & tenant self-service | auto-approve stubs, flat roles | multi-level approvals, plans/tiers, budget guardrails |
| 6 | Design studio & mockups | manual mockup upload | logo compositing, editor, saved designs, lockers |
| 7 | Integrations | CSV-only people data | HRMS sync, SSO, Slack/Teams, Zapier, webhooks |
| 8 | Analytics, scale, hardening | basic reports, single warehouse | BI, multi-warehouse, observability, perf |

---

## Phase 2 — Vendor & Margin Engine

**Goal:** make ShelfMerch's actual economics real in software — who supplies
each product, at what negotiated cost, and what margin each order earns.

**Why now:** Phase 1 ships orders and production with a free-text assignee and a
`costPriceInr` typed on the product. That's a placeholder for the real thing:
margin = selling price − *vendor* cost − ops cost. Everything downstream
(finance reports, pricing decisions, vendor SLAs) depends on this being true.

**Build:**
- Promote the deferred `Vendor` model to first-class: onboarding, capability
  mapping (which vendor does which product × print method), capacity/day,
  performance scoring (quality, turnaround, defect rate from production tasks),
  payment terms & payables.
- `VendorPriceList` — negotiated cost per product/variant per vendor (internal,
  redacted from tenants). This becomes the cost source instead of a flat field.
- Vendor assignment on production tasks (replace free-text `assignedTo`);
  reassign/split when a vendor is overloaded or fails QC.
- **Production batching** — group similar orders across tenants into one vendor
  run (`ProductionJob` with `orderIds[]`), already sketched in the control-plane
  draft.
- **Margin engine** — at order time snapshot the *vendor* cost; compute
  `marginInr/marginPct` per order; margin threshold alerts (flag orders that
  will lose money) using `platformSettings.alerts.marginThresholdPct`.

**New:** `Vendor`, `VendorPriceList`, `ProductionJob`; extend `ProductionTask`
with `vendorId`; extend `Order.internal` with vendor cost + margin.
`/platform/vendors[/:id]`, `/:id/pricing`, `/:id/performance`,
`/platform/production/jobs[/:id]` (+ stage/qc/sheet).

**Exit:** every order shows true margin sourced from the assigned vendor's price
list; vendors are scored from real QC/turnaround data; a money-losing order is
flagged before production starts. No cost/margin leaks to tenants.

---

## Phase 3 — Logistics Automation

**Goal:** stop typing AWBs and tracking events by hand.

**Why now:** Phase 1 shipments are entirely manual. Volume makes that the first
ops bottleneck after fulfillment works end to end.

**Build:**
- Courier integration (Shiprocket first, then Delhivery/BlueDart): create
  shipments + AWBs via API; serviceability/rate checks; label generation.
- **Inbound webhooks** for tracking events → drive the shipment state machine
  automatically (replaces `POST /shipments/:id/events`).
- NDR / RTO automation: exception detection, recipient re-attempt prompts,
  auto-RTO handling, replacement-shipment creation.
- Delivery SLA monitoring + delay alerts (extends the Phase-1 SLA worker).
- Courier selection rules in `platformSettings` (by region/weight/value).

**New:** `CourierAccount`, `ShipmentWebhookEvent`; extend `Shipment` with
provider refs. `/platform/integrations/couriers/*`,
`POST /api/v1/webhooks/shiprocket` (signature-verified, queued).

**Exit:** an order ships, tracks, and resolves delivery/RTO with zero manual
status entry; exceptions surface in the dashboard automatically.

---

## Phase 4 — Payments & Finance Automation

**Goal:** money in and invoices out without a human in the loop for the happy
path.

**Why now:** Phase 1 trusts manual PO approval + manual invoice creation.
Razorpay webhook exists but funding is mostly manual. Automating this is what
lets finance scale past a handful of tenants.

**Build:**
- Razorpay **live** (out of sandbox): online wallet funding + campaign checkout;
  always webhook-confirmed, never frontend-trusted (rule already in place).
- Auto-invoicing: tax invoice generated on payment capture; proforma on order
  approval; GST-compliant numbering, HSN, GST breakup, PDF to R2.
- **Dunning** — overdue detection, reminder schedule, escalation; outstanding
  balance per tenant with aging buckets.
- Credit limits enforced (block campaign launch past `creditLimitInr`).
- Reconciliation: match payments ↔ invoices ↔ wallet transactions; surface
  mismatches.
- GST filing exports (GSTR-ready CSV) for ShelfMerch's own returns.

**New:** extend `Invoice` (proforma/tax/credit_note, dueAt), `Payment`
reconciliation state; `DunningSchedule`. `/platform/finance/reconciliation`,
`/reports/gst-export`, dunning worker.

**Exit:** a tenant funds online → invoice auto-issues → payment auto-reconciles;
overdue invoices chase themselves; finance closes the month from exports.

---

## Phase 5 — Approvals & Tenant Self-Service Depth

**Goal:** real governance inside a tenant + plan-based feature gating.

**Why now:** Phase 1 registers `company_finance_user` and `approver` roles but
stubs the workflow as auto-approve. Enterprise tenants need actual sign-off
chains and budget guardrails before they'll trust the platform with real money.

**Build:**
- Multi-level approval workflows: campaign launch, wallet funding, budget
  transfers route to `approver` / `company_finance_user` with thresholds.
- Approval state on campaigns/wallet ops (replace the auto-approve stub) through
  the state machine.
- **Plans & tiers** (`free / growth / enterprise`) with enforced feature limits
  (catalog visibility by tier, seat counts, campaign caps).
- Budget guardrails: per-entity caps, low-wallet auto-alerts (extends Phase-1
  worker), spend velocity warnings.
- Tenant audit visibility (their own slice of the audit log) — the "who touched
  our budget?" answer for procurement.

**New:** `ApprovalRequest`, `Plan`; extend `Tenant.plan.limits` enforcement
middleware. `/api/v1/approvals/*`, plan-gating middleware.

**Exit:** a campaign over a threshold waits for an approver; an enterprise plan
unlocks features a free plan can't see; a tenant admin can self-serve their
governance and audit trail.

---

## Phase 6 — Design Studio & Mockup Automation

**Goal:** remove the design team from the critical path for standard branding.

**Why now:** Phase 1 mockups are a manual upload + approval gate. This is the
biggest human-turnaround cost once volume is real, and the most visible quality
lever.

**Build:**
- Logo-on-product compositing (the real `mockupGeneration.worker.js`): overlay
  tenant logo on product templates per printable area → auto `mockup_pending`.
- Lightweight design editor (placement, scale, color) — not a full Illustrator.
- **Saved designs** + tenant **locker inventory** (pre-produced branded stock a
  tenant draws down from) — both deferred in Phase 1.
- Print-ready artifact generation for vendors (production sheets auto-built).

**New:** `DesignTemplate`, `SavedDesign`, `LockerInventory`; mockup worker
upgrade. `/api/v1/designs/*`, `/platform/locker/*`.

**Exit:** a tenant uploads a logo and gets an auto-mockup in seconds; standard
campaigns skip the manual design queue; lockers let repeat tenants reorder
instantly.

---

## Phase 7 — Integrations

**Goal:** stop being an island — pull people in, push events out.

**Why now:** Phase 1 is CSV-only for contacts and password-only for auth. Large
tenants won't manually sync employee lists or manage separate logins.

**Build:**
- HRIS sync (Darwinbox, Keka, Zoho People): auto-import/refresh contacts; the
  `ImportMapping` model already anticipates this.
- SSO (Okta, Azure AD) via the placeholder `AuthIdentity` model; SCIM later.
- Slack / Teams notifications (redemption nudges, order updates).
- Zapier + outbound **webhooks** (`outboxEvents` collection, deferred in P1) for
  tenant automation.
- Turn the Integration Hub stubs into real OAuth connections (one at a time).

**New:** `IntegrationConnection`, `OutboxEvent`; extend `AuthIdentity`.
`/api/v1/integrations/:provider/{connect,callback,sync}`, outbox dispatcher
worker.

**Exit:** a tenant connects their HRIS and contacts stay in sync; employees SSO
in; order/redemption events reach Slack and Zapier.

---

## Phase 8 — Analytics, Scale & Hardening

**Goal:** decision-grade reporting and production-grade ops.

**Why now:** by here the platform runs real money and volume; leadership needs
BI and the system needs to not fall over.

**Build:**
- BI dashboards: GMV trends, margin by product/tenant/vendor, redemption funnel,
  fulfillment SLA, support metrics; scheduled report exports.
- Multi-warehouse inventory (deferred in P1): location-aware stock, transfers,
  nearest-warehouse routing.
- Observability: Sentry (frontend + backend), structured tracing, alerting on
  the health check, queue depth monitoring.
- Scale hardening: query/index review at volume, rate limiting, caching hot
  reads, background-job autoscaling, load/perf testing.
- Data lifecycle: archival, retention policy, tenant data export (GDPR-style).

**New:** `Warehouse`, `StockTransfer`, reporting materialized views/aggregations.
`/platform/reports/*` (rich), `/platform/warehouses/*`.

**Exit:** leadership reads margin and GMV from a dashboard, not a CSV; inventory
spans warehouses; the system is observable, rate-limited, and load-tested.

---

## Cross-cutting principles (hold across all phases)

1. Every new status field gets a state machine in `stateMachine.service.js`.
2. Money and inventory only move through their ledgers
   (`ledger.service.js`, `InventoryTransaction`).
3. Internal cost/margin/vendor data never serializes to tenant/public routes.
4. Every external confirmation (payment, courier, integration) is webhook-/
   signature-verified and idempotent — never frontend-trusted.
5. Every mutating action is audited; sensitive ones require a `reason`.
6. New integrations and automations are additive — the manual Phase-1 path stays
   as the fallback.
7. Each phase ships behind its own tests; the suite only grows.

---

## Suggested sequencing

```text
Phase 2 (vendors+margin) ──┬─► Phase 3 (logistics)   ─┐
                           └─► Phase 4 (payments)     ─┤
                                                       ├─► Phase 5 (approvals)
Phase 6 (design) and Phase 7 (integrations) ──────────┘   can start after 2
Phase 8 (scale) ──────────────────────────────────────────► last / continuous
```

Phase 2 is the keystone — it makes margin real, and margin is the business.
Everything else compounds value on top of a correct economic core.
