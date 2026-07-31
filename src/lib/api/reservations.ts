import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiRequest$ } from './client';
import { toMinorUnits } from './money';
import type { Reservation } from './types';

// Shared by Stays, Flights, and restaurant Tables — the same
// /reservations/{reference} endpoints regardless of `type`. Each module
// creates a reservation via its own booking endpoint (stays.ts's
// bookStay$, flights.ts's bookFlightOffer$, restaurants.ts's
// reserveTable$); this file only covers reading and cancelling one by
// reference afterward.
export type RawReservation = Omit<Reservation, 'totalMinor'> & {
  totalMinor?: number;
  total?: number;
};

export function normalizeReservation(raw: RawReservation): Reservation {
  return { ...raw, totalMinor: toMinorUnits(raw.totalMinor, raw.total) };
}

export function getReservation$(reference: string): Observable<Reservation> {
  return apiRequest$<RawReservation>(`/reservations/${reference}`).pipe(map(normalizeReservation));
}

export function cancelReservation$(reference: string): Observable<Reservation> {
  return apiRequest$<RawReservation>(`/reservations/${reference}/cancel`, {
    method: 'POST',
  }).pipe(map(normalizeReservation));
}
