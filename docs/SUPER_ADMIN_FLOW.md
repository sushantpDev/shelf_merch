# ShelfMerch.io — Super Admin Flow (Platform Control Plane)

> The Super Admin / platform team is the **owner side** of ShelfMerch — the
> supply, operations, and money engine that turns a tenant's campaign into a
> delivered, billed box. This document is the end-to-end flow for that side:
> the screens, the actions, the API behind each action, the state machines, and
> the day-to-day operational loop.
>
> Scope: single-app `shelfmerch.io`. Companion to
> `shelfmerch_io_phase1_canonical_spec.md`. Routes live under `/platform/*`
> (UI) and `/api/v1/platform/*` (API).

---

## 0. Who the Super Admin side is

Not one person — a team of internal ShelfMerch users (`tenantId: null`,
`scopeType: "platform"`) split across 8 roles so no one holds every key:

| Role | Owns | Cannot touch |
|---|---|---|
| `platform_super_admin` | everything | — |
| `platform_ops_admin` | orders, production, shipments, support triage | catalog pricing, finance writes, platform users |
| `platform_catalog_admin` | products, variants, pricing, inventory, kits | orders, finance, tenants |
| `platform_production_manager` | production tasks, QC | catalog, finance, tenants |
| `platform_finance_admin` | invoices, funding approvals, wallet adjustments, reports | catalog, production, tenants |
| `platform_support_agent` | tickets, cross-tenant search, resend links | catalog, finance, status overrides |
| `platform_logistics_manager` | shipments, AWB, couriers, exceptions | catalog, finance, production QC |
| `platform_readonly_auditor` | read-only everything + audit log | any write |

Every screen and endpoint below is gated by the **role × area matrix** in the
canonical spec. `👁` = read-only.

---

## 1. Entry & shell

```text
Login (platform user) → /platform/dashboard
Sidebar: Dashboard · Tenants · Catalog · Kits · Orders · Production ·
         Shipments · Inventory · Support · Finance · Reports ·
         Platform Users · Audit Logs · Settings
```

- Auth is the existing flow (`POST /api/v1/auth/login`) — platform users get a
  JWT with `tenantId: null`, `role: platform_*`.
- The shell reads the user's role and hides/disables sidebar items the role
  can't access (defense-in-depth; the API enforces it regardless).

---

## 2. Dashboard — the morning glance

`GET /api/v1/platform/dashboard` returns the cards + section feeds.

**Cards:** Active Tenants · Total GMV · Orders in Progress · Delayed Orders ·
Open Support Tickets · Low Stock Items · Outstanding Payments.

**Sections (each links into its module, pre-filtered):**
Critical Alerts · Order Pipeline (count per status) · Production Queue ·
Shipment Exceptions · Low Stock Alerts · Support Queue · Finance Risk
(overdue/at-margin) · Top Tenants · Top Products · System Health (`/health`).

The dashboard is read-only; every tile is a deep link into the owning module.

---

## 3. The flows, in operating order

### 3.1 Catalog — stand up the product master (catalog_admin)

This is the source of truth for everything a tenant can gift.

```text
Catalog → Products → New Product
  fields: name, slug, description, category, brand?, skuPrefix,
          sellingPriceInr, costPriceInr (internal), gstRate, hsnCode, moq,
          material, printableAreas[], customizationMethods[], productionDays
  → status starts "draft"
→ Add Variants      (size × color × material → sku, priceOverride?, stock)
→ Upload Images     (multer → R2; mark primary)
→ Add Customization (method + printable area + extra cost)
→ Set Inventory     (physical stock OR made-to-order)
→ Publish           (draft → active)  // validates cost<sell, gst, hsn, ≥1 image
```

| Action | Endpoint |
|---|---|
| Create / edit / duplicate / archive | `POST/PATCH /platform/products[/:id]`, `/:id/duplicate` |
| Publish / unpublish | `POST /platform/products/:id/publish` |
| Variants | `POST/GET/PATCH /platform/products/:id/variants` |
| Images | `POST /platform/products/:id/images` |
| Customization | `POST/GET/PATCH /platform/products/:id/customization` |
| Categories | `GET/POST/PATCH /platform/categories` |

**Rules:** price/GST/HSN changes require a `reason` (audited). `costPriceInr`
and margin are **never** serialized to tenant/public responses (whitelist DTO).

### 3.2 Inventory — keep stock honest (catalog_admin / ops)

```text
Inventory → list (product, sku, mode, available, reserved, threshold, status)
Actions: Add stock · Reduce · Reserve (for campaign) · Release ·
         Mark made-to-order · Set low-stock threshold
```

- Every movement is an append-only `InventoryTransaction` (mirror of the wallet
  ledger): `add | reduce | reserve | release | adjust`, with `reason` and a
  related campaign/order id. Available/reserved are derived, never edited raw.
- `made_to_order` items skip stock math but still produce production tasks.
- Reservation hook: campaign launch reserves stock; redemption consumes it;
  cancellation releases it.

`GET /platform/inventory` · `POST /platform/inventory/:id/transactions`.

### 3.3 Kits — pre-built bundles (catalog_admin)

```text
Kits → New Kit (name, description, packaging, eligibleCampaignTypes[],
                 approxValue, images) → add KitItems (product + variant + qty)
     → Publish
```
`POST/GET/PATCH /platform/kits[/:id]`, `/:id/publish`, `/:id/items`.

→ At this point a tenant can run the whole demand-side flow (wallet → campaign →
redeem). The Super Admin now picks the supply-side flow back up at the order.

---

### 3.4 Tenants — onboard & govern clients (super_admin)

```text
Tenants → list (status, plan, wallet balance, open orders, outstanding)
  Create tenant            → creates tenant + first company_admin + invite email
  Assign plan / set limits → PATCH /platform/tenants/:id/plan|limits
  Overview drill-in        → GET /platform/tenants/:id/overview
                             (wallet, active campaigns, open orders,
                              unpaid invoices, open tickets — one call)
  Suspend / Archive        → PATCH /:id/status  (archived = logins refused)
  Reset admin access       → POST /:id/reset-admin-access  (re-issue invite)
  Impersonate              → see §4
```
Self-signup is governed: `POST /auth/register` is gated by
`platformSettings.signup.mode` (`open | approval | closed`, default `approval`
→ new tenant lands in `trial`, super admin activates).

### 3.5 Orders — own every transition (ops / production)

The tenant can only watch once an order exists. The Super Admin drives it.

```text
Orders → cross-tenant list (filter: tenant, status, vendor/assignee, SLA risk, date)
  Click → Order Detail Drawer:
    items (with snapshot), recipient, shipping address, amount breakdown,
    status timeline (validNextStatuses), internal notes
  Actions: Update status · Assign production task · Upload mockup ·
           Override approval · Cancel · Create replacement · Add note · Export
```

**Order state machine (transitions enforced by `stateMachine.service.js`):**
```text
created → approved → mockup_pending → mockup_approved → in_production
→ qc_pending → packed → shipped → delivered
any → issue_raised ;  any → cancelled ;  issue_raised → replacement_processing
```
- `PATCH /platform/orders/:id/status` — **platform-only** (tenants lost this).
- `PATCH /platform/orders/:id/assign-task`, `POST /platform/orders/:id/replacement`
  (replacement = zero-charge clone, no wallet debit, linked via
  `replacementOfOrderId`).
- The one tenant-side write that remains is **mockup approve/reject** — their
  quality gate between `mockup_pending` and `mockup_approved`.

### 3.6 Production — the factory floor (production_manager)

```text
Production → board (orders grouped by production stage + SLA flags)
  Create task from order(s)  → must be mockup_approved
  Update stage · Upload production sheet · Upload mockup ·
  Upload QC photo · Mark QC passed / failed · Set expected dispatch · Note
```

**Production task state machine:**
```text
created → material_pending → mockup_pending → mockup_approved → in_production
→ printing → embroidery? → qc_pending → packing → ready_to_ship → completed
any → issue
```
- QC **pass** → order advances toward `packed`; QC **fail** → order stays in
  production, tenant notified of delay, task loops with a `reason`.
- **No vendor portal in Phase 1** — `assignedTo` is free-text (internal team or
  vendor name). The `Vendor` model is deferred.

### 3.7 Shipments — logistics (logistics_manager)

```text
Shipments → list (order, recipient, courier, AWB, status, delay/RTO, ETA)
  Add AWB (single)  ·  Bulk AWB (CSV: orderNumber,courier,awb)
  Update courier / tracking status  ·  Add tracking event  ·
  Mark delayed / RTO  ·  Create replacement  ·  Resend tracking link
```

**Shipment state machine:**
```text
pending → packed → shipped → in_transit → out_for_delivery → delivered
any → delayed | rto | lost | damaged
```
- `delivered` advances the linked order to `delivered` **through** the order
  machine (never a direct `.status =`).
- Endpoints: `GET /platform/shipments`, `POST /platform/shipments`,
  `/bulk-awb`, `/:id/events`, `/:id/resend-tracking`.
- Courier APIs (Shiprocket/Delhivery) are post-MVP — manual events for now.

### 3.8 Finance — billing & money (finance_admin)

```text
Finance →
  Funding approvals  → tenants who uploaded a PO / bank transfer
       Approve  → creates fund_in via ledger.service (the ONLY way money enters)
       Reject   → with reason
  Invoices           → proforma (pre-pay) + tax (post-pay, GST/HSN/GSTIN)
  Credit notes       → against a tax invoice, with reason
  Payments           → mark received (manual), reconcile Razorpay webhooks
  Wallet adjustments → { walletId, amount, reason }  (ledger only; blocked during impersonation)
  Outstanding        → balance + unpaid invoices per tenant
  Reports            → GMV · margin (sell − cost from snapshot) · GST export
```
**Hard rule:** wallet balance is never edited directly — every movement is a
`WalletTransaction`. Online payments are trusted only via Razorpay webhook,
never a frontend callback.

`GET /platform/finance/funding-approvals` · `POST /:walletId/approve|reject` ·
`POST /platform/finance/wallet-adjustments` · `.../invoices/proforma` ·
`.../credit-notes` · `GET .../reports/{gmv,margin,gst-export}` · `.../outstanding`.

### 3.9 Support — the help desk (support_agent)

The recipient calls **ShelfMerch**, not the tenant — so support is cross-tenant.

```text
Support →
  Ticket queue (filter: status, type, assignee, tenant)
  Cross-tenant search  → q = phone | email | orderNumber | AWB | campaign
  Actions: Create · Assign · Add message (internal/public) · Change status ·
           Link to order · Update recipient address · Resend redemption link ·
           Resend tracking link · Raise replacement · Close
```
**Ticket state machine:** `open → in_progress → waiting_on_customer →
in_progress → resolved → closed` (reopen allowed).
Sources: recipient redemption page, tenant order page, platform manual.
`GET /platform/support/tickets` · `/search?q=` · `POST /tickets/:id/messages` ·
`PATCH /:id/{assign,status}`.

---

## 4. Impersonation — debugging a tenant safely (super_admin)

```text
Tenants → :id → Impersonate  { reason, reasonCategory }
  → 15-min token, tenantId baked in, impersonation block in JWT + every AuditLog
  → persistent banner in the UI: "Impersonating <Tenant> — End"
  → BLOCKED while impersonating: wallet adjustments, invoice writes,
    role changes, billing  (middleware returns 403 "Disabled during impersonation")
End → POST /platform/impersonate/end   (audited)
```
The enforcement side already exists and is tested; the start/end endpoints are
the piece to add.

---

## 5. Platform Users — run the internal org (super_admin)

```text
Platform Users → Invite (email, name, platform role) → tenantId:null user + RoleAssignment
  Edit role · Suspend · Reset access · View activity (their AuditLog entries)
```
Not everyone is Super Admin — assign the narrowest role that does the job.
`POST/GET/PATCH /platform/team[/:userId]` · `/:userId/{deactivate,activity}`.

---

## 6. Audit Logs & Settings (super_admin / auditor)

```text
Audit Logs → filter by tenant, actor, action, entityType, date; newest first
  Logged: tenant suspend, role change, wallet adjustment, product price change,
          GST/HSN change, inventory adjustment, campaign launch, order/production
          status override, payment/invoice update, impersonation
Settings  → key/value PlatformSettings: gst.defaultRate, signup.mode,
          alerts.lowWalletPct, alerts.lowStockDefault, sla.productionDays.*,
          notification templates, payment gateway keys
```
`GET /platform/audit-logs` (super + auditor) · `GET/PUT /platform/settings[/:key]`.

---

## 7. The full operating loop (one delivered gift, owner's view)

```text
1. Catalog admin publishes products + kits, sets stock/made-to-order.        (§3.1–3.3)
2. Super admin approves the tenant's signup / PO funding.                     (§3.4, §3.8)
   — tenant runs wallet → campaign → sends redemption links (demand side) —
3. Employee redeems → ORDER created with product snapshot.                    (auto)
4. Ops approves order → uploads mockup → tenant approves mockup.              (§3.5)
5. Production manager creates a task, prints, runs QC (photo proof).          (§3.6)
6. QC passes → order packed → logistics adds AWB → ships.                     (§3.6–3.7)
7. Shipment events flow in; delivered → order delivered.                      (§3.7)
8. Finance issues the tax invoice, reconciles payment, books margin.          (§3.8)
9. Any hiccup → support ticket → address fix / replacement / resend link.     (§3.9)
10. Every sensitive step above is in the audit log.                           (§6)
```

That loop — **Catalog → Campaign → Redemption → Order → Production → Shipment →
Billing → Support** — is the whole product. The Super Admin owns steps 1, 2,
and 4–10. Without it, those steps live in WhatsApp and Excel; this is what the
platform replaces.

---

## 8. Non-negotiables for the Super Admin side

1. No status change bypasses `stateMachine.service.js` (order, production,
   shipment, ticket).
2. No wallet movement outside `ledger.service.js`; no inventory movement outside
   `InventoryTransaction`.
3. `costPriceInr` / margin / supplier never leak to tenant or public responses.
4. Every order item carries a full product **snapshot** (price/GST/HSN/image at
   order time).
5. Every platform mutation writes an **AuditLog**; price changes, adjustments,
   suspensions, and impersonation require a `reason`.
6. Role guards on every route per the matrix — including read-only ones.
7. Sensitive finance/role actions stay **blocked during impersonation**.
