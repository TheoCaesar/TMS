import { ChevronLeft, Minus, Plus, RefreshCw, MapPin, Star, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bookingsApi, destinationsApi, getTokens, toursApi, ApiError, type Departure } from '@/lib/api';
import { useApiResource } from '@/hooks/useApiResource';
import { formatDate, formatDuration, formatMoney, formatTime } from '@/lib/format';
import { ROUTES } from '@/lib/routes';

// Tour detail — reached from ExplorePage. Real data: GET /tours/{slug},
// GET /tours/{id}/departures, and the tour's destination for context.
// No Figma screen exists for booking a Tour (see docs/DEVELOPMENT_LOG.md)
// — this booking bar is designed consistent with the rest of the app.
export function TourDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null);
  const [seats, setSeats] = useState(1);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

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
  const maxSeats = Math.min(selectedDeparture?.seatsLeft ?? 1, 20);

  function selectDeparture(departure: Departure) {
    setSelectedDeparture(departure);
    setSeats(1);
    setBookingError(null);
  }

  async function handleBookNow() {
    if (!selectedDeparture) return;
    if (!getTokens()) {
      navigate(ROUTES.auth.login);
      return;
    }
    setBooking(true);
    setBookingError(null);
    try {
      const created = await bookingsApi.createBooking({
        departureId: selectedDeparture.id,
        seats,
      });
      navigate(`${ROUTES.bookings}/${created.reference}`);
    } catch (err) {
      setBookingError(err instanceof ApiError ? err.message : 'Could not create booking.');
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className={`md:mx-auto md:max-w-2xl ${selectedDeparture ? 'pb-24' : ''}`}>
      <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-neutral-800 dark:to-neutral-950 md:mt-6 md:h-72 md:rounded-card">
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
            {departures.map((departure) => {
              const isSelected = selectedDeparture?.id === departure.id;
              const isFull = departure.seatsLeft === 0;
              return (
                <button
                  key={departure.id}
                  type="button"
                  disabled={isFull}
                  onClick={() => selectDeparture(departure)}
                  className={`flex w-full items-center justify-between rounded-card border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-700/20'
                      : 'border-neutral-100 dark:border-neutral-800'
                  }`}
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
                    <Users className="size-4" /> {isFull ? 'Full' : `${departure.seatsLeft} left`}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedDeparture && (
          <div className="mt-5 flex items-center justify-between rounded-card border border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <span className="text-sm font-medium text-ink-900 dark:text-white">Seats</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSeats((s) => Math.max(1, s - 1))}
                disabled={seats <= 1}
                className="flex size-8 items-center justify-center rounded-full bg-neutral-100 disabled:opacity-40 dark:bg-neutral-800"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-4 text-center font-semibold text-ink-900 dark:text-white">
                {seats}
              </span>
              <button
                type="button"
                onClick={() => setSeats((s) => Math.min(maxSeats, s + 1))}
                disabled={seats >= maxSeats}
                className="flex size-8 items-center justify-center rounded-full bg-neutral-100 disabled:opacity-40 dark:bg-neutral-800"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        )}

        {bookingError && <p className="mt-3 text-sm text-danger-500">{bookingError}</p>}
      </div>

      {selectedDeparture && (
        <div className="fixed inset-x-0 bottom-[72px] mx-auto flex max-w-md items-center justify-between border-t border-neutral-100 bg-white py-3 pl-5 pr-20 dark:border-neutral-800 dark:bg-neutral-950 md:max-w-2xl md:bottom-0 md:pr-8">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Total</div>
            <div className="text-lg font-bold text-ink-900 dark:text-white">
              {formatMoney(tour.priceMinor * seats, tour.currency)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleBookNow}
            disabled={booking}
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {booking ? 'Booking…' : 'Book Now'}
          </button>
        </div>
      )}
    </div>
  );
}
