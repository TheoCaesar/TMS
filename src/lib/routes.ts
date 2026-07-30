// Central route path registry — keep in sync with src/App.tsx route definitions.
export const ROUTES = {
  home: '/',
  poi: '/explore',
  flights: '/flights',
  accommodation: '/stays',
  food: '/food',
  transport: '/transport',
  emergency: '/emergency',
  auth: {
    login: '/login',
    register: '/register',
  },
  payments: '/payments',
} as const;
