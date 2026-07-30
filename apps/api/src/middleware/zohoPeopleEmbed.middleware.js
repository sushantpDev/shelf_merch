/**
 * Route-specific framing for Zoho People Connected App pages.
 * Only `/zoho/people` and `/zoho/people/sandbox` may be embedded by Zoho.
 * All other ShelfMerch pages keep global helmet frame protection.
 */

export const ZOHO_PEOPLE_EMBED_PATHS = Object.freeze([
  '/zoho/people',
  '/zoho/people/sandbox',
]);

export const ZOHO_PEOPLE_FRAME_ANCESTORS = Object.freeze([
  'https://people.zoho.in',
  'https://sigma.zoho.in',
]);

const FRAME_ANCESTORS_DIRECTIVE = `frame-ancestors ${ZOHO_PEOPLE_FRAME_ANCESTORS.join(' ')}`;

export function isZohoPeopleEmbedPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return false;
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return ZOHO_PEOPLE_EMBED_PATHS.includes(normalized);
}

function replaceFrameAncestors(cspValue) {
  if (/frame-ancestors\b/i.test(cspValue)) {
    return cspValue.replace(/frame-ancestors[^;]*/i, FRAME_ANCESTORS_DIRECTIVE).replace(/;;+/g, ';');
  }
  const trimmed = cspValue.trim().replace(/;?\s*$/, '');
  return trimmed ? `${trimmed}; ${FRAME_ANCESTORS_DIRECTIVE}` : FRAME_ANCESTORS_DIRECTIVE;
}

/**
 * Allow Zoho People / Sigma to iframe this response.
 * Removes X-Frame-Options and sets enforcing frame-ancestors for the allowlist only.
 */
export function applyZohoPeopleEmbedHeaders(res) {
  res.removeHeader('X-Frame-Options');

  const csp = res.getHeader('Content-Security-Policy');
  if (typeof csp === 'string' && csp.length) {
    res.setHeader('Content-Security-Policy', replaceFrameAncestors(csp));
  } else {
    // Enforce allowlist even when global CSP is report-only or disabled.
    res.setHeader('Content-Security-Policy', FRAME_ANCESTORS_DIRECTIVE);
  }

  const cspReportOnly = res.getHeader('Content-Security-Policy-Report-Only');
  if (typeof cspReportOnly === 'string' && cspReportOnly.length) {
    res.setHeader(
      'Content-Security-Policy-Report-Only',
      replaceFrameAncestors(cspReportOnly),
    );
  }
}

/** After helmet — override frame headers for Connected App paths only. */
export function zohoPeopleEmbedHeaderMiddleware(req, res, next) {
  if (isZohoPeopleEmbedPath(req.path)) {
    applyZohoPeopleEmbedHeaders(res);
  }
  next();
}
