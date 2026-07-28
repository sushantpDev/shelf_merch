/** Common personal / consumer inbox domains — not allowed for signup or login. */
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "gmx.com",
  "yandex.com",
]);

export const WORK_EMAIL_ERROR =
  "Use a work email address. Personal emails like Gmail are not allowed.";

export function isWorkEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 1) return false;
  const domain = trimmed.slice(at + 1);
  return Boolean(domain.includes(".")) && !PERSONAL_EMAIL_DOMAINS.has(domain);
}
