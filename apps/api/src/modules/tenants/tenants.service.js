import mongoose from 'mongoose';
import { Tenant } from './tenant.model.js';
import { User } from '../users/user.model.js';
import { RoleAssignment } from '../roles/roleAssignment.model.js';
import { Wallet } from '../wallets/wallet.model.js';
import { Campaign } from '../campaigns/campaign.model.js';
import { Order } from '../orders/order.model.js';
import { Invoice } from '../invoices/invoice.model.js';
import { SupportTicket } from '../support/supportTicket.model.js';
import { inviteUser } from '../users/users.service.js';
import { signImpersonationAccessToken } from '../auth/auth.service.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';

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

export async function updateTenant(tenantId, patch) {
  const before = await getTenant(tenantId);
  const after = await Tenant.findOneAndUpdate({ _id: tenantId }, patch, { new: true });
  return { before: before.toObject(), after };
}

/** §3.4 list — status, plan, wallet balance, open orders, outstanding in one call. */
export async function listTenants({ status } = {}) {
  const filter = status ? { status } : {};
  const tenants = await Tenant.find(filter).sort({ createdAt: -1 }).lean();
  const ids = tenants.map((t) => t._id);

  // aggregate() is not covered by the tenantScope query guard; these are
  // intentional cross-tenant rollups for the platform list view.
  const [walletAgg, openOrderAgg, unpaidInvoiceAgg] = await Promise.all([
    Wallet.aggregate([
      { $match: { tenantId: { $in: ids } } },
      { $group: { _id: '$tenantId', balance: { $sum: '$balance' } } },
    ]),
    Order.aggregate([
      { $match: { tenantId: { $in: ids }, status: { $in: OPEN_ORDER_STATUSES } } },
      { $group: { _id: '$tenantId', count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { tenantId: { $in: ids }, status: 'issued' } },
      { $group: { _id: '$tenantId', outstanding: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const byId = (rows) => Object.fromEntries(rows.map((r) => [String(r._id), r]));
  const wallets = byId(walletAgg);
  const orders = byId(openOrderAgg);
  const invoices = byId(unpaidInvoiceAgg);

  return tenants.map((t) => ({
    ...t,
    walletBalanceInr: wallets[String(t._id)]?.balance ?? 0,
    openOrders: orders[String(t._id)]?.count ?? 0,
    outstandingInr: invoices[String(t._id)]?.outstanding ?? 0,
  }));
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
    Wallet.find({ tenantId }).select('name balance allocatedAmount status').lean(),
    Campaign.countDocuments({ tenantId, status: { $in: ['approved', 'launched', 'redemption_open'] } }),
    Order.countDocuments({ tenantId, status: { $in: OPEN_ORDER_STATUSES } }),
    Invoice.find({ tenantId, status: 'issued' }).select('invoiceNumber totalAmount type dueAt').lean(),
    SupportTicket.countDocuments({ tenantId, status: { $in: ['open', 'in_progress', 'waiting_on_customer'] } }),
  ]);

  return {
    tenant,
    wallets,
    walletBalanceInr: wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0),
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
