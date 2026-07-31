import { Calendar, Hotel, RefreshCw, Search, Star, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { staysApi, type Stay, type StayCategory } from '@/lib/api';
import { useApiResource } from '@/hooks/useApiResource';
import { Skeleton, SkeletonLine, SkeletonRegion } from '@/components/ui/Skeleton';
import { getAmenityMeta } from '@/modules/accommodation/data';
import { formatMoney } from '@/lib/format';
import { ROUTES } from '@/lib/routes';

// Module M3 — Accommodation Booking (SRS 3.4, FR-ACC-01 to 12).
//
// Real data via GET /stays (was static data.ts). Search and category are
// server-side filters; Check-in/Check-out/Guests stay inert placeholders
// below — /stays itself doesn't take date-range params (only per-room
// availability at /stays/:id/rooms does, wired on the detail page).
const categories: { value: StayCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'HOTEL', label: 'Hotels' },
  { value: 'VILLA', label: 'Villas' },
  { value: 'HOSTEL', label: 'Hostels' },
  { value: 'APARTMENT', label: 'Apartments' },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-4 ${
            i < count ? 'fill-accent-500 text-accent-500' : 'text-neutral-200 dark:text-neutral-700'
          }`}
        />
      ))}
    </div>
  );
}

function StayCard({ stay }: { stay: Stay }) {
  return (
    <Link
      to={`${ROUTES.hotels}/${stay.slug}`}
      className="group overflow-hidden rounded-card border border-neutral-100 bg-white shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-neutral-800 dark:to-neutral-950">
        {stay.heroImageUrl ? (
          <img
            src={stay.heroImageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <Hotel className="size-10" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-bold text-ink-900 dark:text-white">{stay.name}</h2>
          {stay.ratingCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-ink-900 dark:text-white">
              <Star className="size-4 fill-accent-500 text-accent-500" /> {stay.ratingAvg.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-1">
          <StarRow count={stay.stars} />
        </div>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {stay.location}
          {stay.distanceKm !== undefined && ` · ${stay.distanceKm.toFixed(1)} km away`}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {stay.amenities.slice(0, 4).map((key) => {
            const { icon: Icon, label } = getAmenityMeta(key);
            return (
              <span
                key={key}
                className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"
              >
                <Icon className="size-3.5 text-brand-600" /> {label}
              </span>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <span>
            <span className="text-lg font-bold text-brand-600 dark:text-brand-500">
              {formatMoney(stay.fromPriceMinor, stay.currency)}
            </span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400"> / night</span>
          </span>
          <span className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}

export function AccommodationSearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<StayCategory | 'ALL'>('ALL');

  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);

  const filtersRef = useRef({ debouncedQuery, category });
  filtersRef.current = { debouncedQuery, category };

  const { data, status, retry } = useApiResource(() => {
    const f = filtersRef.current;
    return staysApi.listStays$({
      limit: 30,
      q: f.debouncedQuery || undefined,
      category: f.category === 'ALL' ? undefined : f.category,
    });
  });

  const retryRef = useRef(retry);
  retryRef.current = retry;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    retryRef.current();
  }, [debouncedQuery, category]);

  const stays = useMemo(() => data?.results ?? [], [data]);

  return (
    <div className="md:mx-auto md:max-w-5xl md:px-6 lg:px-8">
      <header className="px-5 pt-6 pb-4 md:px-0 md:pt-10">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Find a Place to Stay</h1>
      </header>

      <div className="px-5 md:px-0">
        <div className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <Search className="size-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where are you going?"
            className="w-full bg-transparent text-sm text-ink-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
          />
        </div>

        {/* /stays has no date-range or party-size params at the list level
            (only per-room, on the detail page) — these stay inert. */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 px-3 py-3 text-sm font-medium text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
          >
            <Calendar className="size-4" /> Check-in
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 px-3 py-3 text-sm font-medium text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
          >
            <Calendar className="size-4" /> Check-out
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 px-3 py-3 text-sm font-medium text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
          >
            <Users className="size-4" /> Guests
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 py-4 md:px-0">
        {categories.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
              category === value
                ? 'bg-brand-600 text-white'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {status === 'loading' && (
        <SkeletonRegion
          label="Loading places to stay"
          className="flex flex-col gap-4 px-5 pb-6 md:grid md:grid-cols-2 md:gap-4 md:px-0 lg:grid-cols-3"
        >
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-card border border-neutral-100 dark:border-neutral-800"
            >
              <Skeleton className="h-44 rounded-none" />
              <div className="space-y-2 p-4">
                <SkeletonLine className="w-2/3" />
                <SkeletonLine className="w-1/2" />
                <SkeletonLine className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </SkeletonRegion>
      )}

      {status === 'error' && (
        <div className="mx-5 flex items-center justify-between rounded-card border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 md:mx-0">
          <span>Couldn't load places to stay.</span>
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-1 font-medium text-brand-600 dark:text-brand-500"
          >
            <RefreshCw className="size-4" /> Retry
          </button>
        </div>
      )}

      {status === 'ready' && stays.length === 0 && (
        <p className="mx-5 rounded-card border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-400 dark:border-neutral-800 md:mx-0">
          No places match those filters.
        </p>
      )}

      {status === 'ready' && stays.length > 0 && (
        <div className="flex flex-col gap-4 px-5 pb-6 md:grid md:grid-cols-2 md:gap-4 md:px-0 lg:grid-cols-3">
          {stays.map((stay) => (
            <StayCard key={stay.id} stay={stay} />
          ))}
        </div>
      )}
    </div>
  );
}
