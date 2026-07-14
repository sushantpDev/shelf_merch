import crypto from 'node:crypto';
import { requestContext } from '../config/requestContext.js';

/**
 * Seeds the per-request context and runs the rest of the request inside it, so
 * downstream logs carry a requestId. Honors an inbound X-Request-Id (from the LB
 * / upstream) for cross-service correlation, and echoes it back on the response.
 */
export function requestContextMiddleware(req, res, next) {
  const inbound = req.headers['x-request-id'];
  const requestId = typeof inbound === 'string' && inbound.length <= 200 ? inbound : crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  requestContext.run({ requestId }, () => next());
}
