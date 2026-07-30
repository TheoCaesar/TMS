import { apiRequest } from './client';
import { clearTokens, getTokens, setTokens } from './tokenStore';
import type { AuthTokens, LoginInput, RegisterInput } from './types';

export async function register(input: RegisterInput): Promise<AuthTokens> {
  const tokens = await apiRequest<AuthTokens>('/auth/register', {
    method: 'POST',
    body: input,
    auth: false,
  });
  setTokens(tokens);
  return tokens;
}

export async function login(input: LoginInput): Promise<AuthTokens> {
  const tokens = await apiRequest<AuthTokens>('/auth/login', {
    method: 'POST',
    body: input,
    auth: false,
  });
  setTokens(tokens);
  return tokens;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest<null>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    auth: false,
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiRequest<null>('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
    auth: false,
  });
}

export async function logout(): Promise<void> {
  const tokens = getTokens();
  clearTokens();
  if (!tokens) return;
  try {
    await apiRequest<null>('/auth/logout', {
      method: 'POST',
      body: { refreshToken: tokens.refreshToken },
      auth: false,
    });
  } catch {
    // Best-effort server-side revocation; local tokens are already cleared.
  }
}
