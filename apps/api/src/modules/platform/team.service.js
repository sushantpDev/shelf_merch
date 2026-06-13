import { User } from '../users/user.model.js';
import { RoleAssignment, PLATFORM_ROLES } from '../roles/roleAssignment.model.js';
import { AuditLog } from '../auditLogs/auditLog.model.js';
import { inviteUser } from '../users/users.service.js';
import { ApiError, NotFoundError } from '../../utils/errors.js';
import { getPagination, paginatedResponse } from '../../utils/pagination.js';

/** §5 — internal ShelfMerch org: tenantId null, scopeType platform. */

export async function listTeam() {
  const assignments = await RoleAssignment.find({ tenantId: null, scopeType: 'platform' }).lean();
  const userIds = assignments.map((a) => a.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));

  return assignments
    .map((a) => {
      const user = byId.get(String(a.userId));
      if (!user) return null;
      return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        status: user.status,
        role: a.role,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      };
    })
    .filter(Boolean);
}

export async function invitePlatformUser({ name, email, role }) {
  if (!PLATFORM_ROLES.includes(role)) {
    throw new ApiError(422, `Role must be one of: ${PLATFORM_ROLES.join(', ')}`, 'INVALID_ROLE');
  }
  return inviteUser({ tenantId: null, name, email, role, scopeType: 'platform' });
}

async function getPlatformUser(userId) {
  const assignment = await RoleAssignment.findOne({ userId, tenantId: null, scopeType: 'platform' });
  if (!assignment) throw new NotFoundError('Platform user not found');
  const user = await User.findOne({ _id: userId });
  if (!user) throw new NotFoundError('Platform user not found');
  return { user, assignment };
}

export async function changePlatformRole({ userId, role }) {
  if (!PLATFORM_ROLES.includes(role)) {
    throw new ApiError(422, `Role must be one of: ${PLATFORM_ROLES.join(', ')}`, 'INVALID_ROLE');
  }
  const { user, assignment } = await getPlatformUser(userId);
  const before = assignment.role;
  assignment.role = role;
  await assignment.save();
  return { user, before, after: role };
}

export async function deactivatePlatformUser(userId) {
  const { user } = await getPlatformUser(userId);
  user.status = 'suspended';
  await user.save();
  return user;
}

export async function reactivatePlatformUser(userId) {
  const { user } = await getPlatformUser(userId);
  user.status = 'active';
  await user.save();
  return user;
}

/** §5 — a platform user's activity = their audit-log trail. */
export async function getPlatformUserActivity(userId, query) {
  await getPlatformUser(userId);
  const { page, limit, skip } = getPagination(query);
  const filter = { actorUserId: userId };
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return paginatedResponse(items, total, { page, limit });
}
