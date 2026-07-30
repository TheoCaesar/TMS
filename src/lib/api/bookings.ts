import { apiRequest } from './client';
import type { ApiPage, Booking, BookingStatus, CreateBookingInput } from './types';

export function createBooking(input: CreateBookingInput): Promise<Booking> {
  return apiRequest<Booking>('/bookings', { method: 'POST', body: input });
}

export function listMyBookings(status?: BookingStatus, page = 1, limit = 20): Promise<ApiPage<Booking>> {
  return apiRequest<ApiPage<Booking>>('/bookings/me', { query: { status, page, limit } });
}

export function getBooking(reference: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${reference}`);
}

export function cancelBooking(reference: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${reference}/cancel`, { method: 'POST' });
}
