import { logger } from '../config/logger.js';

/**
 * Defence-in-depth against NoSQL operator injection (§security hardening C1).
 * Zod validation already strips unknown fields on validated routes; this guard
 * covers everything else by removing keys that begin with `$` (Mongo query
 * operators like `$gt`, `$where`, `$ne`) from request inputs before they can
 * reach a query builder. Values are left untouched — only operator-shaped keys
 * are dropped.
 *
 * req.query is a read-only getter under Express 5, so its offending keys are
 * deleted in place rather than reassigned.
 */
function stripOperatorKeys(value, seen) {
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);

  let stripped = false;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (stripOperatorKeys(item, seen)) stripped = true;
    }
    return stripped;
  }

  for (const key of Object.keys(value)) {
    if (key.startsWith('$')) {
      delete value[key];
      stripped = true;
      continue;
    }
    if (stripOperatorKeys(value[key], seen)) stripped = true;
  }
  return stripped;
}

export function sanitizeMongoInput(req, _res, next) {
  const seen = new WeakSet();
  let stripped = false;
  for (const source of [req.body, req.params, req.query]) {
    if (stripOperatorKeys(source, seen)) stripped = true;
  }
  if (stripped) {
    logger.warn(
      { path: req.originalUrl, ip: req.ip },
      'Stripped $-prefixed keys from request input (possible NoSQL injection attempt)',
    );
  }
  next();
}
