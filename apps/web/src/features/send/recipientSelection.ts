import type { UiContact } from "@/services/mappers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MANUAL_RECIPIENT_PREFIX = "email:";

export function isManualRecipientId(id: string): boolean {
  return id.startsWith(MANUAL_RECIPIENT_PREFIX);
}

export function manualRecipientId(email: string): string {
  return `${MANUAL_RECIPIENT_PREFIX}${email.trim().toLowerCase()}`;
}

export function emailFromManualRecipientId(id: string): string {
  return id.slice(MANUAL_RECIPIENT_PREFIX.length);
}

export function isValidRecipientEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim().toLowerCase());
}

export function normalizeRecipientEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Split pasted text into candidate email strings. */
export function parseEmailInput(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Parse CSV text — first column or bare email per row. */
export function parseCsvEmails(text: string): string[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const emails: string[] = [];
  const header = lines[0].toLowerCase();
  const start = header.includes("email") ? 1 : 0;

  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i];
    const cell = line.includes(",") ? line.split(",")[0]?.trim() ?? line : line;
    if (cell) emails.push(cell);
  }
  return emails;
}

export function contactForManualEmail(email: string): UiContact {
  const normalized = normalizeRecipientEmail(email);
  return {
    id: manualRecipientId(normalized),
    email: normalized,
    name: normalized.split("@")[0] || normalized,
    role: "",
    address: "",
    loc: "—",
  };
}

export function resolveRecipientId(
  email: string,
  contacts: UiContact[],
): string | null {
  const normalized = normalizeRecipientEmail(email);
  if (!isValidRecipientEmail(normalized)) return null;
  const existing = contacts.find((c) => normalizeRecipientEmail(c.email) === normalized);
  return existing?.id ?? manualRecipientId(normalized);
}

export function selectedEmails(
  selectedIds: string[],
  contacts: UiContact[],
): Set<string> {
  const emails = new Set<string>();
  for (const id of selectedIds) {
    if (isManualRecipientId(id)) {
      emails.add(emailFromManualRecipientId(id));
      continue;
    }
    const contact = contacts.find((c) => c.id === id);
    if (contact) emails.add(normalizeRecipientEmail(contact.email));
  }
  return emails;
}

export function mergePickerContacts(
  contacts: UiContact[],
  selectedIds: string[],
): UiContact[] {
  const byEmail = new Map(contacts.map((c) => [normalizeRecipientEmail(c.email), c]));
  const rows = [...contacts];

  for (const id of selectedIds) {
    if (!isManualRecipientId(id)) continue;
    const email = emailFromManualRecipientId(id);
    if (byEmail.has(email)) continue;
    rows.push(contactForManualEmail(email));
  }

  return rows;
}

export type AddRecipientsResult = {
  added: string[];
  invalid: string[];
  duplicates: string[];
  truncated: number;
};

/** Add emails up to the remaining recipient slots, deduping across methods. */
export function addRecipientsUpToLimit(
  emails: string[],
  selectedIds: string[],
  contacts: UiContact[],
  maxRecipients: number,
): { ids: string[]; result: AddRecipientsResult } {
  const result: AddRecipientsResult = {
    added: [],
    invalid: [],
    duplicates: [],
    truncated: 0,
  };
  const next = [...selectedIds];
  const knownEmails = selectedEmails(next, contacts);
  const limit = Math.max(0, maxRecipients);

  for (const raw of emails) {
    if (next.length >= limit) {
      result.truncated += 1;
      continue;
    }
    const id = resolveRecipientId(raw, contacts);
    if (!id) {
      result.invalid.push(raw);
      continue;
    }
    const email = isManualRecipientId(id)
      ? emailFromManualRecipientId(id)
      : normalizeRecipientEmail(contacts.find((c) => c.id === id)?.email ?? raw);
    if (knownEmails.has(email) || next.includes(id)) {
      result.duplicates.push(raw);
      continue;
    }
    next.push(id);
    knownEmails.add(email);
    result.added.push(email);
  }

  return { ids: next, result };
}

export function selectAllRecipientIds(
  contacts: UiContact[],
  selectedIds: string[],
  maxRecipients: number,
): string[] {
  const limit = Math.max(0, maxRecipients);
  const next = [...selectedIds];
  const knownEmails = selectedEmails(next, contacts);

  for (const contact of contacts) {
    if (next.length >= limit) break;
    const email = normalizeRecipientEmail(contact.email);
    if (next.includes(contact.id) || knownEmails.has(email)) continue;
    next.push(contact.id);
    knownEmails.add(email);
  }

  return next;
}
