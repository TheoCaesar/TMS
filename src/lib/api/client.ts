import type { ApiEnvelope, AuthTokens } from './types';
import { clearTokens, getTokens, setTokens } from './tokenStore';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://tms-api-m7yf.onrender.com';

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
  const url = new URL(`${API_PREFIX}${path}`, API_BASE_URL);
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
