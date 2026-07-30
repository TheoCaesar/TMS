import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, switchMap } from 'rxjs/operators';
import { fromFetch } from 'rxjs/fetch';
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

// Every HTTP call as a cold Observable: nothing hits the network until
// something subscribes, and unsubscribing (e.g. a component unmounting
// mid-request) aborts the underlying fetch via fromFetch's AbortController
// integration — a real advantage over a Promise, which can't be cancelled
// once started.
function rawRequest$<T>(path: string, options: RequestOptions = {}): Observable<T> {
  const { method = 'GET', body, auth = true, query } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const tokens = getTokens();
    if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  return fromFetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).pipe(
    switchMap((response) =>
      (response.json() as Promise<ApiEnvelope<T>>).then((envelope) => ({ response, envelope })),
    ),
    switchMap(({ response, envelope }) =>
      response.ok
        ? of(envelope.data)
        : throwError(
            () => new ApiError(envelope.code ?? response.status, envelope.message ?? response.statusText),
          ),
    ),
  );
}

// Coordinates concurrent 401s into a single in-flight refresh call —
// shareReplay(1) multicasts the one HTTP request's result to every
// subscriber that arrives while it's pending, mirroring the old
// Promise-based "refreshInFlight" cache but expressed as a shared stream.
let refresh$: Observable<AuthTokens> | null = null;

function refreshTokens$(): Observable<AuthTokens> {
  const current = getTokens();
  if (!current) return throwError(() => new ApiError(401, 'Not authenticated'));

  if (!refresh$) {
    refresh$ = rawRequest$<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: current.refreshToken },
      auth: false,
    }).pipe(
      switchMap((tokens) => {
        setTokens(tokens);
        return of(tokens);
      }),
      finalize(() => {
        refresh$ = null;
      }),
      shareReplay(1),
    );
  }
  return refresh$;
}

// Wraps rawRequest$ with one-shot access-token refresh-and-retry on a 401.
export function apiRequest$<T>(path: string, options: RequestOptions = {}): Observable<T> {
  return rawRequest$<T>(path, options).pipe(
    catchError((err: unknown) => {
      if (err instanceof ApiError && err.code === 401 && options.auth !== false && getTokens()) {
        return refreshTokens$().pipe(
          catchError(() => {
            clearTokens();
            return throwError(() => err);
          }),
          switchMap(() => rawRequest$<T>(path, options)),
        );
      }
      return throwError(() => err);
    }),
  );
}
