export type AuthUser = {
  id: string;
  tenantId: string | null;
  name: string;
  email: string;
  role: string;
  scopeType: string;
  assignedEntityIds: string[];
};

const ACCESS_KEY = "sm_access";
const REFRESH_KEY = "sm_refresh";
const USER_KEY = "sm_user";

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setSession(tokens: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}) {
  sessionStorage.setItem(ACCESS_KEY, tokens.accessToken);
  sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  sessionStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
}

export function clearSession() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken() && getStoredUser());
}

export function isPlatformUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.scopeType === "platform" || Boolean(user.role?.startsWith("platform_"));
}
