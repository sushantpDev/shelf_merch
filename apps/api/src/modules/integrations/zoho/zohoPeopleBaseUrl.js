import { ApiError } from '../../../utils/errors.js';

/**
 * Zoho People product hosts by OAuth data-centre `location`.
 * Do NOT use OAuth `api_domain` (e.g. https://www.zohoapis.in) as the People API host.
 */
const PEOPLE_BASE_BY_LOCATION = {
  in: 'https://people.zoho.in',
  us: 'https://people.zoho.com',
  com: 'https://people.zoho.com',
  eu: 'https://people.zoho.eu',
  au: 'https://people.zoho.com.au',
  jp: 'https://people.zoho.jp',
  ca: 'https://people.zohocloud.ca',
  sa: 'https://people.zoho.sa',
};

/**
 * Infer a Zoho location code from OAuth api_domain (debug / fallback only).
 * e.g. https://www.zohoapis.in → in
 */
export function inferZohoLocationFromApiDomain(apiDomain) {
  if (!apiDomain || typeof apiDomain !== 'string') return '';
  try {
    const host = new URL(apiDomain).hostname.toLowerCase();
    if (host.endsWith('.zohoapis.in') || host === 'zohoapis.in') return 'in';
    if (host.endsWith('.zohoapis.eu') || host === 'zohoapis.eu') return 'eu';
    if (host.endsWith('.zohoapis.com.au') || host === 'zohoapis.com.au') return 'au';
    if (host.endsWith('.zohoapis.jp') || host === 'zohoapis.jp') return 'jp';
    if (host.endsWith('.zohocloud.ca') || host.includes('zohoapis.ca')) return 'ca';
    if (host.endsWith('.zohoapis.sa') || host === 'zohoapis.sa') return 'sa';
    if (host.endsWith('.zohoapis.com') || host === 'zohoapis.com') return 'com';
  } catch {
    return '';
  }
  return '';
}

/**
 * Normalize OAuth `location` query values to a known DC code.
 */
export function normalizeZohoLocation(location) {
  if (location == null) return '';
  const raw = String(location).trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'us/com') return 'com';
  if (PEOPLE_BASE_BY_LOCATION[raw]) return raw;
  return raw;
}

/**
 * Resolve the Zoho People product base URL from OAuth location.
 * Prefer explicit location; fall back to api_domain inference; default to India
 * when neither is usable (ShelfMerch ships against accounts.zoho.in).
 */
export function resolveZohoPeopleBaseUrl({ location = '', apiDomain = '' } = {}) {
  const normalized = normalizeZohoLocation(location);
  if (normalized && PEOPLE_BASE_BY_LOCATION[normalized]) {
    return PEOPLE_BASE_BY_LOCATION[normalized];
  }

  const inferred = inferZohoLocationFromApiDomain(apiDomain);
  if (inferred && PEOPLE_BASE_BY_LOCATION[inferred]) {
    return PEOPLE_BASE_BY_LOCATION[inferred];
  }

  // India Accounts is the configured default for this integration.
  if (!normalized && !inferred) {
    return PEOPLE_BASE_BY_LOCATION.in;
  }

  throw new ApiError(
    502,
    'Unsupported Zoho data centre for People APIs',
    'ZOHO_LOCATION_UNSUPPORTED',
    { location: normalized || inferred || null },
  );
}

export { PEOPLE_BASE_BY_LOCATION };
