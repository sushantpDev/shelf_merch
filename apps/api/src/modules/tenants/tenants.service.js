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
import { signImpersonationAccessToken } from '../auth/auth.service.js';
import { ApiError, ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors.js';

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

/** Match tenant Budget page: ignore empty drafts when rolling up wallet totals. */
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
    walletBudgetBalanceInr: funded,
    walletAllocatedInr: allocated,
    walletAvailableInr: Math.max(0, balance - earmarked),
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
      const [tenant] = await Tenant.create([{ name, slug, gstin, currency }], { session });
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

/** Resolve workspace owner from wallet ownerUserId, else earliest company_admin. */
export async function resolveWorkspaceOwner(tenantId) {
  const wallets = await Wallet.find({ tenantId }).sort({ createdAt: 1 }).select('ownerUserId').lean();
  let ownerUserId = wallets.find((w) => w.ownerUserId)?.ownerUserId ?? null;

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
  return { ...obj, owner };
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

/** §3.4 list — status, plan, wallet budget breakdown, and open orders in one call. */
export async function listTenants({ status } = {}) {
  const filter = status ? { status } : {};
  const tenants = await Tenant.find(filter).sort({ createdAt: -1 }).lean();
  const ids = tenants.map((t) => t._id);

  // Cross-tenant rollups for the platform list (aggregate bypasses find guards).
  const [walletRows, openOrderAgg] = await Promise.all([
    Wallet.find({ tenantId: { $in: ids } })
      .select('tenantId name balance totalAmount allocatedAmount status updatedAt fundingDocument')
      .lean(),
    Order.aggregate([
      { $match: { tenantId: { $in: ids }, status: { $in: OPEN_ORDER_STATUSES } } },
      { $group: { _id: '$tenantId', count: { $sum: 1 } } },
    ]),
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

  const entities = Object.fromEntries(entityAgg.map((r) => [String(r._id), r]));
  const orders = Object.fromEntries(openOrderAgg.map((r) => [String(r._id), r]));

  return tenants.map((t) => {
    const key = String(t._id);
    const primary = primaryByTenant.get(key);
    return {
      ...t,
      ...walletBudgetFields(primary, entities[key]?.allocated ?? 0),
      openOrders: orders[key]?.count ?? 0,
    };
  });
}

export async function setTenantStatus(tenantId, status) {
  const before = await getTenant(tenantId);
  before.status = status; // simple enum, not a state machine per spec
  await before.save();
  return before;
}

export async function setTenantPlan(tenantId, plan) {
  const tenant = await getTenant(tenantId);
  const previous = tenant.plan;
  tenant.plan = plan;
  await tenant.save();
  return { tenant, previous };
}

export async function setTenantLimits(tenantId, limits) {
  const tenant = await getTenant(tenantId);
  const previous = tenant.toObject().limits;
  Object.assign(tenant.limits, limits);
  await tenant.save();
  return { tenant, previous };
}

/** §3.4 overview drill-in — wallet, campaigns, orders, invoices, tickets in one call. */
export async function getTenantOverview(tenantId) {
  const tenant = await getTenant(tenantId);

  const [wallets, activeCampaigns, openOrders, unpaidInvoices, openTickets] = await Promise.all([
    Wallet.find({ tenantId }).select('name balance totalAmount allocatedAmount status updatedAt fundingDocument').lean(),
    Campaign.countDocuments({ tenantId, status: { $in: ['approved', 'launched', 'redemption_open'] } }),
    Order.countDocuments({ tenantId, status: { $in: OPEN_ORDER_STATUSES } }),
    Invoice.find({ tenantId, status: 'issued' }).select('invoiceNumber totalAmount type dueAt').lean(),
    SupportTicket.countDocuments({ tenantId, status: { $in: ['open', 'in_progress', 'waiting_on_customer'] } }),
  ]);

  const primary = pickPrimaryWallet(wallets);
  const entityAlloc = primary
    ? await Entity.aggregate([
        {
          $match: {
            tenantId: tenant._id,
            walletId: primary._id,
            deletedAt: null,
          },
        },
        { $group: { _id: null, allocated: { $sum: '$allocatedAmount' } } },
      ])
    : [];

  return {
    tenant,
    wallets,
    ...walletBudgetFields(primary, entityAlloc[0]?.allocated ?? 0),
    activeCampaigns,
    openOrders,
    unpaidInvoices,
    outstandingInr: unpaidInvoices.reduce((sum, i) => sum + (i.totalAmount ?? 0), 0),
    openTickets,
  };
}

/** §3.4 — re-issue the company_admin invite (lost access recovery). */
export async function resetAdminAccess(tenantId) {
  await getTenant(tenantId);
  const assignment = await RoleAssignment.findOne({ tenantId, role: 'company_admin' }).sort({ createdAt: 1 });
  if (!assignment) throw new NotFoundError('No company_admin found for this tenant');

  const admin = await User.findOne({ _id: assignment.userId });
  if (!admin) throw new NotFoundError('Admin user not found');

  // Force the user back into the invite flow with a fresh token.
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
