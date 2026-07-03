import { ForbiddenError } from '../utils/errors.js';

/** Service-layer ABAC — entity managers may only touch assigned entities. */
export function assertEntityAccess(user, entityId) {
  if (user?.scopeType !== 'entity' || !entityId) return;
  const allowed = (user.assignedEntityIds ?? []).map(String);
  if (!allowed.includes(String(entityId))) {
    throw new ForbiddenError('You do not have access to this entity');
  }
}

/**
 * §6.3 ABAC — where can this user act?
 * `scopeResolver(req)` returns the entityId being touched (or a promise of it,
 * or null when the route isn't entity-bound). Entity managers may only act on
 * entities in their assignedEntityIds; tenant- and platform-scoped roles pass.
 */
export function requireScope(scopeResolver) {
  return async (req, _res, next) => {
    try {
      if (req.user.scopeType !== 'entity') return next();

      const entityId = await scopeResolver(req);
      if (!entityId) return next();

      const allowed = (req.user.assignedEntityIds ?? []).map(String);
      if (!allowed.includes(String(entityId))) {
        return next(new ForbiddenError('You do not have access to this entity'));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
