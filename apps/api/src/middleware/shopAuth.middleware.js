import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { shopVerifyOptions } from '../config/jwt.js';
import { ApiError, UnauthorizedError } from '../utils/errors.js';

/**
 * Require a shop-customer JWT (audience shelfmerch-shop).
 * Attaches req.shopCustomer = { customerId, shopId, tenantId, email }.
 */
export function requireShopCustomer(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next(new UnauthorizedError('Sign in required'));

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, shopVerifyOptions());
    if (payload.type !== 'shop_customer' || !payload.sub || !payload.shopId) {
      return next(new UnauthorizedError('Invalid shop session'));
    }
    // Path shopId (if present) must match token shop.
    const pathShopId = req.params?.shopId;
    if (pathShopId && String(pathShopId) !== String(payload.shopId)) {
      return next(new ApiError(403, 'Session does not match this store', 'SHOP_MISMATCH'));
    }
    req.shopCustomer = {
      customerId: String(payload.sub),
      shopId: String(payload.shopId),
      tenantId: payload.tenantId ? String(payload.tenantId) : null,
      email: payload.email,
    };
    next();
  } catch {
    next(new UnauthorizedError('Shop session expired — please sign in again'));
  }
}
