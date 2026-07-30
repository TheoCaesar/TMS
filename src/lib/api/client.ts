import type { ApiEnvelope, AuthTokens } from './types';
import { clearTokens, getTokens, setTokens } from './tokenStore';

// The live API sends no CORS headers (see docs/DEVELOPMENT_LOG.md, "CORS
// blocker"), so in dev we default to a relative URL and let the Vite proxy
// (vite.config.ts) forward it server-to-server. Production has no such
// proxy, so it needs either VITE_API_BASE_URL set to a same-origin path
// behind a real reverse proxy, or the backend to start sending CORS headers.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '' : 'https://tms-api-m7yf.onrender.com');

const API_PREFIX = '/api/v1';

export class ApiError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean; // attach Authorization header (default true)
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  // new URL() requires an absolute base; fall back to the page's own
  // origin so an empty API_BASE_URL resolves to a same-origin request
  // (picked up by the Vite dev proxy) instead of throwing.
  const base = API_BASE_URL || window.location.origin;
  const url = new URL(`${API_PREFIX}${path}`, base);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, query } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const tokens = getTokens();
    if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new ApiError(envelope.code ?? response.status, envelope.message ?? response.statusText);
  }
  return envelope.data;
}

let refreshInFlight: Promise<AuthTokens> | null = null;

async function refreshTokens(): Promise<AuthTokens> {
  const current = getTokens();
  if (!current) throw new ApiError(401, 'Not authenticated');

  if (!refreshInFlight) {
    refreshInFlight = rawRequest<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: current.refreshToken },
      auth: false,
    }).finally(() => {
      refreshInFlight = null;
    });
  }
  const tokens = await refreshInFlight;
  setTokens(tokens);
  return tokens;
}

// Wraps rawRequest with one-shot access-token refresh on a 401.
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.code === 401 && options.auth !== false && getTokens()) {
      try {
        await refreshTokens();
      } catch {
        clearTokens();
        throw err;
      }
      return rawRequest<T>(path, options);
    }
    throw err;
  }
}
