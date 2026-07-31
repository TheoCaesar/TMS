// Types matching the live TMS API (see docs/DEVELOPMENT_LOG.md for how these
// were derived from GET /api/docs-json). This is the API actually available
// for integration — narrower than the full SRS vision in src/types/: it
// covers Auth, Destinations, Tours (+ Departures), Bookings, Payments
// (Paystack), Reviews, and user/loyalty profile only.

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export interface ApiPage<T> {
  results: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type UserRole = 'TOURIST' | 'OPERATOR' | 'ADMIN';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  loyaltyPoints: number;
}

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface LoyaltyInfo {
  points: number;
  tier: LoyaltyTier;
}

export interface Destination {
  id: string;
  name: string;
  region: string;
  country: string;
  description: string;
  heroImageUrl: string | null;
  lat?: number;
  lng?: number;
}

export type TourStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED';

export interface Tour {
  id: string;
  operatorId: string;
  destinationId: string;
  title: string;
  slug: string;
  description: string;
  priceMinor: number; // minor currency unit, e.g. pesewas for GHS
  currency: string;
  durationMinutes: number;
  status: TourStatus;
  heroImageUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
}

export type DepartureStatus = 'SCHEDULED' | 'CLOSED' | 'CANCELLED';

export interface Departure {
  id: string;
  tourId: string;
  departsAt: string;
  capacity: number;
  seatsLeft: number;
  status: DepartureStatus;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  reference: string;
  departureId: string;
  seats: number;
  totalMinor: number;
  currency: string;
  status: BookingStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  tourId: string;
  authorId: string;
  rating: number;
  body: string;
  createdAt: string;
}

// --- AI itinerary planner ---
// Shapes verified against a real POST /itineraries/generate response
// (Cape Coast, 2 days) rather than the OpenAPI spec, which types `plan` as
// an opaque object.

export type ItineraryPeriod = 'morning' | 'afternoon' | 'evening';

export type ItineraryItemKind = 'TOUR' | 'MEAL' | 'FREE' | 'TIP';

export interface ItineraryItem {
  period: ItineraryPeriod;
  kind: ItineraryItemKind;
  title: string;
  description: string;
  estimatedCostMinor?: number;
  // The model is only allowed to reference tours that really exist —
  // invented ones are stripped server-side and downgraded to bookable:false.
  // tourId/tourSlug are therefore only safe to read when bookable is true.
  bookable: boolean;
  tourId?: string;
  tourSlug?: string;
}

export interface ItineraryPlanDay {
  day: number; // 1-based
  title: string;
  items: ItineraryItem[];
}

export interface ItineraryPlan {
  summary: string;
  estimatedTotalMinor?: number;
  notes?: string[];
  days: ItineraryPlanDay[];
}

// Note: `days` here is the requested trip length (a number), while
// `plan.days` is the generated day-by-day array. Both come from the API
// under that name.
export interface Itinerary {
  id: string;
  title: string;
  destinationName: string;
  days: number;
  budgetMinor?: number;
  partySize: number;
  interests: string[];
  model: string;
  createdAt: string;
  plan: ItineraryPlan;
}

// --- Request payloads ---

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ToursQuery {
  page?: number;
  limit?: number;
  destinationId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export interface CreateBookingInput {
  departureId: string;
  seats: number;
}

export interface InitiatePaymentInput {
  bookingReference: string;
}

export interface CreateReviewInput {
  rating: number;
  body: string;
}

export interface GenerateItineraryInput {
  destination: string; // 2-120 chars
  days: number; // 1-14
  budgetMinor?: number; // GHS pesewas, >= 0
  partySize?: number; // 1-20, defaults to 1 server-side
  interests?: string[]; // up to 10, each 1-40 chars
}
