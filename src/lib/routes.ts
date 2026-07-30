// Central route path registry — keep in sync with src/App.tsx route definitions
// and the bottom tab bar (src/components/layout/BottomNav.tsx). Naming follows
// the Figma prototype's own labels (Explore, Hotels, My Trips, ...).
export const ROUTES = {
  home: '/',
  explore: '/explore',
  flights: '/flights',
  hotels: '/hotels',
  food: '/food',
  transport: '/transport',
  emergency: '/emergency',
  trips: '/trips',
  bookings: '/bookings',
  profile: '/profile',
  auth: {
    login: '/login',
    register: '/register',
  },
  paymentCallback: '/payments/callback',
} as const;
