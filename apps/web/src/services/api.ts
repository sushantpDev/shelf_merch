import { API_BASE } from "./config";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
  type AuthUser,
} from "./auth-store";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = "API_ERROR", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean;
  idempotencyKey?: string;
};

let refreshPromise: Promise<boolean> | null = null;

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorFromResponse(status: number, body: unknown): ApiError {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as {
      error: { message?: string; code?: string; details?: Array<{ path?: string; message?: string }> };
    }).error;
    let message = err.message || "Request failed";
    if (err.code === "VALIDATION_ERROR" && Array.isArray(err.details) && err.details.length) {
      const first = err.details[0];
      message = `${message}: ${first.path || "field"} — ${first.message || "invalid"}`;
    }
    return new ApiError(status, message, err.code || "API_ERROR", body);
  }
  return new ApiError(status, typeof body === "string" ? body : "Request failed");
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearSession();
    return false;
  }

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
  setSession(data);
  return true;
}

async function ensureRefreshed(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, idempotencyKey, headers: extraHeaders, ...init } = options;
  const headers = new Headers(extraHeaders);

  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  let res = await fetch(url, { ...init, headers });

  if (res.status === 401 && auth && getRefreshToken()) {
    const refreshed = await ensureRefreshed();
    if (refreshed) {
      const retryHeaders = new Headers(headers);
      const token = getAccessToken();
      if (token) retryHeaders.set("Authorization", `Bearer ${token}`);
      res = await fetch(url, { ...init, headers: retryHeaders });
    }
  }

  const body = await parseBody(res);
  if (!res.ok) throw errorFromResponse(res.status, body);
  return body as T;
}

/** Public redemption routes — no auth header. */
export async function publicFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  return apiFetch<T>(path, { ...init, auth: false });
}
