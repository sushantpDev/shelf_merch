import { describe, it, expect } from 'vitest';
import {
  resolveZohoIntegrationPublicStatus,
  zohoPeopleConnectionSubtitle,
} from '../src/modules/integrations/zoho/zohoIntegrationStatus.service.js';
import { ZOHO_PUBLIC_STATUSES } from '../src/modules/integrations/zoho/zohoIntegration.model.js';
import { encryptToken } from '../src/utils/tokenEncryption.js';

function integrationDoc(overrides = {}) {
  return {
    status: 'connected',
    zohoOrganizationId: '89740123',
    zohoOrganizationName: 'Chitlu Innovations Private Limited',
    encryptedAccessToken: encryptToken('access-plain'),
    encryptedRefreshToken: encryptToken('refresh-plain'),
    lastError: '',
    ...overrides,
  };
}

describe('resolveZohoIntegrationPublicStatus', () => {
  it('returns not_connected when no integration exists', () => {
    expect(resolveZohoIntegrationPublicStatus(null)).toBe(ZOHO_PUBLIC_STATUSES.not_connected);
    expect(resolveZohoIntegrationPublicStatus(undefined)).toBe(ZOHO_PUBLIC_STATUSES.not_connected);
  });

  it('returns connected after successful OAuth with organisation id and tokens', () => {
    const status = resolveZohoIntegrationPublicStatus(
      integrationDoc({
        status: 'connected',
        zohoOrganizationName: 'Chitlu Innovations Private Limited',
      }),
    );
    expect(status).toBe(ZOHO_PUBLIC_STATUSES.connected);
  });

  it('does not return needs_attention when organisation id exists without display name', () => {
    const status = resolveZohoIntegrationPublicStatus(
      integrationDoc({
        status: 'needs_attention',
        zohoOrganizationName: '',
        lastError: '',
      }),
    );
    expect(status).toBe(ZOHO_PUBLIC_STATUSES.connected);
  });

  it('returns needs_attention for real refresh-token failure', () => {
    const status = resolveZohoIntegrationPublicStatus(
      integrationDoc({
        status: 'expired',
        lastError: 'Token refresh failed',
      }),
    );
    expect(status).toBe(ZOHO_PUBLIC_STATUSES.needs_attention);
  });

  it('returns needs_attention when organisation verification failed with unresolved error', () => {
    const status = resolveZohoIntegrationPublicStatus(
      integrationDoc({
        status: 'error',
        zohoOrganizationId: '',
        lastError: 'Could not verify Zoho organisation',
      }),
    );
    expect(status).toBe(ZOHO_PUBLIC_STATUSES.needs_attention);
  });

  it('returns needs_attention when connected but organisation id is missing', () => {
    const status = resolveZohoIntegrationPublicStatus(
      integrationDoc({
        status: 'connected',
        zohoOrganizationId: '',
        lastError: '',
      }),
    );
    expect(status).toBe(ZOHO_PUBLIC_STATUSES.needs_attention);
  });

  it('returns not_connected when tokens are missing', () => {
    const status = resolveZohoIntegrationPublicStatus(
      integrationDoc({
        encryptedAccessToken: '',
        encryptedRefreshToken: '',
      }),
    );
    expect(status).toBe(ZOHO_PUBLIC_STATUSES.not_connected);
  });
});

describe('zohoPeopleConnectionSubtitle', () => {
  it('shows connected copy when connected', () => {
    expect(zohoPeopleConnectionSubtitle(ZOHO_PUBLIC_STATUSES.connected)).toBe(
      'Zoho People is connected. Sync employees to keep ShelfMerch contacts up to date.',
    );
  });

  it('shows reconnect copy when needs attention', () => {
    expect(zohoPeopleConnectionSubtitle(ZOHO_PUBLIC_STATUSES.needs_attention)).toBe(
      'Reconnect Zoho People to restore employee syncing.',
    );
  });

  it('shows connect copy when disconnected', () => {
    expect(zohoPeopleConnectionSubtitle(ZOHO_PUBLIC_STATUSES.not_connected)).toBe(
      'Connect Zoho People to import employees into ShelfMerch.',
    );
  });
});
