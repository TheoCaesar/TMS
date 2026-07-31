import type { Observable } from 'rxjs';
import { apiRequest$ } from './client';
import type {
  ApiPage,
  CreateDepartureInput,
  CreateTourInput,
  Departure,
  Tour,
  ToursQuery,
  UpdateTourInput,
} from './types';

// Both public reads below return APPROVED tours only. There is deliberately
// no way to list your own DRAFT/PENDING_REVIEW tours -- the backend has no
// `GET /tours/mine` yet (see docs/API_REQUIREMENTS.md), which is why the
// operator console remembers what it created rather than re-reading it.
export function listTours$(queryParams: ToursQuery = {}): Observable<ApiPage<Tour>> {
  return apiRequest$<ApiPage<Tour>>('/tours', { auth: false, query: { ...queryParams } });
}

export function getTourBySlug$(slug: string): Observable<Tour> {
  return apiRequest$<Tour>(`/tours/${slug}`, { auth: false });
}

export function listDepartures$(tourId: string): Observable<Departure[]> {
  return apiRequest$<Departure[]>(`/tours/${tourId}/departures`, { auth: false });
}

// --- Operator-owned writes (OPERATOR role, and owner of the tour) ---

// Created tours start as DRAFT and are invisible to the public listing
// until an ADMIN approves them.
export function createTour$(input: CreateTourInput): Observable<Tour> {
  return apiRequest$<Tour>('/tours', { method: 'POST', body: input });
}

export function updateTour$(tourId: string, input: UpdateTourInput): Observable<Tour> {
  return apiRequest$<Tour>(`/tours/${tourId}`, { method: 'PATCH', body: input });
}

// DRAFT -> PENDING_REVIEW.
export function submitTour$(tourId: string): Observable<Tour> {
  return apiRequest$<Tour>(`/tours/${tourId}/submit`, { method: 'POST' });
}

export function createDeparture$(
  tourId: string,
  input: CreateDepartureInput,
): Observable<Departure> {
  return apiRequest$<Departure>(`/tours/${tourId}/departures`, { method: 'POST', body: input });
}

// --- Admin moderation ---

// PENDING_REVIEW -> APPROVED. Only after this does a tour appear in the
// public listing and become bookable.
export function approveTour$(tourId: string): Observable<Tour> {
  return apiRequest$<Tour>(`/tours/${tourId}/approve`, { method: 'POST' });
}

export function suspendTour$(tourId: string): Observable<Tour> {
  return apiRequest$<Tour>(`/tours/${tourId}/suspend`, { method: 'POST' });
}
