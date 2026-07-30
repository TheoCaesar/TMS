import { apiRequest } from './client';
import type { LoyaltyInfo, UpdateProfileInput, UserProfile } from './types';

export function getMe(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me');
}

export function updateMe(input: UpdateProfileInput): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me', { method: 'PATCH', body: input });
}

export function getMyLoyalty(): Promise<LoyaltyInfo> {
  return apiRequest<LoyaltyInfo>('/users/me/loyalty');
}
