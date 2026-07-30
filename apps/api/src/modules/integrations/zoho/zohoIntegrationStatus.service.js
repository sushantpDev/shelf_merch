import { ZOHO_PUBLIC_STATUSES } from './zohoIntegration.model.js';

export function hasZohoIntegrationTokens(doc) {
  return Boolean(doc?.encryptedAccessToken && doc?.encryptedRefreshToken);
}

/**
 * Public connection status for API + iframe UI.
 * Maps stored integration state to Connected / Needs attention / Not connected.
 */
export function resolveZohoIntegrationPublicStatus(doc) {
  if (!doc || doc.status === 'disconnected' || !hasZohoIntegrationTokens(doc)) {
    return ZOHO_PUBLIC_STATUSES.not_connected;
  }

  const hasOrgId = Boolean(doc.zohoOrganizationId);
  const unresolvedError = Boolean(doc.lastError);

  if (doc.status === 'expired' || doc.status === 'error') {
    return ZOHO_PUBLIC_STATUSES.needs_attention;
  }

  if (doc.status === 'needs_attention') {
    if (hasOrgId && !unresolvedError) {
      return ZOHO_PUBLIC_STATUSES.connected;
    }
    return ZOHO_PUBLIC_STATUSES.needs_attention;
  }

  if (doc.status === 'connected') {
    if (!hasOrgId || unresolvedError) {
      return ZOHO_PUBLIC_STATUSES.needs_attention;
    }
    return ZOHO_PUBLIC_STATUSES.connected;
  }

  return ZOHO_PUBLIC_STATUSES.not_connected;
}

export function zohoPeopleConnectionSubtitle(publicStatus) {
  switch (publicStatus) {
    case ZOHO_PUBLIC_STATUSES.connected:
      return 'Zoho People is connected. Sync employees to keep ShelfMerch contacts up to date.';
    case ZOHO_PUBLIC_STATUSES.needs_attention:
    case ZOHO_PUBLIC_STATUSES.expired:
    case ZOHO_PUBLIC_STATUSES.error:
      return 'Reconnect Zoho People to restore employee syncing.';
    default:
      return 'Connect Zoho People to import employees into ShelfMerch.';
  }
}
