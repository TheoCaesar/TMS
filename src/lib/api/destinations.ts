import type { Observable } from 'rxjs';
import { apiRequest$ } from './client';
import type { ApiPage, Destination } from './types';

export function listDestinations$(page = 1, limit = 20): Observable<ApiPage<Destination>> {
  return apiRequest$<ApiPage<Destination>>('/destinations', {
    auth: false,
    query: { page, limit },
  });
}

export function getDestination$(id: string): Observable<Destination> {
  return apiRequest$<Destination>(`/destinations/${id}`, { auth: false });
}
