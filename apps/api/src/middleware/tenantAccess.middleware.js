import { ForbiddenError } from '../utils/errors.js';

const SUPER = 'platform_super_admin';
const COMPANY_ADMIN = 'company_admin';
const ENTITY_MANAGER = 'entity_manager';

const BOTH = [COMPANY_ADMIN, ENTITY_MANAGER];

/**
 * Recommended ownership model — role × tenant area matrix.
 * `write` lists roles that may mutate; `read` lists roles that may view.
 * Company admins configure the workspace; entity managers run gifting ops.
 */
const MATRIX = {
  home: { read: BOTH, write: [] },
  orders: { read: BOTH, write: [COMPANY_ADMIN] },
  wallets: { read: BOTH, write: [COMPANY_ADMIN] },
  shops: { read: BOTH, write: [COMPANY_ADMIN] },
  swag: { read: BOTH, write: [COMPANY_ADMIN] },
  kits: { read: BOTH, write: [COMPANY_ADMIN] },
  /** Create / update campaign metadata — optional for company admins. */
  campaigns: { read: BOTH, write: BOTH },
  /** Allocate credits, upload recipients, launch / close. */
  campaignOps: { read: BOTH, write: [ENTITY_MANAGER] },
  contacts: { read: BOTH, write: BOTH },
  settings: { read: BOTH, write: [COMPANY_ADMIN] },
  catalog: { read: BOTH, write: [] },
  users: { read: [COMPANY_ADMIN], write: [COMPANY_ADMIN] },
};

export function rolesForTenantArea(area, action = 'read') {
  const entry = MATRIX[area];
  if (!entry) throw new Error(`Unknown tenant area "${area}"`);
  const roles = action === 'write' ? entry.write : entry.read;
  return [...new Set([SUPER, ...roles])];
}

/** Route guard: tenantArea('shops', 'write') */
export function tenantArea(area, action = 'read') {
  const allowed = rolesForTenantArea(area, action);
  return (req, _res, next) => {
    if (!allowed.includes(req.user?.role)) {
      return next(
        new ForbiddenError(
          `This ${area} ${action} requires one of roles: ${allowed.join(', ')}`,
        ),
      );
    }
    next();
  };
}
