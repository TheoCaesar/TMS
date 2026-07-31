// Central route path registry — keep in sync with src/App.tsx route definitions
// and the bottom tab bar (src/components/layout/BottomNav.tsx). Naming follows
// the Figma prototype's own labels (Explore, Hotels, My Trips, ...).
export const ROUTES = {
  home: '/',
  explore: '/explore',
  flights: '/flights',
  flightResults: '/flights/results',
  hotels: '/hotels',
  food: '/food',
  transport: '/transport',
  transportActiveRide: '/transport/active-ride',
  emergency: '/emergency',
  trips: '/trips',
  bookings: '/bookings',
  profile: '/profile',
  profilePersonalInfo: '/profile/personal-info',
  auth: {
    login: '/login',
    register: '/register',
  },
  paymentCallback: '/payments/callback',
} as const;
