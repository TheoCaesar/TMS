import { apiRequest } from './client';
import type { InitiatePaymentInput } from './types';

// Shape inferred from Paystack's typical initialize-transaction response —
// not yet verified against a real booking (would require creating and
// paying for a real booking to observe). Confirm once the booking flow is
// wired up end to end.
export interface InitiatePaymentResult {
  authorizationUrl: string;
  reference: string;
  accessCode?: string;
}

export function initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
  return apiRequest<InitiatePaymentResult>('/payments/initiate', { method: 'POST', body: input });
}

export function verifyPayment(reference: string): Promise<unknown> {
  return apiRequest(`/payments/${reference}/verify`);
}
