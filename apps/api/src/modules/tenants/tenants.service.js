import mongoose from 'mongoose';
import { Tenant } from './tenant.model.js';
import { User } from '../users/user.model.js';
import { RoleAssignment } from '../roles/roleAssignment.model.js';
import { Wallet } from '../wallets/wallet.model.js';
import { Entity } from '../entities/entity.model.js';
import { Campaign } from '../campaigns/campaign.model.js';
import { Order } from '../orders/order.model.js';
import { Invoice } from '../invoices/invoice.model.js';
import { SupportTicket } from '../support/supportTicket.model.js';
import { Contact } from '../contacts/contact.model.js';
import { inviteUser } from '../users/users.service.js';
import { listUsers } from '../users/users.service.js';
import { signImpersonationAccessToken } from '../auth/auth.service.js';
import { getPagination, paginatedResponse } from '../../utils/pagination.js';
import {
  ApiError,
  ConflictError,
  ForbiddenError,
  InvalidTransitionError,
  NotFoundError,
} from '../../utils/errors.js';

const OPEN_ORDER_STATUSES = [
  'created',
  'approved',
  'mockup_pending',
  'mockup_approved',
  'in_production',
  'qc_pending',
  'packed',
  'shipped',
];

/** Allowed Phase 1 status transitions. Legacy `trial` may activate/suspend/archive. */
const ALLOWED_TRANSITIONS = {
  trial: ['active', 'suspended', 'archived'],
  active: ['suspended', 'archived'],
  suspended: ['active', 'archived'],
  archived: ['active'],
};

function assertTransition(from, to) {
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new InvalidTransitionError('Tenant', from, to);
  }
}

function requireReason(reason, action) {
  if (!reason || !String(reason).trim()) {
    throw new ApiError(400, `A reason is required to ${action} a tenant`, 'REASON_REQUIRED');
  }
  return String(reason).trim();
}

function serializePrimaryAdmin(user) {
  if (!user) return null;
  return { id: String(user._id), name: user.name, email: user.email, status: user.status };
}

/** Match tenant Budget page: ignore empty drafts when choosing the primary wallet. */
function isEmptyDraftWallet(w) {
  const doc = w.fundingDocument ?? {};
  return (
    (w.status ?? 'draft') === 'draft' &&
    Number(w.balance ?? 0) === 0 &&
    Number(w.totalAmount ?? 0) === 0 &&
    Number(w.allocatedAmount ?? 0) === 0 &&
    Number(doc.requestedAmount ?? 0) === 0 &&
    !doc.fileUrl &&
    !doc.docNumber &&
    !doc.approvalStatus
  );
}

/** Same primary-wallet preference as the tenant Budget dashboard. */
function pickPrimaryWallet(wallets) {
  const visible = wallets.filter((w) => !isEmptyDraftWallet(w));
  if (!visible.length) return null;
  const stuckSetup = [...visible]
    .filter(
      (w) =>
        ['entities_added', 'budget_allocated', 'managers_assigned'].includes(w.status ?? '') &&
        (w.balance ?? 0) > 0 &&
        (w.allocatedAmount ?? 0) === 0,
    )
    .sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0))[0];
  if (stuckSetup) return stuckSetup;
  const active = visible.find((w) => w.status === 'active');
  if (active) return active;
  const funded = [...visible]
    .filter((w) => (w.balance ?? 0) > 0 || (w.totalAmount ?? 0) > 0)
    .sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0))[0];
  if (funded) return funded;
  return [...visible].sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))[0];
}

function walletBudgetFields(wallet, allocatedFromEntities) {
  if (!wallet) {
    return {
      walletBudgetBalanceInr: 0,
      walletAllocatedInr: 0,
      walletAvailableInr: 0,
      walletBalanceInr: 0,
    };
  }
  const balance = Math.round(Number(wallet.balance) || 0);
  const funded = Math.round(Number(wallet.totalAmount) || 0);
  const earmarked = Math.round(Number(wallet.allocatedAmount) || 0);
  const allocated = Math.round(Number(allocatedFromEntities) || 0);
  return {
    // Budget balance = lifetime funded (not reduced by department spend).
    walletBudgetBalanceInr: funded,
    walletAllocatedInr: allocated,
    walletAvailableInr: Math.max(0, balance - earmarked),
    // Legacy list column — keep as funded total so platform matches tenant Budget.
    walletBalanceInr: funded || balance,
  };
}

/** Platform-only: create tenant + first company_admin (invited). */
export async function createTenant({ name, slug, adminName, adminEmail, gstin = '', currency = 'INR' }) {
  const existing = await Tenant.findOne({ slug: slug.toLowerCase() });
  if (existing) throw new ConflictError(`Slug "${slug}" is already taken`);

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const [tenant] = await Tenant.create(
        [{ name, slug, gstin, currency, status: 'active' }],
        { session },
      );
      const { user, inviteToken } = await inviteUser(
        {
          tenantId: tenant._id,
          name: adminName,
          email: adminEmail,
          role: 'company_admin',
          scopeType: 'tenant',
        },
        session,
      );
      tenant.primaryAdminUserId = user._id;
      await tenant.save({ session });
      result = { tenant, admin: user, inviteToken };
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function getTenant(tenantId) {
  const tenant = await Tenant.findOne({ _id: tenantId });
  if (!tenant) throw new NotFoundError('Tenant not found');
  return tenant;
}

/** Resolve primary admin: explicit field → wallet owner → earliest company_admin. */
export async function resolveWorkspaceOwner(tenantId) {
  const tenant = await Tenant.findOne({ _id: tenantId }).select('primaryAdminUserId').lean();
  let ownerUserId = tenant?.primaryAdminUserId ?? null;

  if (!ownerUserId) {
    const wallets = await Wallet.find({ tenantId }).sort({ createdAt: 1 }).select('ownerUserId').lean();
    ownerUserId = wallets.find((w) => w.ownerUserId)?.ownerUserId ?? null;
  }

  if (!ownerUserId) {
    const assignment = await RoleAssignment.findOne({ tenantId, role: 'company_admin' })
      .sort({ createdAt: 1 })
      .lean();
    ownerUserId = assignment?.userId ?? null;
  }

  if (!ownerUserId) return null;

  const user = await User.findOne({ _id: ownerUserId, tenantId }).lean();
  if (!user) return null;

  return { id: String(user._id), name: user.name, email: user.email };
}

export async function getTenantWithOwner(tenantId) {
  const tenant = await getTenant(tenantId);
  const owner = await resolveWorkspaceOwner(tenantId);
  const obj = tenant.toObject ? tenant.toObject() : tenant;
  return { ...obj, owner, primaryAdmin: owner };
}

/** Transfer workspace ownership to another active company_admin. */
export async function transferOwnership({ tenantId, actorUserId, newOwnerUserId }) {
  const currentOwner = await resolveWorkspaceOwner(tenantId);
  if (!currentOwner) {
    throw new ApiError(422, 'Workspace has no owner to transfer from', 'NO_OWNER');
  }
  if (String(actorUserId) !== currentOwner.id) {
    throw new ForbiddenError('Only the workspace owner can transfer ownership');
  }
  if (String(newOwnerUserId) === currentOwner.id) {
    throw new ApiError(422, 'Cannot transfer ownership to yourself', 'INVALID_RECIPIENT');
  }

  const newOwner = await User.findOne({ _id: newOwnerUserId, tenantId, status: 'active' });
  if (!newOwner) {
    throw new ApiError(422, 'Recipient must be an active user in this workspace', 'INVALID_RECIPIENT');
  }

  const assignment = await RoleAssignment.findOne({
    tenantId,
    userId: newOwnerUserId,
    role: 'company_admin',
  });
  if (!assignment) {
    throw new ApiError(
      422,
      'Recipient must be an active company admin in this workspace',
      'INVALID_RECIPIENT',
    );
  }

  const oldOwner = await User.findOne({ _id: currentOwner.id, tenantId });
  if (!oldOwner) throw new NotFoundError('Current owner not found');

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      await Tenant.updateOne({ _id: tenantId }, { primaryAdminUserId: newOwnerUserId }).session(session);
      await Wallet.updateMany({ tenantId }, { ownerUserId: newOwnerUserId }).session(session);

      await Contact.updateMany(
        { tenantId, email: oldOwner.email.toLowerCase(), role: 'Owner' },
        { role: 'Admin' },
      ).session(session);

      await Contact.updateOne(
        { tenantId, email: newOwner.email.toLowerCase() },
        { role: 'Owner' },
      ).session(session);

      result = {
        id: String(newOwner._id),
        name: newOwner.name,
        email: newOwner.email,
      };
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function updateTenant(tenantId, patch) {
  const before = await getTenant(tenantId);
  const after = await Tenant.findOneAndUpdate({ _id: tenantId }, patch, { new: true });
  return { before: before.toObject(), after };
}

/** Platform settings update with slug uniqueness + confirmation. */
export async function updatePlatformTenant(tenantId, patch) {
  const tenant = await getTenant(tenantId);
  const before = tenant.toObject();
  const { confirmSlugChange, ...fields } = patch;

  if (fields.slug && fields.slug.toLowerCase() !== tenant.slug) {
    if (!confirmSlugChange) {
      throw new ApiError(
        400,
        'Changing the slug may affect tenant URLs — set confirmSlugChange to proceed',
        'SLUG_CONFIRMATION_REQUIRED',
      );
    }
    const clash = await Tenant.findOne({ slug: fields.slug.toLowerCase(), _id: { $ne: tenantId } });
    if (clash) throw new ConflictError(`Slug "${fields.slug}" is already taken`);
    tenant.slug = fields.slug.toLowerCase();
  }

  if (fields.name !== undefined) tenant.name = fields.name;
  if (fields.logoUrl !== undefined) tenant.logoUrl = fields.logoUrl;
  if (fields.currency !== undefined) tenant.currency = fields.currency;
  if (fields.gstin !== undefined) tenant.gstin = fields.gstin;
  if (fields.billingAddress !== undefined) {
    tenant.billingAddress = { ...tenant.billingAddress?.toObject?.() ?? tenant.billingAddress ?? {}, ...fields.billingAddress };
  }

  await tenant.save();
  return { before, after: tenant };
}

/**
 * Assign primary tenant admin. Must be an existing active member of the tenant.
 * Platform admins and tenant admins remain separate role scopes.
 */
export async function setPrimaryAdmin(tenantId, userId, { reason } = {}) {
  const tenant = await getTenant(tenantId);
  const user = await User.findOne({ _id: userId, tenantId, status: 'active' });
  if (!user) {
    throw new ApiError(422, 'Primary admin must be an existing active tenant member', 'INVALID_PRIMARY_ADMIN');
  }

  const membership = await RoleAssignment.findOne({ tenantId, userId });
  if (!membership) {
    throw new ApiError(422, 'User is not a member of this tenant', 'INVALID_PRIMARY_ADMIN');
  }

  const previous = tenant.primaryAdminUserId ? String(tenant.primaryAdminUserId) : null;
  tenant.primaryAdminUserId = user._id;
  await tenant.save();
  await Wallet.updateMany({ tenantId }, { ownerUserId: user._id });

  return {
    tenant,
    previousPrimaryAdminUserId: previous,
    primaryAdmin: serializePrimaryAdmin(user),
    reason: reason ?? '',
  };
}

function buildTenantListFilter({ status, search, primaryAdminTenantIds }) {
  const filter = {};

  if (!status || status === 'all') {
    // no status filter — show all non-deleted tenants
  } else if (status === 'operational') {
    filter.status = { $in: ['active', 'suspended'] };
  } else {
    filter.status = status;
  }

  if (search?.trim()) {
    const q = search.trim();
    const or = [
      { name: { $regex: q, $options: 'i' } },
      { slug: { $regex: q, $options: 'i' } },
    ];
    if (primaryAdminTenantIds?.length) {
      or.push({ _id: { $in: primaryAdminTenantIds } });
    }
    filter.$or = or;
  }

  return filter;
}

async function findTenantIdsByPrimaryAdminEmail(search) {
  if (!search?.trim()) return [];
  const users = await User.find({
    email: { $regex: search.trim(), $options: 'i' },
    tenantId: { $ne: null },
  })
    .select('_id')
    .lean();
  if (!users.length) return [];
  const userIds = users.map((u) => u._id);
  const tenants = await Tenant.find({ primaryAdminUserId: { $in: userIds } }).select('_id').lean();
  // Also match via company_admin when primaryAdminUserId is unset
  const assignments = await RoleAssignment.find({
    userId: { $in: userIds },
    role: 'company_admin',
  })
    .select('tenantId')
    .lean();
  const ids = [
    ...tenants.map((t) => t._id),
    ...assignments.map((a) => a.tenantId),
  ];
  return [...new Map(ids.map((id) => [String(id), id])).values()];
}

async function enrichTenantRows(tenants) {
  if (!tenants.length) return [];
  const ids = tenants.map((t) => t._id);

  const [walletRows, openOrderAgg, userCountAgg, lastActiveAgg, primaryAdmins] = await Promise.all([
    Wallet.find({ tenantId: { $in: ids } })
      .select('tenantId name balance totalAmount allocatedAmount status updatedAt fundingDocument')
      .lean(),
    Order.aggregate([
      { $match: { tenantId: { $in: ids }, status: { $in: OPEN_ORDER_STATUSES } } },
      { $group: { _id: '$tenantId', count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { tenantId: { $in: ids } } },
      { $group: { _id: '$tenantId', count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { tenantId: { $in: ids }, lastLoginAt: { $ne: null } } },
      { $group: { _id: '$tenantId', lastActiveAt: { $max: '$lastLoginAt' } } },
    ]),
    User.find({
      _id: { $in: tenants.map((t) => t.primaryAdminUserId).filter(Boolean) },
    })
      .select('name email status')
      .lean(),
  ]);

  const walletsByTenant = new Map();
  for (const w of walletRows) {
    const key = String(w.tenantId);
    if (!walletsByTenant.has(key)) walletsByTenant.set(key, []);
    walletsByTenant.get(key).push(w);
  }

  const primaryByTenant = new Map();
  const primaryWalletIds = [];
  for (const t of tenants) {
    const primary = pickPrimaryWallet(walletsByTenant.get(String(t._id)) ?? []);
    if (primary) {
      primaryByTenant.set(String(t._id), primary);
      primaryWalletIds.push(primary._id);
    }
  }

  const entityAgg = primaryWalletIds.length
    ? await Entity.aggregate([
        {
          $match: {
            tenantId: { $in: ids },
            walletId: { $in: primaryWalletIds },
            deletedAt: null,
          },
        },
        { $group: { _id: '$tenantId', allocated: { $sum: '$allocatedAmount' } } },
      ])
    : [];

  const byId = (rows) => Object.fromEntries(rows.map((r) => [String(r._id), r]));
  const entities = byId(entityAgg);
  const orders = byId(openOrderAgg);
  const userCounts = byId(userCountAgg);
  const lastActive = byId(lastActiveAgg);
  const adminById = Object.fromEntries(primaryAdmins.map((u) => [String(u._id), u]));

  // Fallback primary admin for tenants without primaryAdminUserId
  const missingOwnerIds = tenants.filter((t) => !t.primaryAdminUserId).map((t) => t._id);
  const fallbackOwners = {};
  if (missingOwnerIds.length) {
    const assignments = await RoleAssignment.find({
      tenantId: { $in: missingOwnerIds },
      role: 'company_admin',
    })
      .sort({ createdAt: 1 })
      .lean();
    const firstByTenant = {};
    for (const a of assignments) {
      const key = String(a.tenantId);
      if (!firstByTenant[key]) firstByTenant[key] = a.userId;
    }
    const fallbackUsers = await User.find({
      _id: { $in: Object.values(firstByTenant) },
    })
      .select('name email status')
      .lean();
    const userMap = Object.fromEntries(fallbackUsers.map((u) => [String(u._id), u]));
    for (const [tid, uid] of Object.entries(firstByTenant)) {
      fallbackOwners[tid] = userMap[String(uid)] ?? null;
    }
  }

  return tenants.map((t) => {
    const key = String(t._id);
    const adminUser = t.primaryAdminUserId
      ? adminById[String(t.primaryAdminUserId)]
      : fallbackOwners[key];
    const primary = primaryByTenant.get(key);
    return {
      ...t,
      ...walletBudgetFields(primary, entities[key]?.allocated ?? 0),
      openOrders: orders[key]?.count ?? 0,
      userCount: userCounts[key]?.count ?? 0,
      lastActiveAt: lastActive[key]?.lastActiveAt ?? null,
      primaryAdmin: serializePrimaryAdmin(adminUser),
    };
  });
}

/** Phase 1 operational tenant directory — server-side search, filter, sort, pagination. */
export async function listTenants(query = {}) {
  const { page, limit, skip } = getPagination(query, { defaultLimit: 20, maxLimit: 100 });
  const sortKey = query.sort || 'createdAt';
  const sortOrder = query.order === 'asc' ? 1 : -1;

  let primaryAdminTenantIds = [];
  if (query.search?.trim()) {
    primaryAdminTenantIds = await findTenantIdsByPrimaryAdminEmail(query.search);
  }

  const filter = buildTenantListFilter({
    status: query.status,
    search: query.search,
    primaryAdminTenantIds,
  });

  // lastActiveAt requires a computed sort — fetch ids + lastActive then page in memory for that sort only
  if (sortKey === 'lastActiveAt') {
    const all = await Tenant.find(filter).select('_id').lean();
    const ids = all.map((t) => t._id);
    const lastActiveAgg = ids.length
      ? await User.aggregate([
          { $match: { tenantId: { $in: ids }, lastLoginAt: { $ne: null } } },
          { $group: { _id: '$tenantId', lastActiveAt: { $max: '$lastLoginAt' } } },
        ])
      : [];
    const lastMap = Object.fromEntries(lastActiveAgg.map((r) => [String(r._id), r.lastActiveAt]));
    const sorted = [...ids].sort((a, b) => {
      const aT = lastMap[String(a)] ? new Date(lastMap[String(a)]).getTime() : 0;
      const bT = lastMap[String(b)] ? new Date(lastMap[String(b)]).getTime() : 0;
      return sortOrder === 1 ? aT - bT : bT - aT;
    });
    const total = sorted.length;
    const pageIds = sorted.slice(skip, skip + limit);
    const tenants = await Tenant.find({ _id: { $in: pageIds } }).lean();
    const byId = Object.fromEntries(tenants.map((t) => [String(t._id), t]));
    const ordered = pageIds.map((id) => byId[String(id)]).filter(Boolean);
    const items = await enrichTenantRows(ordered);
    return paginatedResponse(items, total, { page, limit });
  }

  const sort = sortKey === 'name' ? { name: sortOrder } : { createdAt: sortOrder };
  const [tenants, total] = await Promise.all([
    Tenant.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Tenant.countDocuments(filter),
  ]);
  const items = await enrichTenantRows(tenants);
  return paginatedResponse(items, total, { page, limit });
}

export async function activateTenant(tenantId, { reason } = {}) {
  const tenant = await getTenant(tenantId);
  const previousStatus = tenant.status;
  assertTransition(previousStatus, 'active');
  // Restore from suspended/archived requires a reason; legacy trial → active does not.
  if (previousStatus === 'suspended' || previousStatus === 'archived') {
    requireReason(reason, 'restore');
  }
  tenant.status = 'active';
  await tenant.save();
  return { tenant, previousStatus, reason: reason?.trim() || '', action: previousStatus === 'trial' ? 'activated' : 'restored' };
}

export async function suspendTenant(tenantId, { reason } = {}) {
  const tenant = await getTenant(tenantId);
  const previousStatus = tenant.status;
  assertTransition(previousStatus, 'suspended');
  const trimmed = requireReason(reason, 'suspend');
  tenant.status = 'suspended';
  await tenant.save();
  return { tenant, previousStatus, reason: trimmed, action: 'suspended' };
}

export async function archiveTenant(tenantId, { reason } = {}) {
  const tenant = await getTenant(tenantId);
  const previousStatus = tenant.status;
  assertTransition(previousStatus, 'archived');
  const trimmed = requireReason(reason, 'archive');
  tenant.status = 'archived';
  await tenant.save();
  return { tenant, previousStatus, reason: trimmed, action: 'archived' };
}

export async function restoreTenant(tenantId, { reason } = {}) {
  const tenant = await getTenant(tenantId);
  const previousStatus = tenant.status;
  if (previousStatus !== 'archived' && previousStatus !== 'suspended') {
    throw new InvalidTransitionError('Tenant', previousStatus, 'active');
  }
  return activateTenant(tenantId, { reason });
}

/**
 * Dispatch status change to the appropriate Phase 1 transition method.
 * Rejects unrestricted updates that skip the state machine.
 */
export async function setTenantStatus(tenantId, status, { reason } = {}) {
  if (status === 'suspended') return suspendTenant(tenantId, { reason });
  if (status === 'archived') return archiveTenant(tenantId, { reason });
  if (status === 'active') return activateTenant(tenantId, { reason });
  throw new ApiError(400, `Unsupported Phase 1 status: ${status}`, 'INVALID_STATUS');
}

/** @deprecated Phase 1 has no subscription plans. */
export async function setTenantPlan(tenantId, plan) {
  const tenant = await getTenant(tenantId);
  const previous = tenant.plan;
  tenant.plan = plan;
  await tenant.save();
  return { tenant, previous };
}

/** @deprecated Phase 1 does not enforce business quotas via this API. */
export async function setTenantLimits(tenantId, limits) {
  const tenant = await getTenant(tenantId);
  const previous = tenant.toObject().limits;
  Object.assign(tenant.limits, limits);
  await tenant.save();
  return { tenant, previous };
}

/** Enriched overview for the tenant detail page. */
export async function getTenantOverview(tenantId) {
  const tenant = await getTenant(tenantId);
  const primaryAdmin = await resolveWorkspaceOwner(tenantId);

  const [wallets, activeCampaigns, openOrders, unpaidInvoices, openTickets, userCount, lastActive] =
    await Promise.all([
      Wallet.find({ tenantId }).select('name balance totalAmount allocatedAmount status updatedAt fundingDocument').lean(),
      Campaign.countDocuments({ tenantId, status: { $in: ['approved', 'launched', 'redemption_open'] } }),
      Order.countDocuments({ tenantId, status: { $in: OPEN_ORDER_STATUSES } }),
      Invoice.find({ tenantId, status: 'issued' }).select('invoiceNumber totalAmount type dueAt').lean(),
      SupportTicket.countDocuments({
        tenantId,
        status: { $in: ['open', 'in_progress', 'waiting_on_customer'] },
      }),
      User.countDocuments({ tenantId }),
      User.findOne({ tenantId, lastLoginAt: { $ne: null } })
        .sort({ lastLoginAt: -1 })
        .select('lastLoginAt')
        .lean(),
    ]);

  const primary = pickPrimaryWallet(wallets);
  const entityAgg = await Entity.aggregate([
    { $match: { tenantId: tenant._id, deletedAt: null } },
    { $group: { _id: '$walletId', allocated: { $sum: '$allocatedAmount' } } },
  ]);
  const allocatedByWallet = Object.fromEntries(
    entityAgg.map((r) => [String(r._id), Math.round(Number(r.allocated) || 0)]),
  );
  const primaryAllocated = primary ? (allocatedByWallet[String(primary._id)] ?? 0) : 0;

  const walletRows = wallets.map((w) => {
    const balance = Math.round(Number(w.balance) || 0);
    const earmarked = Math.round(Number(w.allocatedAmount) || 0);
    return {
      ...w,
      approvedBudgetInr: Math.round(Number(w.totalAmount) || 0),
      allocatedBudgetInr: allocatedByWallet[String(w._id)] ?? 0,
      remainingBalanceInr: Math.max(0, balance - earmarked),
    };
  });

  return {
    tenant,
    primaryAdmin,
    userCount,
    lastActiveAt: lastActive?.lastLoginAt ?? null,
    wallets: walletRows,
    ...walletBudgetFields(primary, primaryAllocated),
    activeCampaigns,
    openOrders,
    unpaidInvoices,
    outstandingInr: unpaidInvoices.reduce((sum, i) => sum + (i.totalAmount ?? 0), 0),
    openTickets,
  };
}

export async function listTenantUsers(tenantId) {
  await getTenant(tenantId);
  return listUsers({ tenantId });
}

/** §3.4 — re-issue the company_admin invite (lost access recovery). */
export async function resetAdminAccess(tenantId) {
  await getTenant(tenantId);
  const assignment = await RoleAssignment.findOne({ tenantId, role: 'company_admin' }).sort({ createdAt: 1 });
  if (!assignment) throw new NotFoundError('No company_admin found for this tenant');

  const admin = await User.findOne({ _id: assignment.userId });
  if (!admin) throw new NotFoundError('Admin user not found');

  admin.status = 'invited';
  await admin.save();
  const { user, inviteToken } = await inviteUser({
    tenantId,
    name: admin.name,
    email: admin.email,
    role: 'company_admin',
    scopeType: 'tenant',
  });
  return { admin: user, inviteToken };
}

export async function startImpersonation({ user, tenantId, reason, reasonCategory }) {
  const tenant = await Tenant.findOne({ _id: tenantId });
  if (!tenant) throw new NotFoundError('Tenant not found');

  const impersonation = {
    isImpersonating: true,
    originalUserId: String(user._id),
    reason,
    reasonCategory,
  };

  const accessToken = signImpersonationAccessToken(
    user,
    {
      tenantId: tenant._id,
      role: 'platform_super_admin',
      scopeType: 'platform',
      scopeId: null,
      assignedEntityIds: [],
    },
    impersonation,
  );

  return {
    accessToken,
    expiresIn: 900,
    tenant: { id: String(tenant._id), name: tenant.name },
    impersonation,
  };
}
