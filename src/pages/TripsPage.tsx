import { Compass, Eye, RefreshCw, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { bookingsApi, toursApi, type Booking, type BookingStatus } from '@/lib/api';
import { useApiResource } from '@/hooks/useApiResource';
import { Skeleton, SkeletonChip, SkeletonLine, SkeletonRegion } from '@/components/ui/Skeleton';
import { formatDate, formatMoney, formatTime } from '@/lib/format';
import { ROUTES } from '@/lib/routes';

// "My Trips" — matches a captured Figma screen titled "My Bookings", whose
// bottom nav highlights "My Trips" as the active tab (confirmed with the
// user: this screen IS /trips, not a separate /bookings screen — see
// docs/DEVELOPMENT_LOG.md). Real data: GET /bookings/me.
//
// The live API only has one bookable entity (Tours), so every booking here
// is a tour booking — unlike Figma's mock (hotel/flight/local-transport
// variety with per-type accent colors), there's no real data for those
// other types, so every card uses the same accent/icon rather than
// fabricating categories. Tour titles aren't included in the booking
// response (only departureId), so this cross-references every tour's
// departures to resolve a departureId -> title map — fine at the current
// tiny seed-data scale, would need a real join if the catalogue grows.
//
// Figma shows a third "download" icon action per card; omitted here since
// there's no receipt/ticket endpoint to back it — unlike Cancel, which is
// wired to the real POST /bookings/{reference}/cancel.
const tabs = ['Upcoming', 'Completed', 'Cancelled'] as const;
type Tab = (typeof tabs)[number];

function matchesTab(booking: Booking, tab: Tab): boolean {
  if (tab === 'Upcoming') return booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  if (tab === 'Completed') return booking.status === 'COMPLETED';
  return booking.status === 'CANCELLED';
}

const statusStyles: Record<BookingStatus, string> = {
  CONFIRMED: 'bg-brand-50 text-brand-600 dark:bg-brand-700/20 dark:text-brand-500',
  COMPLETED: 'bg-brand-50 text-brand-600 dark:bg-brand-700/20 dark:text-brand-500',
  PENDING: 'bg-accent-500/10 text-accent-500',
  CANCELLED: 'bg-danger-500/10 text-danger-500',
};

function statusLabel(status: BookingStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function TripsPage() {
  const [tab, setTab] = useState<Tab>('Upcoming');
  const [cancellingRef, setCancellingRef] = useState<string | null>(null);

  const { data, status, retry } = useApiResource(() =>
    bookingsApi.listMyBookings$().pipe(
      switchMap((bookingsPage) =>
        toursApi.listTours$({ limit: 50 }).pipe(
          switchMap((toursPage) =>
            toursPage.results.length === 0
              ? of({ bookings: bookingsPage.results, titleByDepartureId: new Map<string, string>() })
              : forkJoin(
                  toursPage.results.map((tour) =>
                    toursApi
                      .listDepartures$(tour.id)
                      .pipe(map((departures) => departures.map((d) => [d.id, tour.title] as const))),
                  ),
                ).pipe(
                  map((pairsPerTour) => ({
                    bookings: bookingsPage.results,
                    titleByDepartureId: new Map(pairsPerTour.flat()),
                  })),
                ),
          ),
        ),
      ),
    ),
  );

  const filtered = useMemo(
    () => data?.bookings.filter((b) => matchesTab(b, tab)) ?? [],
    [data, tab],
  );

  function handleCancel(reference: string) {
    setCancellingRef(reference);
    bookingsApi.cancelBooking$(reference).subscribe({
      next: retry,
      error: () => setCancellingRef(null),
      complete: () => setCancellingRef(null),
    });
  }

  return (
    <div className="md:px-8">
      <header className="px-5 pt-6 pb-4 md:px-0 md:pt-10">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white md:text-3xl">My Bookings</h1>
      </header>

      <div className="flex gap-2 px-5 pb-4 md:px-0">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === t
                ? 'bg-brand-600 text-white'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {status === 'error' && (
        <div className="mx-5 flex items-center justify-between rounded-card border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 md:mx-0">
          <span>Couldn't load your bookings.</span>
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-1 font-medium text-brand-600 dark:text-brand-500"
          >
            <RefreshCw className="size-4" /> Retry
          </button>
        </div>
      )}

      {/* Mirrors the real booking card exactly: accent edge, icon tile,
          title, status badge, three meta lines, and the divided action
          footer — so cards swap in without the list jumping. */}
      {status === 'loading' && (
        <SkeletonRegion
          label="Loading your bookings"
          className="space-y-3 px-5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 md:px-0 lg:grid-cols-3"
        >
          {Array.from({ length: 2 }, (_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-card border-l-4 border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-xl" />
                    <SkeletonLine className="mt-1 w-2/3" />
                  </div>
                  <SkeletonChip className="w-20 shrink-0" />
                </div>
                <div className="mt-3 space-y-2">
                  <SkeletonLine className="w-1/2" />
                  <SkeletonLine className="w-2/5" />
                  <SkeletonLine className="h-3 w-1/3" />
                </div>
              </div>
              <div className="flex divide-x divide-neutral-100 border-t border-neutral-100 dark:divide-neutral-800 dark:border-neutral-800">
                <div className="flex flex-1 items-center justify-center py-3">
                  <SkeletonLine className="w-14" />
                </div>
                <div className="flex flex-1 items-center justify-center py-3">
                  <SkeletonLine className="w-14" />
                </div>
              </div>
            </div>
          ))}
        </SkeletonRegion>
      )}

      {status === 'ready' && filtered.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-neutral-400 md:px-0">
          No {tab.toLowerCase()} bookings.
        </p>
      )}

      {status === 'ready' && filtered.length > 0 && (
        <div className="space-y-3 px-5 pb-4 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 md:px-0 lg:grid-cols-3">
          {filtered.map((booking) => {
            const title = data?.titleByDepartureId.get(booking.departureId) ?? 'Tour booking';
            const cancellable = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
            return (
              <div
                key={booking.reference}
                className="overflow-hidden rounded-card border-l-4 border-brand-500 bg-white shadow-sm dark:bg-neutral-900"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-700/20">
                        <Compass className="size-5" />
                      </div>
                      <div className="font-bold text-ink-900 dark:text-white">{title}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[booking.status]}`}
                    >
                      {statusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                    {formatDate(booking.createdAt)} · {formatTime(booking.createdAt)}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {booking.seats} {booking.seats === 1 ? 'seat' : 'seats'} ·{' '}
                    {formatMoney(booking.totalMinor, booking.currency)}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">Ref: {booking.reference}</div>
                </div>

                <div className="flex divide-x divide-neutral-100 border-t border-neutral-100 dark:divide-neutral-800 dark:border-neutral-800">
                  <Link
                    to={`${ROUTES.bookings}/${booking.reference}`}
                    className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium text-brand-600 dark:text-brand-500"
                  >
                    <Eye className="size-4" /> View
                  </Link>
                  {cancellable && (
                    <button
                      type="button"
                      onClick={() => handleCancel(booking.reference)}
                      disabled={cancellingRef === booking.reference}
                      className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium text-danger-500 disabled:opacity-50"
                    >
                      <X className="size-4" />
                      {cancellingRef === booking.reference ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
