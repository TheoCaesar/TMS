import { ChevronLeft, MapPin, RefreshCw, Star, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { destinationsApi, toursApi } from '@/lib/api';
import { useApiResource } from '@/hooks/useApiResource';
import { formatDate, formatDuration, formatMoney, formatTime } from '@/lib/format';
import { ROUTES } from '@/lib/routes';

// Tour detail — reached from ExplorePage. Real data: GET /tours/{slug},
// GET /tours/{id}/departures, and the tour's destination for context.
// Booking against a departure is not wired up yet (next increment).
export function TourDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, status, retry } = useApiResource(async () => {
    if (!slug) throw new Error('Missing tour slug');
    const tour = await toursApi.getTourBySlug(slug);
    const [departures, destination] = await Promise.all([
      toursApi.listDepartures(tour.id),
      destinationsApi.getDestination(tour.destinationId).catch(() => null),
    ]);
    return { tour, departures, destination };
  });

  if (status === 'loading') {
    return (
      <div className="space-y-3 p-5">
        <div className="h-48 animate-pulse rounded-card bg-neutral-100 dark:bg-neutral-900" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
      </div>
    );
  }

  if (status === 'error' || !data) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Couldn't load this tour.</p>
        <button
          type="button"
          onClick={retry}
          className="flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-500"
        >
          <RefreshCw className="size-4" /> Retry
        </button>
      </div>
    );
  }

  const { tour, departures, destination } = data;

  return (
    <div>
      <div className="relative flex h-56 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-neutral-800 dark:to-neutral-950">
        {tour.heroImageUrl ? (
          <img src={tour.heroImageUrl} alt={tour.title} className="size-full object-cover" />
        ) : (
          <MapPin className="size-12" />
        )}
        <Link
          to={ROUTES.explore}
          className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow"
        >
          <ChevronLeft className="size-5" />
        </Link>
      </div>

      <div className="px-5 py-5">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">{tour.title}</h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
          {destination && (
            <span className="flex items-center gap-1">
              <MapPin className="size-4" /> {destination.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="size-4 fill-accent-500 text-accent-500" />
            {tour.ratingCount > 0 ? `${tour.ratingAvg.toFixed(1)} (${tour.ratingCount})` : 'New'}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          {tour.description}
        </p>

        <div className="mt-5 flex items-center justify-between rounded-card border border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatDuration(tour.durationMinutes)} · per person
          </span>
          <span className="text-lg font-bold text-ink-900 dark:text-white">
            {formatMoney(tour.priceMinor, tour.currency)}
          </span>
        </div>

        <h2 className="mb-3 mt-6 text-lg font-bold text-ink-900 dark:text-white">
          Upcoming Departures
        </h2>
        {departures.length === 0 ? (
          <p className="text-sm text-neutral-400">No departures scheduled yet.</p>
        ) : (
          <div className="space-y-2">
            {departures.map((departure) => (
              <div
                key={departure.id}
                className="flex items-center justify-between rounded-card border border-neutral-100 px-4 py-3 dark:border-neutral-800"
              >
                <div>
                  <div className="font-medium text-ink-900 dark:text-white">
                    {formatDate(departure.departsAt)}
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {formatTime(departure.departsAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  <Users className="size-4" /> {departure.seatsLeft} left
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
