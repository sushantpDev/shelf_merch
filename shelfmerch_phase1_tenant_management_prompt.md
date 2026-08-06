# ShelfMerch Phase 1 Tenant Management Changes

You are working on **ShelfMerch**, a multi-tenant corporate merchandise/POD platform.

We are currently in **Phase 1**.

## Important product decision

- Phase 1 does **not** include tenant subscription plans.
- Phase 1 does **not** include recurring billing.
- Phase 1 does **not** include feature entitlements.
- Phase 1 does **not** restrict tenants by number of users, campaigns, wallets, recipients, or other business quotas.
- Do not build speculative Phase 2 features.

## Your task

Simplify and improve the **Super Admin tenant-management experience** while preserving the existing visual style and code architecture.

### Current page

- Route: `/platform/tenants`
- The page currently contains columns such as Tenant, Slug, Status, Plan, Wallet and Open Orders.
- The Manage modal currently allows changing Account Status and Plan.
- The tenant data model may currently contain fields such as:
  - `plan`
  - `limits.maxUsers`
  - `limits.maxCampaigns`
  - `limits.maxWallets`
  - `limits.maxRecipientsPerCampaign`
  - `limits.requestsPerMinute`

## Main objective

Turn the tenant page into a clean **Phase 1 operational tenant directory**, not a subscription-management page.

## Before coding

1. Inspect the existing frontend components, backend routes, tenant model, authentication, authorization and audit-log implementation.
2. Reuse existing patterns and components.
3. Do not rewrite unrelated parts of the application.
4. Identify the exact files that need changes.
5. Preserve backward compatibility where practical.

---

## 1. Remove plan and subscription features

Remove the following from the Super Admin tenant page:

- Remove the **Plan** column from the tenant table.
- Remove Plan from the Manage modal.
- Remove all plan-change buttons and actions.
- Remove plan-related UI labels, filters and validation.
- Do not display subscription, renewal, upgrade or downgrade information.
- Do not add trial-conversion logic.

The frontend must not depend on `tenant.plan`.

Do not immediately delete existing plan or limits fields from the database if doing so could break existing code.

Instead:

- Stop using them in Phase 1 tenant-management flows.
- Mark them as legacy/future fields in code where appropriate.
- Remove references only after checking that they are not used elsewhere.
- If database cleanup is safe, create a separate migration script, but do not automatically run a destructive migration.

---

## 2. Simplify tenant status

Use tenant status only for operational access control.

### Supported Phase 1 statuses

- `active`
- `suspended`
- `archived`

Only add `onboarding` if a real onboarding/provisioning workflow already exists. Do not add it only for appearance.

### Status meanings

#### active

- Tenant users can access the tenant app.
- Normal operations are permitted.

#### suspended

- Tenant users cannot access protected tenant functionality.
- Existing orders and operational records must remain available to ShelfMerch platform admins.
- Data must not be deleted.

#### archived

- Tenant is no longer operational.
- Tenant should not appear in the default Active view.
- Data must be retained.
- Archived tenants must be accessible through a filter.

Remove `trial` from the status selector because Phase 1 does not have a commercial trial system.

For existing records that contain `status = "trial"`:

- Do not silently modify production data.
- Add a safe migration script or documented migration command that converts selected legacy trial tenants to active.
- The migration must support dry-run mode.
- Do not run the migration automatically.
- Until migration, the UI should not crash when encountering a legacy value.

Create explicit backend commands or service methods such as:

- `activateTenant()`
- `suspendTenant()`
- `archiveTenant()`
- `restoreTenant()`

Do not implement status changes as an unrestricted generic database update.

Validate allowed transitions.

### Suggested transitions

- `active → suspended`
- `active → archived`
- `suspended → active`
- `suspended → archived`
- `archived → active` only through an explicit restore action

Every status change must:

- Verify Super Admin authorization.
- Require a reason for suspension, archive and restoration.
- Record the previous status.
- Record the new status.
- Record the acting platform user.
- Record the timestamp.
- Create an audit-log event.
- Return a clear success or failure response.

---

## 3. Update the tenant table

Keep the current design language, spacing, typography and general layout.

Use these table columns where data is currently available:

### 1. Tenant

- Tenant name
- Optional logo/avatar
- Slug displayed as secondary text

### 2. Status

- Active
- Suspended
- Archived
- Handle legacy unknown statuses safely

### 3. Primary Admin

- Name or email
- Show `Not assigned` when missing

### 4. Users

- Display the current number of users
- This is informational only
- Do not display quotas such as `8 of 10`

### 5. Wallet

- Display current wallet balance
- Keep existing currency-formatting behaviour
- Do not add wallet limits

### 6. Open Orders

- Display open-order count
- Make the value clickable if an existing filtered-order route is available

### 7. Last Active

- Display relative time where possible
- Show `No activity` or `Unavailable` when there is no data

### 8. Actions

- Open tenant
- Manage status
- View users
- View orders
- View audit logs
- Archive or restore, depending on status

If Primary Admin, Users or Last Active cannot be retrieved efficiently:

- Add proper backend aggregation or read-model support.
- Avoid making one API request per table row.
- Do not introduce N+1 database queries.

---

## 4. Add search, filtering and pagination

Add:

- Search by tenant name
- Search by slug
- Search by primary-admin email, if supported
- Status filter
- Sort by tenant name
- Sort by created date
- Sort by last activity
- Server-side pagination

### Recommended page sizes

- 20
- 50
- 100

The URL should preserve useful state where practical, such as:

```text
/platform/tenants?status=active&search=dell&page=1
```

Add:

- Clear filters action
- Empty state
- No-results state
- Loading state
- Error state with retry action

### Default behaviour

- Show active and suspended tenants.
- Hide archived tenants unless the Archived filter is selected.

Do not load every tenant into the browser and filter only on the client.

---

## 5. Replace the current Manage modal

The current modal combines Account Status and Plan. Remove the Plan section.

Create a focused status-management modal or drawer.

### Content

- Tenant name
- Tenant slug
- Current status
- New status
- Reason field
- Impact message
- Confirmation button
- Cancel button

### Example: suspension

```text
Suspend Dell?

Tenant users will lose access to protected tenant functionality.
Existing orders, wallet records and tenant data will remain unchanged.
ShelfMerch platform admins will retain access.

Reason:
[required text input]

[Cancel] [Suspend tenant]
```

### Example: archive

```text
Archive Dell?

The tenant will be removed from the default active tenant list.
Tenant data will be retained.
The tenant can be restored later by a platform administrator.

Reason:
[required text input]

[Cancel] [Archive tenant]
```

### Requirements

- Use clear destructive styling for suspension and archive actions.
- Disable submission during the API request.
- Prevent double submission.
- Display API errors clearly.
- Refresh the affected tenant row after success.
- Do not require a full page reload.
- Ensure keyboard accessibility.
- Trap focus correctly inside the modal.
- Allow Escape to close when no request is in progress.

---

## 6. Add or improve tenant details

Clicking the tenant name or `Open tenant` should open a proper tenant details page.

### Suggested route

```text
/platform/tenants/:tenantId
```

Create a lean Phase 1 page with these tabs or sections:

- Overview
- Users
- Orders
- Wallet
- Settings
- Audit Log

Do not build subscription, plan, entitlements or usage-billing sections.

### Overview should show

- Tenant name
- Logo
- Slug
- Status
- Primary administrator
- User count
- Wallet balance
- Open orders
- Created date
- Updated date
- Last activity

### Settings should support existing Phase 1 fields

- Company/tenant name
- Logo
- Slug
- Currency
- GSTIN
- Billing address
- Primary administrator

### Protect slug changes

- Validate format.
- Enforce uniqueness.
- Warn that changing the slug may affect tenant URLs.
- Do not allow accidental changes without confirmation.

---

## 7. Primary tenant admin

Add support for assigning a primary tenant administrator if this concept does not already exist.

### Requirements

- The primary admin must be an existing active tenant member.
- Only one primary admin per tenant.
- Changing the primary admin must create an audit event.
- Display `Not assigned` when no primary admin exists.
- Do not restrict the total number of tenant users.

Do not confuse:

- ShelfMerch platform administrators
- Tenant administrators

They must remain separate role scopes.

---

## 8. Audit logging

Ensure the following actions create audit events:

- Tenant created
- Tenant name changed
- Tenant slug changed
- Tenant status changed
- Tenant suspended
- Tenant restored
- Tenant archived
- Primary admin changed
- Tenant settings changed
- Platform admin opened or impersonated a tenant, if impersonation exists
- Manual wallet adjustment, if available

Audit event should include:

- `eventType`
- `tenantId`
- `actorUserId`
- `actorRole`
- `previousValues` where relevant
- `newValues` where relevant
- `reason` where relevant
- `timestamp`
- Request ID or correlation ID where available

Audit records must not be editable through normal application flows.

---

## 9. User limits and technical protection

Do not enforce business quotas such as:

- Maximum users
- Maximum campaigns
- Maximum wallets
- Maximum recipients
- Plan-based feature access

However, keep system-level technical protection:

- Authentication rate limiting
- Login-attempt protection
- Request payload limits
- File-upload size limits
- API abuse protection
- Database query timeouts
- Email-send throttling

These are platform security controls, not subscription restrictions.

Do not expose `requestsPerMinute` as a commercial tenant limit in the Phase 1 UI.

Use a global platform configuration unless an existing technical requirement requires tenant-specific overrides.

---

## 10. Backend and security requirements

All tenant-management APIs must:

- Require authenticated ShelfMerch platform-admin access.
- Use platform-level RBAC.
- Validate all input.
- Never trust tenant ID, status or role information directly from the frontend.
- Prevent tenant admins from accessing platform control-plane routes.
- Use server-side tenant scoping.
- Return appropriate HTTP status codes.
- Avoid exposing sensitive fields.
- Record important changes in audit logs.

Do not weaken tenant isolation while adding Super Admin functionality.

### Add or update tests proving

- Tenant users cannot access `/platform/tenants` APIs.
- A tenant admin cannot update another tenant.
- A platform admin can update a tenant status.
- Suspension requires a reason.
- Archive requires a reason.
- Invalid status transitions are rejected.
- Archived tenants are excluded from the default query.
- Search and status filtering work.
- Pagination works.
- Duplicate slugs are rejected.
- Existing legacy trial records do not crash the page.
- User counts are informational and not restricted.

---

## 11. UI quality requirements

Preserve the existing ShelfMerch visual style.

Improve consistency where necessary:

- Use title case for visible statuses.
- Right-align numbers and currency.
- Use consistent badge styles.
- Use a sticky table header if supported by the existing layout.
- Use accessible contrast.
- Add tooltips only where genuinely useful.
- Avoid unnecessary animations.
- Avoid overcrowding the table.
- Use responsive behaviour for smaller screens.
- Keep actions discoverable through an overflow menu where appropriate.

Do not redesign the entire Control Plane navigation.

---

## 12. Non-goals

Do not implement:

- Subscription plans
- Upgrade or downgrade workflows
- Payment subscriptions
- Trial conversion
- Renewal dates
- Recurring billing
- Plan restrictions
- User quotas
- Campaign quotas
- Wallet quotas
- Feature entitlements
- Usage-based billing
- Organization/workspace hierarchy unless it already exists
- Major database rewrites
- Microservices
- New infrastructure without a demonstrated requirement

---

## 13. Expected delivery

Implement the changes, then provide:

1. A summary of what was changed.
2. A list of modified files.
3. Any new database fields.
4. Any migration scripts created.
5. API routes added or changed.
6. Tests added or updated.
7. Manual testing steps.
8. Any assumptions or unresolved issues.
9. Screenshots or a clear description of the final tenant-page behaviour.

Do not claim completion unless:

- The frontend builds successfully.
- The backend builds successfully.
- Relevant tests pass.
- No plan or subscription controls remain on the Phase 1 tenant page.
- User counts remain unrestricted.
- Status changes are audited and secured.
- Search, filtering and pagination function correctly.

Make the smallest safe set of changes needed to satisfy this Phase 1 scope.
