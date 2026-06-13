import * as tenantsService from './tenants.service.js';
import { signAccessToken } from '../auth/auth.service.js';
import { writeAudit } from '../../services/audit.service.js';
import { ForbiddenError } from '../../utils/errors.js';
import { env } from '../../config/env.js';

const IMPERSONATION_TTL = '15m';

export async function create(req, res) {
  const { tenant, admin, inviteToken } = await tenantsService.createTenant(req.body);
  writeAudit({ req, action: 'tenant.create', entityType: 'Tenant', entityId: tenant._id, after: tenant.toObject() });
  res.status(201).json({
    tenant,
    admin: { id: String(admin._id), email: admin.email, status: admin.status },
    ...(env.NODE_ENV !== 'production' ? { inviteToken } : {}),
  });
}

export async function me(req, res) {
  res.json(await tenantsService.getTenant(req.tenantId));
}

export async function updateMe(req, res) {
  const { before, after } = await tenantsService.updateTenant(req.tenantId, req.body);
  writeAudit({ req, action: 'tenant.update', entityType: 'Tenant', entityId: req.tenantId, before, after: after.toObject() });
  res.json(after);
}

export async function list(req, res) {
  res.json(await tenantsService.listTenants({ status: req.query.status }));
}

export async function getOne(req, res) {
  res.json(await tenantsService.getTenant(req.params.id));
}

export async function setStatus(req, res) {
  const tenant = await tenantsService.setTenantStatus(req.params.id, req.body.status);
  writeAudit({
    req,
    action: 'tenant.set_status',
    entityType: 'Tenant',
    entityId: tenant._id,
    after: { status: tenant.status, reason: req.body.reason ?? '' },
  });
  res.json(tenant);
}

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

export async function setLimits(req, res) {
  const { tenant, previous } = await tenantsService.setTenantLimits(req.params.id, req.body.limits);
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

export async function overview(req, res) {
  res.json(await tenantsService.getTenantOverview(req.params.id));
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
