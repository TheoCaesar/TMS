import {
  Building2,
  Car,
  Compass,
  MapPin,
  Plane,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Utensils,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { destinationsApi } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/hooks/useAuth';
import { useApiResource } from '@/hooks/useApiResource';
import { Skeleton, SkeletonLine } from '@/components/ui/Skeleton';

// Emergency dropped from here — it now lives in the bottom nav's raised
// SOS button (and TopNav's persistent Emergency link on desktop) instead
// of sharing this grid, so it's reachable without scrolling past it.
const quickAccess = [
  { to: ROUTES.explore, label: 'Explore', icon: Compass },
  { to: ROUTES.itineraries, label: 'Plan Trip', icon: Sparkles },
  { to: ROUTES.flights, label: 'Flights', icon: Plane },
  { to: ROUTES.hotels, label: 'Hotels', icon: Building2 },
  { to: ROUTES.food, label: 'Food', icon: Utensils },
  { to: ROUTES.transport, label: 'Transport', icon: Car },
];

// No backend for a deals/discounts concept — this is the Figma design's
// own static content (like Explore's category pills), not fabricated
// data. See docs/HANDOFF.md's "never fabricate mock data" convention.
const todaysDeals = [
  { name: 'Labadi Beach Hotel', location: 'Accra, Ghana', price: 'GHS 450', wasPrice: 'GHS 650' },
  {
    name: 'Kakum Canopy Walk',
    location: 'Cape Coast, Ghana',
    price: 'GHS 120',
    wasPrice: 'GHS 180',
  },
  { name: 'Akwaaba Lodge', location: 'Kumasi, Ghana', price: 'GHS 320', wasPrice: 'GHS 480' },
  {
    name: 'Mole Safari Tour',
    location: 'Mole National Park',
    price: 'GHS 280',
    wasPrice: 'GHS 420',
  },
];

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomePage() {
  const { user } = useAuth();
  const { data: destinationsPage, status: destinationsStatus, retry } = useApiResource(() =>
    destinationsApi.listDestinations$(1, 10),
  );
  const destinations = destinationsPage?.results ?? [];

  const firstName = user?.fullName.split(' ')[0];

  return (
    <div>
      <header className="px-5 pt-6 pb-4 md:px-8 md:pt-10">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white md:text-3xl">
          {timeOfDayGreeting()}
          {firstName ? `, ${firstName}` : ''} 👋
        </h1>
      </header>

      <div className="px-5 md:px-8">
        <div className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400 md:max-w-lg">
          <Search className="size-5" />
          <span className="text-sm">Where do you want to go?</span>
        </div>
      </div>

      <section className="px-5 pt-6 md:px-8">
        <h2 className="mb-3 text-lg font-bold text-ink-900 dark:text-white">Quick Access</h2>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {quickAccess.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-2 rounded-card border border-neutral-100 bg-white py-5 shadow-sm transition hover:border-brand-200 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <Icon className="size-6 text-brand-600" />
              <span className="text-sm font-medium text-ink-900 dark:text-white">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-6">
        <h2 className="mb-3 px-5 text-lg font-bold text-ink-900 dark:text-white md:px-8">
          Featured Destinations
        </h2>
        {destinationsStatus === 'error' ? (
          <div className="ml-5 mr-20 flex items-center justify-between rounded-card border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 md:mx-8">
            <span>Couldn't load destinations.</span>
            <button
              type="button"
              onClick={retry}
              className="flex items-center gap-1 font-medium text-brand-600 dark:text-brand-500"
            >
              <RefreshCw className="size-4" /> Retry
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 md:grid md:grid-cols-3 md:overflow-visible md:px-8 lg:grid-cols-4">
            {destinationsStatus === 'loading'
              ? // Mirrors the real card: image band on top, name and region
                // beneath — so nothing reflows when the data lands.
                Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    role="status"
                    aria-busy="true"
                    aria-label="Loading destinations"
                    className="w-40 shrink-0 overflow-hidden rounded-card bg-neutral-100 dark:bg-neutral-900 md:w-auto md:shrink"
                  >
                    <Skeleton className="h-28 rounded-none md:h-32" />
                    <div className="space-y-2 p-3">
                      <SkeletonLine className="w-3/4" />
                      <SkeletonLine className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              : destinations.map((destination) => (
                  <Link
                    key={destination.id}
                    to={ROUTES.explore}
                    className="w-40 shrink-0 overflow-hidden rounded-card bg-neutral-100 transition hover:opacity-90 dark:bg-neutral-900 md:w-auto md:shrink"
                  >
                    <div className="flex h-28 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-neutral-800 dark:to-neutral-900 md:h-32">
                      {destination.heroImageUrl ? (
                        <img
                          src={destination.heroImageUrl}
                          alt={destination.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <MapPin className="size-8" />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="truncate font-semibold text-ink-900 dark:text-white">
                        {destination.name}
                      </div>
                      <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {destination.region}
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        )}
      </section>

      <section className="pt-6 pb-6">
        <h2 className="mb-3 px-5 text-lg font-bold text-ink-900 dark:text-white md:px-8">
          Today's Deals
        </h2>
        <div className="grid grid-cols-2 gap-3 px-5 md:px-8 lg:grid-cols-4">
          {todaysDeals.map((deal) => (
            <div
              key={deal.name}
              className="overflow-hidden rounded-card bg-neutral-100 dark:bg-neutral-900"
            >
              <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-neutral-800 dark:to-neutral-900">
                <MapPin className="size-8" />
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-accent-500 px-2 py-1 text-[10px] font-bold uppercase text-white">
                  <Tag className="size-3" /> Deal
                </span>
              </div>
              <div className="p-3">
                <div className="truncate font-semibold text-ink-900 dark:text-white">
                  {deal.name}
                </div>
                <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {deal.location}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-bold text-brand-600 dark:text-brand-500">
                    {deal.price}
                  </span>
                  <span className="text-xs text-neutral-400 line-through">{deal.wasPrice}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
