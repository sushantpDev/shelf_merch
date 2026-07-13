/**
 * Centralized JWT claim pinning (§security hardening B3). Every token we mint is
 * signed with a fixed algorithm, issuer, and audience, and every verify pins the
 * same values — so a token can't be used with a forged `alg`, and an access token
 * can't be replayed as a redemption session (different audience) or vice versa,
 * even though both are signed with JWT_ACCESS_SECRET.
 */
export const JWT_ISSUER = 'shelfmerch-api';
export const JWT_ACCESS_AUDIENCE = 'shelfmerch-app';
export const JWT_REDEMPTION_AUDIENCE = 'shelfmerch-redeem';
export const JWT_ALGORITHM = 'HS256';

export const accessSignOptions = (extra = {}) => ({
  algorithm: JWT_ALGORITHM,
  issuer: JWT_ISSUER,
  audience: JWT_ACCESS_AUDIENCE,
  ...extra,
});

export const accessVerifyOptions = () => ({
  algorithms: [JWT_ALGORITHM],
  issuer: JWT_ISSUER,
  audience: JWT_ACCESS_AUDIENCE,
});

export const redemptionSignOptions = (extra = {}) => ({
  algorithm: JWT_ALGORITHM,
  issuer: JWT_ISSUER,
  audience: JWT_REDEMPTION_AUDIENCE,
  ...extra,
});

export const redemptionVerifyOptions = () => ({
  algorithms: [JWT_ALGORITHM],
  issuer: JWT_ISSUER,
  audience: JWT_REDEMPTION_AUDIENCE,
});
