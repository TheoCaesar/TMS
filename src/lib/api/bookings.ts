import type { Observable } from 'rxjs';
import { apiRequest$ } from './client';
import type { ApiPage, Booking, BookingStatus, CreateBookingInput } from './types';

export function createBooking$(input: CreateBookingInput): Observable<Booking> {
  return apiRequest$<Booking>('/bookings', { method: 'POST', body: input });
}

export function listMyBookings$(
  status?: BookingStatus,
  page = 1,
  limit = 20,
): Observable<ApiPage<Booking>> {
  return apiRequest$<ApiPage<Booking>>('/bookings/me', { query: { status, page, limit } });
}

export function getBooking$(reference: string): Observable<Booking> {
  return apiRequest$<Booking>(`/bookings/${reference}`);
}

export function cancelBooking$(reference: string): Observable<Booking> {
  return apiRequest$<Booking>(`/bookings/${reference}/cancel`, { method: 'POST' });
}
