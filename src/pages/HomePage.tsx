import {
  AlertCircle,
  Building2,
  Car,
  Compass,
  MapPin,
  Plane,
  RefreshCw,
  Search,
  Utensils,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { destinationsApi } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useApiResource } from '@/hooks/useApiResource';

const quickAccess = [
  { to: ROUTES.explore, label: 'Explore', icon: Compass },
  { to: ROUTES.flights, label: 'Flights', icon: Plane },
  { to: ROUTES.hotels, label: 'Hotels', icon: Building2 },
  { to: ROUTES.food, label: 'Food', icon: Utensils },
  { to: ROUTES.transport, label: 'Transport', icon: Car },
  { to: ROUTES.emergency, label: 'Emergency', icon: AlertCircle, danger: true },
];

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomePage() {
  const { user } = useCurrentUser();
  const { data: destinationsPage, status: destinationsStatus, retry } = useApiResource(() =>
    destinationsApi.listDestinations(1, 10),
  );
  const destinations = destinationsPage?.results ?? [];

  const firstName = user?.fullName.split(' ')[0];

  return (
    <div>
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">
          {timeOfDayGreeting()}
          {firstName ? `, ${firstName}` : ''} 👋
        </h1>
      </header>

      <div className="px-5">
        <div className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <Search className="size-5" />
          <span className="text-sm">Where do you want to go?</span>
        </div>
      </div>

      <section className="px-5 pt-6">
        <h2 className="mb-3 text-lg font-bold text-ink-900 dark:text-white">Quick Access</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickAccess.map(({ to, label, icon: Icon, danger }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-2 rounded-card border border-neutral-100 bg-white py-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <Icon className={`size-6 ${danger ? 'text-danger-500' : 'text-brand-600'}`} />
              <span
                className={`text-sm font-medium ${danger ? 'text-danger-500' : 'text-ink-900 dark:text-white'}`}
              >
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-6">
        <h2 className="mb-3 px-5 text-lg font-bold text-ink-900 dark:text-white">
          Featured Destinations
        </h2>
        {destinationsStatus === 'error' ? (
          <div className="ml-5 mr-20 flex items-center justify-between rounded-card border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
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
          <div className="flex gap-3 overflow-x-auto px-5 pb-2">
            {destinationsStatus === 'loading'
              ? Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className="h-[152px] w-40 shrink-0 animate-pulse rounded-card bg-neutral-100 dark:bg-neutral-900"
                  />
                ))
              : destinations.map((destination) => (
                  <Link
                    key={destination.id}
                    to={ROUTES.explore}
                    className="w-40 shrink-0 overflow-hidden rounded-card bg-neutral-100 dark:bg-neutral-900"
                  >
                    <div className="flex h-28 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-neutral-800 dark:to-neutral-900">
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
    </div>
  );
}
