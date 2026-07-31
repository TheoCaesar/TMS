import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiRequest$ } from './client';
import { toMinorUnits } from './money';
import { normalizeReservation, type RawReservation } from './reservations';
import type { ApiPage, Reservation } from './types';

// Food & Drinks (module M4). Listing, detail, menu and availability are
// public; reserving requires auth.

export type DietaryTag = 'VEGETARIAN' | 'VEGAN' | 'HALAL' | 'GLUTEN_FREE';

export interface OpeningHours {
  day: number; // 0 = Sunday
  opens: string; // "11:00"
  closes: string; // "22:00"
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  priceTier: number; // 1-4, rendered as ₵-₵₵₵₵
  lat: number;
  lng: number;
  distanceKm?: number; // only when lat/lng were supplied
  ratingAvg: number;
  ratingCount: number;
  dietary: DietaryTag[];
  isOpenNow: boolean;
  heroImageUrl?: string;
  images?: string[];
  description?: string;
  openingHours?: OpeningHours[];
}

// Menu prices come back in major units like everything else on this API
// (see money.ts), so they're normalised to minor units at the edge to match
// the rest of the app.
export interface MenuItem {
  name: string;
  description?: string;
  priceMinor: number;
}

export interface MenuSection {
  category: string;
  items: MenuItem[];
}

export interface Availability {
  date: string;
  partySize: number;
  slots: string[]; // ISO datetimes that can be booked
}

export interface RestaurantsQuery {
  [key: string]: string | number | boolean | undefined;
  page?: number;
  limit?: number;
  q?: string;
  cuisine?: string;
  priceTier?: number;
  dietary?: DietaryTag;
  lat?: number;
  lng?: number;
  openNow?: boolean;
}

export function listRestaurants$(query: RestaurantsQuery = {}): Observable<ApiPage<Restaurant>> {
  return apiRequest$<ApiPage<Restaurant>>('/restaurants', { query, auth: false });
}

export function getRestaurant$(slug: string): Observable<Restaurant> {
  return apiRequest$<Restaurant>(`/restaurants/${slug}`, { auth: false });
}

type RawMenuItem = { name: string; description?: string; price?: number; priceMinor?: number };

export function getMenu$(restaurantId: string): Observable<MenuSection[]> {
  return apiRequest$<{ sections: { category: string; items: RawMenuItem[] }[] }>(
    `/restaurants/${restaurantId}/menu`,
    { auth: false },
  ).pipe(
    map((result) =>
      result.sections.map((section) => ({
        category: section.category,
        items: section.items.map((item) => ({
          name: item.name,
          description: item.description,
          priceMinor: toMinorUnits(item.priceMinor, item.price),
        })),
      })),
    ),
  );
}

// `date` is YYYY-MM-DD. Returns the slots that can actually be reserved for
// that party size, so the UI never offers a time the server will reject.
export function getAvailability$(
  restaurantId: string,
  date: string,
  partySize: number,
): Observable<Availability> {
  return apiRequest$<Availability>(`/restaurants/${restaurantId}/availability`, {
    query: { date, partySize },
    auth: false,
  });
}

export function reserveTable$(
  restaurantId: string,
  input: { at: string; partySize: number },
): Observable<Reservation> {
  return apiRequest$<RawReservation>(`/restaurants/${restaurantId}/reserve`, {
    method: 'POST',
    body: input,
  }).pipe(map(normalizeReservation));
}
