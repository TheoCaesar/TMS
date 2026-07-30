import type { Observable } from 'rxjs';
import { apiRequest$ } from './client';
import type { ApiPage, Departure, Tour, ToursQuery } from './types';

export function listTours$(queryParams: ToursQuery = {}): Observable<ApiPage<Tour>> {
  return apiRequest$<ApiPage<Tour>>('/tours', { auth: false, query: { ...queryParams } });
}

export function getTourBySlug$(slug: string): Observable<Tour> {
  return apiRequest$<Tour>(`/tours/${slug}`, { auth: false });
}

export function listDepartures$(tourId: string): Observable<Departure[]> {
  return apiRequest$<Departure[]>(`/tours/${tourId}/departures`, { auth: false });
}
