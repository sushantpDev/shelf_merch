/**
 * Route-specific framing and COOP for Zoho People Connected App pages.
 * Iframe routes allow Zoho embedding; all listed routes use COOP unsafe-none so
 * popups opened from the Zoho iframe retain window.opener for postMessage.
 */

/** Routes that may be embedded inside Zoho People / Sigma. */
export const ZOHO_PEOPLE_IFRAME_PATHS = Object.freeze([
  '/zoho/people',
  '/zoho/people/sandbox',
]);

/** Routes that need COOP unsafe-none (iframe + popup helpers). */
export const ZOHO_PEOPLE_COOP_PATHS = Object.freeze([
  '/zoho/people',
  '/zoho/people/sandbox',
  '/zoho/people/embed-auth',
  '/zoho/people/oauth-bridge',
  '/zoho/people/oauth-done',
]);

/** @deprecated Use ZOHO_PEOPLE_IFRAME_PATHS */
export const ZOHO_PEOPLE_EMBED_PATHS = ZOHO_PEOPLE_IFRAME_PATHS;

export const ZOHO_PEOPLE_FRAME_ANCESTORS = Object.freeze([
  'https://people.zoho.in',
  'https://sigma.zoho.in',
]);

export const ZOHO_PEOPLE_COOP_VALUE = 'unsafe-none';

const FRAME_ANCESTORS_DIRECTIVE = `frame-ancestors ${ZOHO_PEOPLE_FRAME_ANCESTORS.join(' ')}`;

function normalizePath(pathname) {
  if (!pathname || typeof pathname !== 'string') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function isZohoPeopleCoopPath(pathname) {
  return ZOHO_PEOPLE_COOP_PATHS.includes(normalizePath(pathname));
}

export function isZohoPeopleIframePath(pathname) {
  return ZOHO_PEOPLE_IFRAME_PATHS.includes(normalizePath(pathname));
}

/** @deprecated Use isZohoPeopleIframePath */
export function isZohoPeopleEmbedPath(pathname) {
  return isZohoPeopleIframePath(pathname);
}

function replaceFrameAncestors(cspValue) {
  if (/frame-ancestors\b/i.test(cspValue)) {
    return cspValue.replace(/frame-ancestors[^;]*/i, FRAME_ANCESTORS_DIRECTIVE).replace(/;;+/g, ';');
  }
  const trimmed = cspValue.trim().replace(/;?\s*$/, '');
  return trimmed ? `${trimmed}; ${FRAME_ANCESTORS_DIRECTIVE}` : FRAME_ANCESTORS_DIRECTIVE;
}

/**
 * Allow popup <-> iframe communication (overrides Helmet same-origin COOP).
 */
export function applyZohoPeopleCoopHeaders(res) {
  res.setHeader('Cross-Origin-Opener-Policy', ZOHO_PEOPLE_COOP_VALUE);
}

/**
 * Default COOP for all non-Zoho embed routes (Helmet COOP is disabled globally).
 */
export function defaultShelfmerchCoopMiddleware(req, res, next) {
  if (!isZohoPeopleCoopPath(req.path)) {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  }
  next();
}

function applyZohoPeopleIframeFrameHeaders(res) {
  res.removeHeader('X-Frame-Options');

  const csp = res.getHeader('Content-Security-Policy');
  if (typeof csp === 'string' && csp.length) {
    res.setHeader('Content-Security-Policy', replaceFrameAncestors(csp));
  } else {
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

/**
 * Iframe routes: COOP unsafe-none + Zoho frame-ancestors allowlist.
 */
export function applyZohoPeopleEmbedHeaders(res) {
  applyZohoPeopleCoopHeaders(res);
  applyZohoPeopleIframeFrameHeaders(res);
}

/**
 * After helmet — override security headers for Zoho Connected App routes only.
 * Route handlers call applyZohoPeople* again immediately before sendFile.
 */
export function zohoPeopleEmbedHeaderMiddleware(req, res, next) {
  const coop = isZohoPeopleCoopPath(req.path);
  const iframe = isZohoPeopleIframePath(req.path);
  if (!coop && !iframe) return next();

  if (coop) applyZohoPeopleCoopHeaders(res);
  if (iframe) applyZohoPeopleIframeFrameHeaders(res);
  next();
}
