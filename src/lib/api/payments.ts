import type { Observable } from 'rxjs';
import { apiRequest$ } from './client';
import type { InitiatePaymentInput } from './types';

// Verified against a real response (booking TUR-2026-0005): authorizationUrl
// correctly redirects to a live Paystack test-mode checkout for the right
// amount/customer. The earlier 500 (see docs/DEVELOPMENT_LOG.md) appears to
// have been intermittent rather than a hard bug -- worth keeping an eye on.
export interface InitiatePaymentResult {
  authorizationUrl: string;
  reference: string;
  accessCode?: string;
}

export function initiatePayment$(input: InitiatePaymentInput): Observable<InitiatePaymentResult> {
  return apiRequest$<InitiatePaymentResult>('/payments/initiate', { method: 'POST', body: input });
}

export function verifyPayment$(reference: string): Observable<unknown> {
  return apiRequest$(`/payments/${reference}/verify`);
}
