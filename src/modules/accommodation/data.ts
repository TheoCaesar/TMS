import { CircleParking, Coffee, Dumbbell, Sparkles, Waves, Wifi, type LucideIcon } from 'lucide-react';

// Module M3 — Accommodation Booking (SRS 3.4, FR-ACC-01 to 12). Real data
// via GET /stays (see src/lib/api/stays.ts) — this file now only holds the
// amenity icon/label lookup, since `amenities` on a live Stay is a bag of
// uppercase strings (WIFI, POOL, BREAKFAST, PARKING, SPA, GYM, ...) with no
// guarantee the set won't grow, hence the fallback icon below.
export const amenityMeta: Record<string, { icon: LucideIcon; label: string }> = {
  WIFI: { icon: Wifi, label: 'Free WiFi' },
  POOL: { icon: Waves, label: 'Swimming Pool' },
  BREAKFAST: { icon: Coffee, label: 'Breakfast' },
  PARKING: { icon: CircleParking, label: 'Free Parking' },
  SPA: { icon: Sparkles, label: 'Spa' },
  GYM: { icon: Dumbbell, label: 'Gym' },
};

export function getAmenityMeta(key: string): { icon: LucideIcon; label: string } {
  return amenityMeta[key] ?? { icon: Sparkles, label: key.charAt(0) + key.slice(1).toLowerCase() };
}
