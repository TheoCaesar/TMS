import { MapPin, RefreshCw, Search, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { destinationsApi, toursApi, type Destination, type Tour } from '@/lib/api';
import { useApiResource } from '@/hooks/useApiResource';
import { Skeleton, SkeletonLine, SkeletonRegion } from '@/components/ui/Skeleton';
import { formatDuration } from '@/lib/format';

// Module M1 — Place of Interest Locator in the Figma design (search,
// category filters, map, "Nearby Places" list). The live API has no
// generic POI concept — only bookable Tours — so results are real Tours
// data reusing Figma's card layout. The Attractions/Restaurants/Hotels
// filters exist visually to match Figma but have no real data behind
// them yet (see docs/DEVELOPMENT_LOG.md); only "All" is populated.
const categories = ['All', 'Attractions', 'Restaurants', 'Hotels'] as const;
type Category = (typeof categories)[number];

export function ExplorePage() {
  const [category, setCategory] = useState<Category>('All');
  const [query, setQuery] = useState('');

  const { data, status, retry } = useApiResource(() =>
    forkJoin({
      toursPage: toursApi.listTours$({ limit: 20 }),
      destinationsPage: destinationsApi.listDestinations$(1, 50),
    }).pipe(
      map(({ toursPage, destinationsPage }) => ({
        tours: toursPage.results,
        destinationsById: new Map<string, Destination>(
          destinationsPage.results.map((d) => [d.id, d]),
        ),
      })),
    ),
  );

  const filteredTours = useMemo(() => {
    if (!data) return [];
    if (category !== 'All') return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.tours;
    return data.tours.filter((tour: Tour) => tour.title.toLowerCase().includes(q));
  }, [data, category, query]);

  return (
    <div>
      <header className="px-5 pt-6 pb-4 md:px-8 md:pt-10">
        <div className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400 md:max-w-lg">
          <Search className="size-5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search locations..."
            className="w-full bg-transparent text-sm text-ink-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
          />
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 pb-4 md:px-8">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
              category === c
                ? 'bg-brand-600 text-white'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mx-5 mb-6 flex h-32 items-center justify-center rounded-card bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-900 md:mx-8 md:h-48">
        Map View
      </div>

      <section className="px-5 md:px-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">Nearby Places</h2>
          {status === 'ready' && (
            <span className="text-sm text-neutral-400">{filteredTours.length} places</span>
          )}
        </div>

        {status === 'error' && (
          <div className="flex items-center justify-between rounded-card border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            <span>Couldn't load places.</span>
            <button
              type="button"
              onClick={retry}
              className="flex items-center gap-1 font-medium text-brand-600 dark:text-brand-500"
            >
              <RefreshCw className="size-4" /> Retry
            </button>
          </div>
        )}

        {/* Same grid, same card count, same internal layout as the real
            results below: thumbnail, title, meta line, rating row. */}
        {status === 'loading' && (
          <SkeletonRegion
            label="Loading places"
            className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3"
          >
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-card border border-neutral-100 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <Skeleton className="size-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonLine className="w-3/4" />
                  <SkeletonLine className="w-1/2" />
                  <SkeletonLine className="h-3 w-12" />
                </div>
              </div>
            ))}
          </SkeletonRegion>
        )}

        {status === 'ready' && category !== 'All' && (
          <p className="py-6 text-center text-sm text-neutral-400">
            No {category.toLowerCase()} listed yet — check back soon.
          </p>
        )}

        {status === 'ready' && category === 'All' && (
          <div className="space-y-3 pb-4 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">
            {filteredTours.map((tour) => {
              const destination = data?.destinationsById.get(tour.destinationId);
              return (
                <Link
                  key={tour.id}
                  to={`/explore/${tour.slug}`}
                  className="flex gap-3 rounded-card border border-neutral-100 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-neutral-800 dark:to-neutral-950">
                    {tour.heroImageUrl ? (
                      <img
                        src={tour.heroImageUrl}
                        alt={tour.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <MapPin className="size-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink-900 dark:text-white">
                      {tour.title}
                    </div>
                    <div className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                      {destination?.name ?? destination?.region} · {formatDuration(tour.durationMinutes)}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm">
                      <Star className="size-4 fill-accent-500 text-accent-500" />
                      <span className="font-medium text-ink-900 dark:text-white">
                        {tour.ratingCount > 0 ? tour.ratingAvg.toFixed(1) : 'New'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
