import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiRequest$ } from './client';
import { toMinorUnits } from './money';
import { normalizeReservation, type RawReservation } from './reservations';
import type {
  Airport,
  FlightOffer,
  FlightSearchResult,
  Reservation,
  SearchFlightsInput,
} from './types';

// Flights (module M2). Airport lookup and search/offer are public;
// booking an offer requires auth and creates a FLIGHT reservation (see
// reservations.ts). Offers are time-limited (`expiresAt`) — never book a
// stale price; re-fetch via getFlightOffer$ if in doubt.

export function searchAirports$(q: string): Observable<Airport[]> {
  return apiRequest$<Airport[]>('/flights/airports', { query: { q }, auth: false });
}

type RawFlightOffer = Omit<FlightOffer, 'totalMinor'> & { totalMinor?: number; total?: number };

// Money comes back in major GHS units under `total`, same guide-vs-reality
// mismatch as everywhere else on this API (money.ts).
function normalizeOffer(raw: RawFlightOffer): FlightOffer {
  return { ...raw, totalMinor: toMinorUnits(raw.totalMinor, raw.total) };
}

export function searchFlights$(input: SearchFlightsInput): Observable<FlightSearchResult> {
  return apiRequest$<{ searchId: string; expiresAt: string; offers: RawFlightOffer[] }>(
    '/flights/search',
    { method: 'POST', body: input, auth: false },
  ).pipe(map((result) => ({ ...result, offers: result.offers.map(normalizeOffer) })));
}

export function getFlightOffer$(offerId: string): Observable<FlightOffer> {
  return apiRequest$<RawFlightOffer>(`/flights/offers/${offerId}`, { auth: false }).pipe(
    map(normalizeOffer),
  );
}

// No request body — the offer already encodes the passengers/cabin given
// at search time.
export function bookFlightOffer$(offerId: string): Observable<Reservation> {
  return apiRequest$<RawReservation>(`/flights/offers/${offerId}/book`, {
    method: 'POST',
  }).pipe(map(normalizeReservation));
}
