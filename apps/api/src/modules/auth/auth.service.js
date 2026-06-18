import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { sendPasswordResetEmail } from '../../services/email.service.js';
import mongoose from 'mongoose';
import { User } from '../users/user.model.js';
import { RoleAssignment } from '../roles/roleAssignment.model.js';
import { RefreshToken } from './refreshToken.model.js';
import { Tenant } from '../tenants/tenant.model.js';
import { Wallet } from '../wallets/wallet.model.js';
import {
  createSession,
  getSession,
  isSessionStoreReady,
  revokeAllUserSessions,
  revokeSession,
} from '../../services/session.service.js';
import { ApiError, ConflictError, UnauthorizedError } from '../../utils/errors.js';

const BCRYPT_ROUNDS = 12;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

export function signAccessToken(user, roleAssignment, impersonation = null, { expiresIn } = {}) {
  const payload = {
    sub: String(user._id),
    tenantId: roleAssignment.tenantId ? String(roleAssignment.tenantId) : null,
    role: roleAssignment.role,
    scopeType: roleAssignment.scopeType,
    scopeId: roleAssignment.scopeId ? String(roleAssignment.scopeId) : null,
    assignedEntityIds: (roleAssignment.assignedEntityIds ?? []).map(String),
    ...(impersonation ? { impersonation } : {}),
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: expiresIn ?? env.JWT_ACCESS_TTL });
}

/** Short-lived token for platform impersonation (§6.4). */
export function signImpersonationAccessToken(user, roleAssignment, impersonation) {
  const payload = {
    sub: String(user._id),
    tenantId: roleAssignment.tenantId ? String(roleAssignment.tenantId) : null,
    role: roleAssignment.role,
    scopeType: roleAssignment.scopeType,
    scopeId: roleAssignment.scopeId ? String(roleAssignment.scopeId) : null,
    assignedEntityIds: (roleAssignment.assignedEntityIds ?? []).map(String),
    impersonation,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

async function issueRefreshToken(userId, { ip = '', userAgent = '' } = {}) {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = sha256(token);
  if (await isSessionStoreReady()) {
    await createSession({ userId, tokenHash, ip, userAgent });
  } else {
    await RefreshToken.create({
      userId,
      tokenHash,
      ip,
      userAgent,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
  }
  return token;
}

async function revokeStoredRefreshToken(tokenHash, userId = null) {
  if (await isSessionStoreReady()) {
    const session = userId ? { userId: String(userId) } : await getSession(tokenHash);
    await revokeSession({ tokenHash, userId: session?.userId ?? userId });
  }
  await RefreshToken.updateOne({ tokenHash, revokedAt: null }, { revokedAt: new Date() });
}

export async function getPrimaryRoleAssignment(userId) {
  const assignments = await RoleAssignment.find({ userId }).sort({ createdAt: 1 });
  if (!assignments.length) throw new ApiError(403, 'User has no role assignment', 'NO_ROLE');
  // Prefer tenant/entity scope when a user has both platform and tenant hats.
  const tenantScoped = assignments.find((a) => a.scopeType !== 'platform' && a.tenantId);
  return tenantScoped ?? assignments[0];
}

function publicUser(user, roleAssignment) {
  return {
    id: String(user._id),
    tenantId: roleAssignment.tenantId ? String(roleAssignment.tenantId) : null,
    name: user.name,
    email: user.email,
    role: roleAssignment.role,
    scopeType: roleAssignment.scopeType,
    assignedEntityIds: (roleAssignment.assignedEntityIds ?? []).map(String),
  };
}

function slugifyCompany(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base.length >= 2 ? base : 'workspace';
}

async function uniqueTenantSlug(companyName) {
  let slug = slugifyCompany(companyName);
  let attempt = 0;
  while (await Tenant.findOne({ slug }).setOptions({ skipTenantGuard: true })) {
    attempt += 1;
    slug = `${slugifyCompany(companyName)}-${attempt}`;
  }
  return slug;
}

/**
 * Self-service signup — creates tenant + active company_admin, returns tokens
 * like login. Gated by platformSettings `signup.mode` (SUPER_ADMIN_FLOW §3.4):
 * open → tenant starts active; approval (default) → tenant starts in trial
 * until a super admin activates it; closed → signup refused.
 */
export async function register({ name, email, password, companyName, ip, userAgent }) {
  const { getSetting } = await import('../platform/platformSettings.service.js');
  const signupMode = await getSetting('signup.mode');
  if (signupMode === 'closed') {
    throw new ApiError(403, 'Self-service signup is currently disabled', 'SIGNUP_CLOSED');
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ConflictError('An account with this email already exists — try logging in instead');
  }

  const passwordHash = await hashPassword(password);
  const slug = await uniqueTenantSlug(companyName);
  const tenantStatus = signupMode === 'open' ? 'active' : 'trial';

  const session = await mongoose.startSession();
  let user;
  let roleAssignment;
  try {
    await session.withTransaction(async () => {
      const [tenant] = await Tenant.create(
        [{ name: companyName, slug, currency: 'INR', status: tenantStatus }],
        { session },
      );
      [user] = await User.create(
        [
          {
            tenantId: tenant._id,
            name,
            email: normalizedEmail,
            passwordHash,
            status: 'active',
          },
        ],
        { session },
      );
      [roleAssignment] = await RoleAssignment.create(
        [
          {
            tenantId: tenant._id,
            userId: user._id,
            role: 'company_admin',
            scopeType: 'tenant',
          },
        ],
        { session },
      );
      await Wallet.create(
        [
          {
            tenantId: tenant._id,
            ownerUserId: user._id,
            name: `${companyName} Merchandise Budget`,
            currency: 'INR',
            status: 'draft',
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  return {
    accessToken: signAccessToken(user, roleAssignment),
    refreshToken: await issueRefreshToken(user._id, { ip, userAgent }),
    user: publicUser(user, roleAssignment),
  };
}

export async function login({ email, password, ip, userAgent }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.passwordHash) throw new UnauthorizedError('Invalid email or password');
  if (user.status === 'suspended') throw new UnauthorizedError('Account suspended');
  if (user.status === 'invited') {
    throw new ApiError(403, 'Invite not yet accepted — set your password first', 'INVITE_PENDING');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new UnauthorizedError('Invalid email or password');

  // §3.4 — archived tenants have logins refused.
  if (user.tenantId) {
    const tenant = await Tenant.findOne({ _id: user.tenantId }).select('status');
    if (tenant?.status === 'archived') {
      throw new UnauthorizedError('This workspace has been archived — contact support');
    }
  }

  const roleAssignment = await getPrimaryRoleAssignment(user._id);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    accessToken: signAccessToken(user, roleAssignment),
    refreshToken: await issueRefreshToken(user._id, { ip, userAgent }),
    user: publicUser(user, roleAssignment),
  };
}

export async function refresh({ refreshToken, ip, userAgent }) {
  const tokenHash = sha256(refreshToken);
  let userId = null;

  if (await isSessionStoreReady()) {
    const session = await getSession(tokenHash);
    if (session) userId = session.userId;
  }

  if (!userId) {
    const stored = await RefreshToken.findOne({ tokenHash });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    userId = stored.userId;
  }

  const user = await User.findOne({ _id: userId });
  if (!user || user.status !== 'active') throw new UnauthorizedError('Invalid refresh token');

  // Rotate: revoke the old token, issue a new pair.
  await revokeStoredRefreshToken(tokenHash, userId);

  const roleAssignment = await getPrimaryRoleAssignment(user._id);
  return {
    accessToken: signAccessToken(user, roleAssignment),
    refreshToken: await issueRefreshToken(user._id, { ip, userAgent }),
    user: publicUser(user, roleAssignment),
  };
}

export async function logout({ refreshToken, everywhere = false, userId = null }) {
  if (everywhere && userId) {
    if (await isSessionStoreReady()) await revokeAllUserSessions(userId);
    await RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
    return;
  }
  if (refreshToken) {
    await revokeStoredRefreshToken(sha256(refreshToken));
  }
}

export async function forgotPassword({ email }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Always behave identically whether or not the email exists.
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = sha256(token);
  user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  await sendPasswordResetEmail(user.email, token);
}

export async function resetPassword({ token, newPassword }) {
  const user = await User.findOne({
    passwordResetTokenHash: sha256(token),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+passwordResetTokenHash');
  if (!user) throw new ApiError(400, 'Invalid or expired reset token', 'INVALID_RESET_TOKEN');

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();
  await logout({ everywhere: true, userId: user._id });
}
