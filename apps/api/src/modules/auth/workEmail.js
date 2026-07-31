import { ApiError } from '../../utils/errors.js';

/** Personal / consumer inbox domains — work emails only for auth. */
export const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'gmx.com',
  'yandex.com',
]);

export const WORK_EMAIL_ERROR =
  'Use a work email address. Personal emails like Gmail are not allowed.';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase();
}

export function isPersonalEmailDomain(email) {
  const domain = normalizeEmail(email).split('@')[1];
  return Boolean(domain) && PERSONAL_EMAIL_DOMAINS.has(domain);
}

/** Normalize + validate platform setting `auth.emailAllowlist`. */
export function normalizeEmailAllowlist(value) {
  if (!Array.isArray(value)) {
    throw new ApiError(400, 'auth.emailAllowlist must be an array of email addresses', 'INVALID_ALLOWLIST');
  }
  const emails = [];
  const seen = new Set();
  for (const raw of value) {
    const email = normalizeEmail(raw);
    if (!EMAIL_RE.test(email)) {
      throw new ApiError(400, `Invalid email in allowlist: ${raw}`, 'INVALID_ALLOWLIST');
    }
    if (!seen.has(email)) {
      seen.add(email);
      emails.push(email);
    }
  }
  return emails;
}

export async function getEmailAllowlist() {
  const { getSetting } = await import('../platform/platformSettings.service.js');
  const value = await getSetting('auth.emailAllowlist');
  if (!Array.isArray(value)) return [];
  return value.map((e) => normalizeEmail(e)).filter(Boolean);
}

export async function isAllowedAuthEmail(email) {
  const normalized = normalizeEmail(email);
  if (!EMAIL_RE.test(normalized)) return false;
  if (!isPersonalEmailDomain(normalized)) return true;
  const allowlist = await getEmailAllowlist();
  return allowlist.includes(normalized);
}

/** Reject personal-domain emails unless present on `auth.emailAllowlist`. */
export async function assertAllowedAuthEmail(email) {
  if (!(await isAllowedAuthEmail(email))) {
    throw new ApiError(400, WORK_EMAIL_ERROR, 'WORK_EMAIL_REQUIRED');
  }
}
