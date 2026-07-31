import type { Observable } from 'rxjs';
import { apiRequest$ } from './client';
import type { ApiPage, GenerateItineraryInput, Itinerary } from './types';

// AI itinerary planner. Plans are grounded in the real APPROVED tours in
// the system: items with `bookable: true` carry a genuine tourId/tourSlug
// that deep-links into the existing booking flow (see ItineraryDetailPage).
// All four endpoints require auth.

// Synchronous and slow by design — no streaming, no socket channel. The
// request holds open until the whole plan is ready; measured at ~66s against
// the live free-tier model. Hence the 2-minute ceiling (the guide recommends
// at least ~90s) and the dedicated long-wait UI on ItinerariesPage.
// Errors worth handling: 502 (model failed), 503 (no AI key on the server).
export function generateItinerary$(input: GenerateItineraryInput): Observable<Itinerary> {
  return apiRequest$<Itinerary>('/itineraries/generate', {
    method: 'POST',
    body: input,
    timeoutMs: 120_000,
  });
}

export function listItineraries$(page = 1, limit = 20): Observable<ApiPage<Itinerary>> {
  return apiRequest$<ApiPage<Itinerary>>('/itineraries', { query: { page, limit } });
}

// Returns 404 (not 403) for an itinerary belonging to someone else.
export function getItinerary$(id: string): Observable<Itinerary> {
  return apiRequest$<Itinerary>(`/itineraries/${id}`);
}

export function deleteItinerary$(id: string): Observable<null> {
  return apiRequest$<null>(`/itineraries/${id}`, { method: 'DELETE' });
}
