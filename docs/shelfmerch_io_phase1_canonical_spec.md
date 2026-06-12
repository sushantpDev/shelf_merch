# ShelfMerch.io — Phase 1 Canonical Build Spec (Single-App)

> **Status: AUTHORITATIVE.** This supersedes both earlier drafts in this repo's
> history of planning:
> - the two-app "product references / shelfmerch.com bridge" plan — **DROPPED**
> - `shelfmerch_platform_control_plane_prompt.md` — **folded in here** (its ops
>   modules survive; its "catalog references only" framing is replaced by a real
>   product master).
>
> **Final decision:** ONE app, `shelfmerch.io` (this repo, `apps/api` +
> `apps/web`), owns *everything*: corporate gifting workflow **and** the product
> master / catalog / variants / inventory / kits. No dependency on a separate
> `shelfmerch.com` for the MVP.
>
> This spec is written against the EXISTING codebase. Reuse what's built; do not
> rebuild it. Keep the 47 passing tests green.

---

## 1. The three planes (already partly built)

| Plane | Routes | API | Users | Repo status |
|---|---|---|---|---|
| Platform control plane | `/platform/*` | `/api/v1/platform/*` | ShelfMerch internal team | API ~10% built; **no UI** |
| Tenant control plane | `/tenant/*` | `/api/v1/*` (tenant-scoped) | Company Admin, Entity Manager | API ~85% built; UI built |
| Recipient redemption | `/r/:token` | `/api/v1/redemptions/*` | Employees | Built (route is `/redeem/:token` — add `/r/:token` alias) |

The MVP journey to prove:
```text
Super Admin creates products + kits → Company Admin signs up → wallet →
entities → allocate budget → contacts → campaign (picks catalog product/kit) →
redemption links → employee redeems → order (with product snapshot) →
Super Admin tracks production → shipment → billing → support
```

---

## 2. Repo delta — what's BUILT vs REFACTOR vs NEW

### Already built (do not rebuild — verified, tested)
Auth (JWT, bcrypt-12, refresh rotation) · tenant isolation plugin · RBAC/ABAC
middleware · wallet **ledger** (sessions, append-only, derived balance) · entities
+ ABAC scoping · contacts + CSV import worker · campaigns (nanoid-32 tokens,
budget validation, idempotent launch + wallet debit) · full redemption portal
(hashed OTP, credit cap, order creation) · orders + state machine +
`validNextStatuses` · Razorpay webhook + invoice PDF · notifications · idempotency
· audit **writing** (40+ sites) · soft deletes · health check · seed (Rubix).

### Refactor (exists but must change for this plan)
| Item | Now | Change to |
|---|---|---|
| `CatalogProduct` model | single model w/ embedded `variants[]`, seed-only, `basePriceInr` only | becomes the **product master**: split into `products` + `productVariants` + `productImages` + `productCustomizationOptions` + `categories`; add `slug, sellingPriceInr, costPriceInr, gstRate, hsnCode, moq, material, printableAreas, productionDays, status[draft/active/inactive/archived/discontinued]`. Add full **platform admin CRUD**. |
| Catalog route | any authed user browses all `active` products | split: **platform** = full CRUD; **tenant** = read-only picker (redacts `costPriceInr`, margin, supplier, inventory history, platform notes) |
| Order status writes | `company_admin` can `PATCH /orders/:id/status` | **platform-only**; tenants get read-only timeline + mockup approve/reject + raise ticket |
| `Order.items[]` snapshot | name, variant, qty, unitPriceInr | add `productId, variantId, sku, productImage, gstRate, hsnCode, customizationNotes` (full snapshot contract §7) |
| Role enum (`roles/roleAssignment.model.js`) | 6 platform + 2 tenant | expand per §3 |
| `POST /auth/register` | open self-signup → live tenant | gate behind `platformSettings.signup.mode` (`open\|approval\|closed`, default `approval` → status `trial`) |

### New (build for Phase 1)
Categories · ProductVariant · ProductImage · ProductCustomizationOption ·
**InventoryItem + InventoryTransaction** (with made-to-order support) ·
first-class **Kit + KitItem** · **ProductionTask** · **Shipment** · **SupportTicket**
· **PlatformSettings** · impersonation start/end endpoints · platform user
management · audit-log **viewer** · platform orders/production/shipments/finance/
support routes · platform + tenant UI shells.

### Explicitly DEFERRED (do NOT build in Phase 1)
Vendor model/portal/price lists (manual text assignment only) · multi-warehouse ·
auto-mockup generation (manual upload only) · design studio · locker/saved designs
· HRMS/SSO/Slack · public marketplace checkout · Shiprocket/Delhivery API
(manual AWB + events only) · margin reporting can be minimal (sell − cost from
snapshot) — no vendor-cost engine.

---

## 3. Roles (expand the existing enum)

Add to `ROLES` in `apps/api/src/modules/roles/roleAssignment.model.js`.

**Platform (8):** `platform_super_admin`, `platform_ops_admin` *(new)*,
`platform_catalog_admin`, `platform_production_manager`, `platform_finance_admin`,
`platform_support_agent`, `platform_logistics_manager` *(new)*,
`platform_readonly_auditor`.

**Tenant (5):** `company_admin`, `entity_manager`, `company_finance_user` *(new)*,
`approver` *(new)*, `recipient` *(new — `scopeType: "self"`, no dashboard access)*.

`accountType` derives from role prefix: `platform_*` → `platform_admin`
(tenantId null); tenant roles → `tenant_user`; recipient → `recipient`.

**Phase 1 enforcement depth** (keep it real but simple):
- Wire all 8 platform roles into route guards per the matrix below.
- `company_finance_user` = read finance + initiate funding; `approver` =
  approve campaigns/wallet-setup. If a full approval workflow is too much for
  Phase 1, register the roles + guards now and stub the approval step as
  auto-approve, but DO NOT skip adding the roles (migrating role enums later is
  painful).

### Role × area guard matrix (👁 = read-only)
| Area | super | ops | catalog | production | finance | support | logistics | auditor |
|---|---|---|---|---|---|---|---|---|
| Catalog/variants/pricing | ✅ | 👁 | ✅ | ❌ | ❌ | ❌ | ❌ | 👁 |
| Inventory | ✅ | ✅ | ✅ | 👁 | ❌ | ❌ | 👁 | 👁 |
| Kits | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | 👁 |
| Orders + transitions | ✅ | ✅ | ❌ | ✅ | 👁 | 👁 | 👁 | 👁 |
| Production + QC | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | 👁 | 👁 |
| Shipments | ✅ | ✅ | ❌ | 👁 | ❌ | 👁 | ✅ | 👁 |
| Finance/invoices/adjustments | ✅ | 👁 | ❌ | ❌ | ✅ | ❌ | ❌ | 👁 |
| Support tickets | ✅ | ✅ | ❌ | 👁 | ❌ | ✅ | 👁 | 👁 |
| Tenants + impersonation | ✅ | 👁 | ❌ | ❌ | ❌ | ❌ | ❌ | 👁 |
| Platform users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁 |
| Audit viewer | ✅ | 👁 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Settings | ✅ | 👁 | ❌ | ❌ | ❌ | ❌ | ❌ | 👁 |

---

## 4. Data model (Phase 1 collections)

Existing models keep their names. New/refactored:

```javascript
// Category (platform-scoped)
{ name, slug, parentId?, sortOrder, status, timestamps }

// Product (platform-scoped — the master; refactor of CatalogProduct)
{ name, slug, description, categoryId, brand?, skuPrefix,
  sellingPriceInr, costPriceInr /*internal, redacted*/, gstRate(default 18),
  hsnCode, moq(default 1), material, productionDays(default 7),
  printableAreas: [String], customizationMethods: [String],
  status: enum ["draft","active","inactive","archived","discontinued"],
  timestamps, deletedAt }

// ProductVariant (platform-scoped)
{ productId, size, color, material?, sku(unique), priceOverrideInr?,
  status, timestamps }

// ProductImage (platform-scoped)
{ productId, variantId?, url, alt, sortOrder, isPrimary }

// ProductCustomizationOption (platform-scoped)
{ productId, method: enum [screen_print,dtf,embroidery,sublimation,uv,laser,
  digital,heat_transfer,none], printableArea, extraCostInr?, notes }

// InventoryItem (platform-scoped)
{ productId, variantId, sku, mode: enum ["physical","made_to_order"],
  availableStock, reservedStock, lowStockThreshold, location?,
  status: enum ["in_stock","low_stock","out_of_stock","made_to_order","discontinued"],
  timestamps }

// InventoryTransaction (platform-scoped, append-only — mirror the wallet-ledger pattern)
{ inventoryItemId, type: enum ["add","reduce","reserve","release","adjust"],
  qty, reason, relatedCampaignId?, relatedOrderId?, performedBy, createdAt }

// Kit (tenant-visible, platform-managed) + KitItem
Kit:   { name, description, packaging, eligibleCampaignTypes: [String],
         approxValueInr, images: [String], status, timestamps, deletedAt }
KitItem: { kitId, productId, variantId?, qtyPerKit }

// ProductionTask (platform-scoped)
{ taskNumber, orderId, assignedTo /*free-text team/vendor name in P1*/,
  stage: enum ["created","material_pending","mockup_pending","mockup_approved",
   "in_production","printing","embroidery","qc_pending","packing","ready_to_ship",
   "completed","issue"],
  productionSheetUrl?, mockupUrls: [String], qcPhotoUrls: [String],
  qcResult: enum ["pending","passed","failed"], expectedDispatchAt, notes, timestamps }

// Shipment (tenant-scoped — tenantScope + softDelete)
{ tenantId, orderId, courier, awb, trackingUrl, eta,
  status: enum ["pending","packed","shipped","in_transit","out_for_delivery",
   "delivered","delayed","rto","lost","damaged"],
  delayReason?, events: [{ status, location, at, note }],
  replacementOfShipmentId?, timestamps }

// SupportTicket (tenant-scoped — tenantScope + softDelete)
{ tenantId, ticketNumber,
  source: enum ["recipient","tenant_admin","platform"],
  type: enum ["address","size","damaged","wrong_item","delayed","invoice",
   "payment","campaign","other"],
  subject, description, relatedOrderId?, status: enum ["open","in_progress",
   "waiting_on_customer","resolved","closed"], priority, assignedToUserId?,
  messages: [{ authorUserId, body, at, internal }], timestamps, deletedAt }

// PlatformSettings (singleton key/value, platform-scoped)
{ key(unique), value, updatedBy, timestamps }
// seed: gst.defaultRate=18, signup.mode="approval", alerts.lowWalletPct=20,
//       alerts.lowStockDefault, sla.productionDays.*, notification templates
```

**State machines** — add `production` and `shipment` (and `supportTicket`) to
`stateMachine.service.js`; never assign `.status =` directly. Shipment
`delivered` advances the order via the order machine.

**Snapshot (§7)** is non-negotiable: order items copy product facts at order
time so price/GST/HSN/image changes never corrupt history.

---

## 5. API surface to add (under existing patterns: authenticate → requireRole → validate → controller, audited, paginated)

```text
# Platform catalog (catalog_admin, super, +ops 👁)
POST/GET/PATCH  /api/v1/platform/products[/:id]   ·  /:id/publish · /:id/duplicate · /:id/images
GET/POST/PATCH  /api/v1/platform/categories
POST/GET/PATCH  /api/v1/platform/products/:id/variants
POST/GET/PATCH  /api/v1/platform/products/:id/customization
# Inventory (catalog/ops, logistics 👁)
GET             /api/v1/platform/inventory
POST            /api/v1/platform/inventory/:id/transactions   { type, qty, reason }
# Kits
POST/GET/PATCH  /api/v1/platform/kits[/:id] · /:id/publish · /:id/items
# Tenant-facing (read-only picker, redacted)
GET             /api/v1/catalog/products      → active only, no cost/margin
GET             /api/v1/catalog/kits
# Platform ops
GET   /api/v1/platform/orders · PATCH /platform/orders/:id/status · /assign-task · /replacement
GET   /api/v1/platform/production · POST /production/tasks · PATCH /tasks/:id/stage · /qc · /sheet
GET   /api/v1/platform/shipments · POST /shipments · /bulk-awb · /:id/events · /:id/resend-tracking
# Finance
GET   /api/v1/platform/finance/funding-approvals · POST /:walletId/approve|reject
POST  /api/v1/platform/finance/wallet-adjustments  { walletId, amount, reason }   (blocked during impersonation)
POST  /api/v1/platform/finance/invoices/proforma · /credit-notes · GET /reports/{gmv,margin,gst-export} · /outstanding
# Support
GET   /api/v1/platform/support/tickets · /search?q= (cross-tenant) · POST /tickets/:id/messages · PATCH /:id/{assign,status}
POST  /api/v1/support-tickets (tenant + recipient sources)
# Governance
POST  /api/v1/platform/tenants/:tenantId/impersonate · POST /api/v1/platform/impersonate/end
PATCH /api/v1/platform/tenants/:id/{plan,limits,archive,reset-admin-access} · GET /:id/overview
POST/GET/PATCH /api/v1/platform/team[/:userId] (invite platform users, tenantId:null) · /:userId/{deactivate,activity}
GET   /api/v1/platform/audit-logs   (super + auditor)
GET/PUT /api/v1/platform/settings[/:key]
```

**Redaction rule (hard):** every tenant-facing/public response serializes
products/orders through an explicit whitelist (`toTenantDTO()`). Add a test that
sweeps non-platform routes and asserts `costPriceInr`/margin/supplier never leak.

---

## 6. Frontend (Phase 1)
Add a route-guarded `/platform/*` console (Dashboard, Tenants, Catalog, Kits,
Orders, Production, Shipments, Inventory, Support, Finance, Reports, Platform
Users, Audit Logs, Settings). Tenant app gains a read-only **Catalog picker**
(search/category/price/MOQ/customization filters, product drawer, "add to
campaign") and loses the order-status dropdown (read-only timeline + mockup
approve/reject + raise ticket). Recipient flow served at `/r/:token`.

---

## 7. Order item snapshot (copy verbatim into the contract)
```json
{ "productId","variantId","sku","productName","productImage","size","color",
  "quantity","unitPrice","gstRate","hsnCode","customizationNotes",
  "tenantId","campaignId","redemptionId" }
```

---

## 8. Build order (matches the plan)
1. Expand roles + RBAC/ABAC guards   2. Platform Super Admin shell (UI + audit
viewer + impersonation + platform users)   3. Catalog product master (refactor
CatalogProduct → products/categories)   4. Variants/images/customization   5.
Inventory (+ made-to-order)   6. Kits + KitItems   7–9. (already built: tenant
workspace, wallet+entities, contacts)   10. Campaign picks catalog/kit   11.
Tenant catalog picker UI   12. Redemption `/r/:token`   13. Order creation with
snapshot   14. Platform order/production/shipment tracking   15. Billing +
support   16. Reports + audit logs.

## 9. Phase 1 acceptance
Super Admin creates products/variants/stock(or made-to-order)/kits · Company
Admin: wallet → entities → contacts → campaign picking catalog/kit · employee
redeems at `/r/:token` · order created **with snapshot** · Super Admin tracks
production/shipment, manages billing+support · reports show campaign/order/wallet
basics · audit logs capture sensitive actions · **47 existing tests stay green**
· no cost/margin leak to tenants.

## 10. Hard constraints
No status change bypasses `stateMachine.service.js` (incl. new production/
shipment/ticket machines) · no wallet mutation outside `ledger.service.js` ·
inventory changes go through `InventoryTransaction` (mirror the ledger) ·
snapshot every order item · audit every platform mutation · require `reason` on
price changes, adjustments, suspensions, impersonation · don't build the
DEFERRED list (§2).
