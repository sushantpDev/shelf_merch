import { Contact } from '../../contacts/contact.model.js';
import { logger } from '../../../config/logger.js';
import { env } from '../../../config/env.js';
import { getValidAccessToken } from './zohoToken.service.js';
import {
  fetchAllZohoEmployees,
  fetchZohoOrganization,
  SKIP_REASONS,
} from './zohoPeople.service.js';

function parseJoiningDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function displayName(firstName, lastName, displayNameField, email, employeeId) {
  if (displayNameField) return displayNameField;
  const full = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (email) return email.split('@')[0];
  if (employeeId) return `Employee ${employeeId}`;
  return 'Employee';
}

function isValidEmail(email) {
  if (!email) return false;
  // Minimal work-email shape check — no personal values logged.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function emptySkipCounts() {
  return Object.fromEntries(Object.values(SKIP_REASONS).map((r) => [r, 0]));
}

function classifySkip(row) {
  if (!row || row.__skipReason) {
    return row?.__skipReason || SKIP_REASONS.UNSUPPORTED_RECORD_SHAPE;
  }
  if (!row.zohoRecordId) return SKIP_REASONS.MISSING_ZOHO_RECORD_ID;
  if (!row.employeeId && !row.email) return SKIP_REASONS.MISSING_EMPLOYEE_IDENTIFIER;
  if (row.email && !isValidEmail(row.email)) return SKIP_REASONS.INVALID_EMAIL;
  if (!row.firstName && !row.lastName && !row.displayName) {
    // Name is required for Contact.name — treat as missing identifier-quality data
    return SKIP_REASONS.MISSING_EMPLOYEE_IDENTIFIER;
  }
  return null;
}

/**
 * Import Zoho employees into ShelfMerch contacts (non-sensitive fields only).
 * Upsert key: tenantId + zohoRecordId.
 */
export async function syncZohoEmployees(tenantId) {
  const { accessToken, integration } = await getValidAccessToken(tenantId);

  // Refresh org metadata when missing (v3 /organization uses Company as id; name often absent).
  try {
    const org = await fetchZohoOrganization({
      location: integration.zohoLocation,
      apiDomain: integration.apiDomain,
      accessToken,
    });
    if (org.id && org.id !== integration.zohoOrganizationId) {
      integration.zohoOrganizationId = org.id;
    }
    if (org.name && org.name !== integration.zohoOrganizationName) {
      integration.zohoOrganizationName = org.name;
    } else if (org.id && !integration.zohoOrganizationName) {
      // Keep name empty when Zoho does not return one; UI falls back to org id.
      integration.zohoOrganizationId = integration.zohoOrganizationId || org.id;
    }
    if (org.needsAttention && integration.status === 'connected') {
      integration.status = 'needs_attention';
    } else if (!org.needsAttention && org.id && integration.status === 'needs_attention') {
      integration.status = 'connected';
    }
  } catch {
    // Org refresh is best-effort; employee sync continues.
  }

  const { employees, diagnostics } = await fetchAllZohoEmployees({
    location: integration.zohoLocation,
    apiDomain: integration.apiDomain,
    accessToken,
  });

  const summary = {
    totalFetched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    skippedByReason: emptySkipCounts(),
  };

  const seenZohoIds = new Set();
  const normalized = [];

  for (const row of employees) {
    const reason = classifySkip(row);
    if (reason) {
      summary.skipped += 1;
      summary.skippedByReason[reason] = (summary.skippedByReason[reason] || 0) + 1;
      continue;
    }
    if (seenZohoIds.has(row.zohoRecordId)) {
      summary.skipped += 1;
      summary.skippedByReason[SKIP_REASONS.DUPLICATE_IN_RESPONSE] += 1;
      continue;
    }
    seenZohoIds.add(row.zohoRecordId);
    normalized.push(row);
  }

  summary.totalFetched = diagnostics?.rawRecordCount ?? employees.length;

  for (const row of normalized) {
    try {
      // Contact.email is required in schema — synthesize a stable placeholder only when
      // employee ID exists but work email does not (still no sensitive extras).
      let email = row.email;
      if (!email && row.employeeId) {
        email = `zoho.${row.employeeId}@employees.local`.toLowerCase();
      }
      if (!isValidEmail(email)) {
        summary.skipped += 1;
        summary.skippedByReason[SKIP_REASONS.INVALID_EMAIL] += 1;
        continue;
      }

      const patch = {
        name: displayName(row.firstName, row.lastName, row.displayName, email, row.employeeId),
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        email,
        employeeCode: row.employeeId || '',
        department: row.department || '',
        designation: row.designation || '',
        workLocation: row.location || '',
        dateOfJoining: parseJoiningDate(row.dateOfJoining),
        employmentStatus: row.employmentStatus || '',
        zohoRecordId: row.zohoRecordId,
        source: 'hris',
      };

      const existing = await Contact.findOne({ tenantId, zohoRecordId: row.zohoRecordId });
      if (existing) {
        Object.assign(existing, patch);
        await existing.save();
        summary.updated += 1;
        continue;
      }

      const byEmail = await Contact.findOne({ tenantId, email });
      if (byEmail) {
        Object.assign(byEmail, patch);
        await byEmail.save();
        summary.updated += 1;
      } else {
        await Contact.create({ tenantId, ...patch });
        summary.created += 1;
      }
    } catch {
      summary.failed += 1;
      summary.skippedByReason[SKIP_REASONS.DATABASE_VALIDATION_FAILED] =
        (summary.skippedByReason[SKIP_REASONS.DATABASE_VALIDATION_FAILED] || 0) + 1;
    }
  }

  integration.lastSyncedAt = new Date();
  await integration.save();

  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
    logger.info(
      {
        endpointPath: diagnostics?.endpointPath,
        httpStatus: diagnostics?.httpStatus,
        zohoStatus: diagnostics?.zohoStatus,
        zohoCode: diagnostics?.zohoCode,
        zohoMessage: diagnostics?.zohoMessage,
        rawRecordCount: diagnostics?.rawRecordCount,
        normalizedCount: normalized.length,
        created: summary.created,
        updated: summary.updated,
        skipped: summary.skipped,
        failed: summary.failed,
        skippedByReason: summary.skippedByReason,
      },
      'Zoho employee sync summary',
    );
  }

  return summary;
}

export { SKIP_REASONS };
