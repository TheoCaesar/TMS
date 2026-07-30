import { apiRequest } from './client';
import type { ApiPage, Departure, Tour, ToursQuery } from './types';

export function listTours(queryParams: ToursQuery = {}): Promise<ApiPage<Tour>> {
  return apiRequest<ApiPage<Tour>>('/tours', { auth: false, query: { ...queryParams } });
}

export function getTourBySlug(slug: string): Promise<Tour> {
  return apiRequest<Tour>(`/tours/${slug}`, { auth: false });
}

export function listDepartures(tourId: string): Promise<Departure[]> {
  return apiRequest<Departure[]>(`/tours/${tourId}/departures`, { auth: false });
}
