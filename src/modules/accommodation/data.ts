import { CircleParking, Coffee, Waves, Wifi } from 'lucide-react';

// Module M3 — Accommodation Booking (SRS 3.4, FR-ACC-01 to 12). No
// backend endpoint exists for this module (see docs/HANDOFF.md), so
// this static list is the design's own content from two user-supplied
// screenshots ("Hotel" list and "Hotel details" for Labadi Beach Hotel).
// Only Labadi Beach Hotel has room/review data — the screenshot for
// Coconut Grove was list-only, so its detail page shows an honest empty
// state rather than invented rooms/reviews.
export type AmenityKey = 'Wifi' | 'Pool' | 'Breakfast' | 'Parking';

export const amenityMeta: Record<AmenityKey, { icon: typeof Wifi; short: string; long: string }> = {
  Wifi: { icon: Wifi, short: 'Wifi', long: 'Free WiFi' },
  Pool: { icon: Waves, short: 'Pool', long: 'Swimming Pool' },
  Breakfast: { icon: Coffee, short: 'Breakfast', long: 'Breakfast' },
  Parking: { icon: CircleParking, short: 'Parking', long: 'Free Parking' },
};

export type Room = { name: string; guests: number; bed: string; pricePerNight: string };
export type Review = { name: string; rating: number; comment: string; date: string };

export type Hotel = {
  slug: string;
  name: string;
  location: string;
  rating: number;
  stars: number;
  pricePerNight: string;
  amenities: AmenityKey[];
  rooms?: Room[];
  reviews?: Review[];
};

export const hotels: Hotel[] = [
  {
    slug: 'labadi-beach-hotel',
    name: 'Labadi Beach Hotel',
    location: 'Accra, Ghana',
    rating: 4.8,
    stars: 5,
    pricePerNight: 'GHS 450',
    amenities: ['Wifi', 'Pool', 'Breakfast', 'Parking'],
    rooms: [
      { name: 'Standard Room', guests: 2, bed: '1 Queen Bed', pricePerNight: 'GHS 450' },
      { name: 'Deluxe Suite', guests: 3, bed: '1 King Bed', pricePerNight: 'GHS 680' },
    ],
    reviews: [
      {
        name: 'Ama Darko',
        rating: 5.0,
        comment: 'Amazing hotel with excellent service! The beach view was stunning.',
        date: 'May 15, 2026',
      },
      {
        name: 'Kwame Asante',
        rating: 4.0,
        comment: 'Great location and friendly staff. The rooms are spacious and clean.',
        date: 'May 10, 2026',
      },
    ],
  },
  {
    slug: 'coconut-grove-hotel',
    name: 'Coconut Grove Hotel',
    location: 'Cape Coast, Ghana',
    rating: 4.6,
    stars: 4,
    pricePerNight: 'GHS 320',
    amenities: ['Wifi', 'Breakfast', 'Parking'],
  },
];
