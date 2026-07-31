import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiRequest$ } from './client';
import { toMinorUnits } from './money';
import { normalizeReservation, type RawReservation } from './reservations';
import type { ApiPage, BookStayInput, Reservation, Room, Stay, StaysQuery } from './types';

// Hotels / Stays (module M3). Listing, detail, and rooms are public;
// booking requires auth and creates a STAY reservation (see
// reservations.ts for get/cancel by reference).

type RawStay = Omit<Stay, 'fromPriceMinor'> & { fromPriceMinor?: number; fromPrice?: number };

// Money comes back in major GHS units under `fromPrice`, same
// guide-vs-reality mismatch as everywhere else on this API (money.ts).
function normalizeStay(raw: RawStay): Stay {
  return { ...raw, fromPriceMinor: toMinorUnits(raw.fromPriceMinor, raw.fromPrice) };
}

export function listStays$(query: StaysQuery = {}): Observable<ApiPage<Stay>> {
  return apiRequest$<ApiPage<RawStay>>('/stays', { query: { ...query }, auth: false }).pipe(
    map((page) => ({ ...page, results: page.results.map(normalizeStay) })),
  );
}

export function getStayBySlug$(slug: string): Observable<Stay> {
  return apiRequest$<RawStay>(`/stays/${slug}`, { auth: false }).pipe(map(normalizeStay));
}

type RawRoom = Omit<Room, 'pricePerNightMinor'> & {
  pricePerNightMinor?: number;
  pricePerNight?: number;
};

// GET /stays/:id/rooms takes the stay's id, not its slug (unlike the
// detail endpoint) — a 400 "uuid is expected" otherwise.
export function listRooms$(
  stayId: string,
  params?: { checkIn?: string; checkOut?: string; guests?: number },
): Observable<Room[]> {
  return apiRequest$<RawRoom[]>(`/stays/${stayId}/rooms`, { query: params, auth: false }).pipe(
    map((rooms) =>
      rooms.map((r) => ({
        ...r,
        pricePerNightMinor: toMinorUnits(r.pricePerNightMinor, r.pricePerNight),
      })),
    ),
  );
}

export function bookStay$(stayId: string, input: BookStayInput): Observable<Reservation> {
  return apiRequest$<RawReservation>(`/stays/${stayId}/book`, {
    method: 'POST',
    body: input,
  }).pipe(map(normalizeReservation));
}
