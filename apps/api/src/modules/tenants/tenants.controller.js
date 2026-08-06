import * as tenantsService from './tenants.service.js';
import { writeAudit } from '../../services/audit.service.js';
import { uploadFile } from '../../services/storage.service.js';
import { getTenantUsage } from '../../services/usage.service.js';
import { clearTenantLimitCache } from '../../services/tenantGuardrails.service.js';
import { env } from '../../config/env.js';

const STATUS_AUDIT_ACTIONS = {
  activated: 'tenant.activated',
  restored: 'tenant.restored',
  suspended: 'tenant.suspended',
  archived: 'tenant.archived',
};

export async function create(req, res) {
  const { tenant, admin, inviteToken } = await tenantsService.createTenant(req.body);
  writeAudit({
    req,
    action: 'tenant.create',
    entityType: 'Tenant',
    entityId: tenant._id,
    tenantId: tenant._id,
    after: tenant.toObject(),
  });
  res.status(201).json({
    tenant,
    admin: { id: String(admin._id), email: admin.email, status: admin.status },
    ...(env.NODE_ENV !== 'production' ? { inviteToken } : {}),
  });
}

export async function me(req, res) {
  res.json(await tenantsService.getTenantWithOwner(req.tenantId));
}

export async function transferOwnership(req, res) {
  const owner = await tenantsService.transferOwnership({
    tenantId: req.tenantId,
    actorUserId: req.user.userId,
    newOwnerUserId: req.body.newOwnerUserId,
  });
  writeAudit({
    req,
    action: 'tenant.transfer_ownership',
    entityType: 'Tenant',
    entityId: req.tenantId,
    after: { owner },
  });
  res.json({ owner });
}

export async function updateMe(req, res) {
  const { before, after } = await tenantsService.updateTenant(req.tenantId, req.body);
  writeAudit({
    req,
    action: 'tenant.update',
    entityType: 'Tenant',
    entityId: req.tenantId,
    before,
    after: after.toObject(),
  });
  res.json(after);
}

export async function uploadLogo(req, res) {
  const { url } = await uploadFile({ tenantId: req.tenantId, kind: 'logo', file: req.file });
  res.status(201).json({ logoUrl: url });
}

export async function list(req, res) {
  res.json(await tenantsService.listTenants(req.query));
}

export async function getOne(req, res) {
  const overview = await tenantsService.getTenantOverview(req.params.id);
  res.json({
    ...overview.tenant.toObject(),
    primaryAdmin: overview.primaryAdmin,
    userCount: overview.userCount,
    lastActiveAt: overview.lastActiveAt,
    walletBalanceInr: overview.walletBalanceInr,
    walletBudgetBalanceInr: overview.walletBudgetBalanceInr,
    walletAllocatedInr: overview.walletAllocatedInr,
    walletAvailableInr: overview.walletAvailableInr,
    openOrders: overview.openOrders,
  });
}

export async function updatePlatform(req, res) {
  const { before, after } = await tenantsService.updatePlatformTenant(req.params.id, req.body);
  const slugChanged = before.slug !== after.slug;
  const nameChanged = before.name !== after.name;
  writeAudit({
    req,
    action: slugChanged
      ? 'tenant.slug_changed'
      : nameChanged
        ? 'tenant.name_changed'
        : 'tenant.settings_changed',
    entityType: 'Tenant',
    entityId: after._id,
    tenantId: after._id,
    before,
    after: after.toObject(),
  });
  res.json(after);
}

export async function setPrimaryAdmin(req, res) {
  const result = await tenantsService.setPrimaryAdmin(req.params.id, req.body.userId, {
    reason: req.body.reason,
  });
  writeAudit({
    req,
    action: 'tenant.primary_admin_changed',
    entityType: 'Tenant',
    entityId: result.tenant._id,
    tenantId: result.tenant._id,
    before: { primaryAdminUserId: result.previousPrimaryAdminUserId },
    after: {
      primaryAdminUserId: String(result.tenant.primaryAdminUserId),
      primaryAdmin: result.primaryAdmin,
      reason: result.reason,
    },
  });
  res.json({ tenant: result.tenant, primaryAdmin: result.primaryAdmin });
}

export async function setStatus(req, res) {
  const result = await tenantsService.setTenantStatus(req.params.id, req.body.status, {
    reason: req.body.reason,
  });
  const { tenant, previousStatus, reason, action } = result;
  writeAudit({
    req,
    action: STATUS_AUDIT_ACTIONS[action] ?? 'tenant.set_status',
    entityType: 'Tenant',
    entityId: tenant._id,
    tenantId: tenant._id,
    before: { status: previousStatus },
    after: { status: tenant.status, reason },
  });
  writeAudit({
    req,
    action: 'tenant.status_changed',
    entityType: 'Tenant',
    entityId: tenant._id,
    tenantId: tenant._id,
    before: { status: previousStatus },
    after: { status: tenant.status, reason },
  });
  res.json(tenant);
}

/** @deprecated Phase 1 has no subscription plans. */
export async function setPlan(req, res) {
  const { tenant, previous } = await tenantsService.setTenantPlan(req.params.id, req.body.plan);
  writeAudit({
    req,
    action: 'tenant.set_plan',
    entityType: 'Tenant',
    entityId: tenant._id,
    before: { plan: previous },
    after: { plan: tenant.plan },
  });
  res.json(tenant);
}

/** @deprecated Phase 1 does not expose business quotas in the UI. */
export async function setLimits(req, res) {
  const { tenant, previous } = await tenantsService.setTenantLimits(req.params.id, req.body.limits);
  clearTenantLimitCache(req.params.id);
  writeAudit({
    req,
    action: 'tenant.set_limits',
    entityType: 'Tenant',
    entityId: tenant._id,
    before: { limits: previous },
    after: { limits: tenant.toObject().limits },
  });
  res.json(tenant);
}

export async function usage(req, res) {
  res.json(await getTenantUsage(req.params.id, req.query.period));
}

export async function overview(req, res) {
  res.json(await tenantsService.getTenantOverview(req.params.id));
}

export async function listUsers(req, res) {
  res.json(await tenantsService.listTenantUsers(req.params.id));
}

export async function resetAdminAccess(req, res) {
  const { admin, inviteToken } = await tenantsService.resetAdminAccess(req.params.id);
  writeAudit({
    req,
    action: 'tenant.reset_admin_access',
    entityType: 'Tenant',
    entityId: req.params.id,
    after: { adminEmail: admin.email },
  });
  res.json({
    admin: { id: String(admin._id), email: admin.email, status: admin.status },
    ...(env.NODE_ENV !== 'production' ? { inviteToken } : {}),
  });
}

export async function impersonate(req, res) {
  const result = await tenantsService.startImpersonation({
    user: { _id: req.user.userId },
    tenantId: req.params.tenantId,
    reason: req.body.reason,
    reasonCategory: req.body.reasonCategory,
  });
  writeAudit({
    req,
    action: 'impersonation.start',
    entityType: 'Tenant',
    entityId: req.params.tenantId,
    after: {
      reason: req.body.reason,
      reasonCategory: req.body.reasonCategory,
      impersonation: result.impersonation,
    },
  });
  res.json({
    accessToken: result.accessToken,
    expiresIn: result.expiresIn,
    tenant: result.tenant,
  });
}
