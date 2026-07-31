import { ChevronLeft, Heart, Hotel as HotelIcon, MapPin, Minus, Plus, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { forkJoin, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ApiError, getTokens, staysApi, type Room } from '@/lib/api';
import { useApiResource } from '@/hooks/useApiResource';
import { Skeleton, SkeletonLine, SkeletonRegion } from '@/components/ui/Skeleton';
import { getAmenityMeta } from '@/modules/accommodation/data';
import { formatMoney } from '@/lib/format';
import { ROUTES } from '@/lib/routes';

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

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function toIsoMidnight(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const inFourDays = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

// Hotel detail — reached from AccommodationSearchPage. Real data via
// GET /stays/:slug + GET /stays/:id/rooms (was static data.ts). No
// GET /stays/:id/reviews endpoint exists, so this shows the aggregate
// rating already on the Stay (real) rather than a fabricated review list.
export function AccommodationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [favorite, setFavorite] = useState(false);
  const [checkIn, setCheckIn] = useState(toDateInputValue(tomorrow));
  const [checkOut, setCheckOut] = useState(toDateInputValue(inFourDays));
  const [guests, setGuests] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const { data, status, retry } = useApiResource(() => {
    if (!slug) return throwError(() => new Error('Missing stay slug'));
    return staysApi.getStayBySlug$(slug).pipe(
      switchMap((stay) =>
        forkJoin({
          stay: of(stay),
          rooms: staysApi
            .listRooms$(stay.id, {
              checkIn: toIsoMidnight(checkIn),
              checkOut: toIsoMidnight(checkOut),
              guests,
            })
            .pipe(catchError(() => of([] as Room[]))),
        }),
      ),
    );
  });

  const { stay, rooms } = data ?? { stay: null, rooms: [] };

  // Re-fetch rooms (live rates/availability) whenever the dates or guest
  // count change, without refetching the stay itself.
  const retryRef = useRef(retry);
  retryRef.current = retry;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    retryRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, guests]);

  useEffect(() => {
    setSelectedRoomId(rooms[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms.map((r) => r.id).join(',')]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;
  const nights = Math.max(
    1,
    Math.round(
      (new Date(toIsoMidnight(checkOut)).getTime() - new Date(toIsoMidnight(checkIn)).getTime()) /
        86_400_000,
    ),
  );
  const displayTotalMinor = selectedRoom ? selectedRoom.pricePerNightMinor * nights : 0;

  function handleReserve() {
    if (!stay || !selectedRoom) return;
    if (!getTokens()) {
      navigate(ROUTES.auth.login);
      return;
    }
    setBooking(true);
    setBookingError(null);
    staysApi
      .bookStay$(stay.id, {
        roomId: selectedRoom.id,
        checkIn: toIsoMidnight(checkIn),
        checkOut: toIsoMidnight(checkOut),
        guests,
      })
      .subscribe({
        next: (reservation) => navigate(`${ROUTES.reservations}/${reservation.reference}`),
        error: (err: unknown) => {
          setBookingError(err instanceof ApiError ? err.message : 'Could not book this stay.');
          setBooking(false);
        },
      });
  }

  if (status === 'error' && !stay) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Couldn't load this stay.</p>
        <Link to={ROUTES.hotels} className="text-sm font-medium text-brand-600 dark:text-brand-500">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24 md:mx-auto md:max-w-2xl md:pb-0">
      <div className="relative flex h-72 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-neutral-800 dark:to-neutral-950 md:mt-6 md:h-80 md:rounded-card">
        {stay?.heroImageUrl ? (
          <img src={stay.heroImageUrl} alt="" className="size-full object-cover" />
        ) : (
          <HotelIcon className="size-12" />
        )}
        <Link
          to={ROUTES.hotels}
          className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <button
          type="button"
          onClick={() => setFavorite((f) => !f)}
          aria-label="Save hotel"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow"
        >
          <Heart className={`size-5 ${favorite ? 'fill-danger-500 text-danger-500' : ''}`} />
        </button>
      </div>

      <div className="px-5 py-5">
        {stay ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-ink-900 dark:text-white">{stay.name}</h1>
              {stay.ratingCount > 0 && (
                <span className="flex shrink-0 items-center gap-1 text-base font-semibold text-ink-900 dark:text-white">
                  <Star className="size-5 fill-accent-500 text-accent-500" /> {stay.ratingAvg.toFixed(1)}
                  <span className="text-sm font-normal text-neutral-400">({stay.ratingCount})</span>
                </span>
              )}
            </div>
            <div className="mt-1">
              <StarRow count={stay.stars} />
            </div>
            <p className="mt-2 flex items-center gap-1 text-sm text-brand-600 dark:text-brand-500">
              <MapPin className="size-4" /> {stay.location}
            </p>
            {stay.description && (
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                {stay.description}
              </p>
            )}

            <div className="mt-5 grid grid-cols-4 gap-2">
              {stay.amenities.map((key) => {
                const { icon: Icon, label } = getAmenityMeta(key);
                return (
                  <div key={key} className="flex flex-col items-center gap-2 text-center">
                    <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-500">
                      <Icon className="size-6" />
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <SkeletonRegion label="Loading hotel">
            <SkeletonLine boxClassName="h-8" className="w-2/3" />
            <SkeletonLine className="w-1/3" />
            <SkeletonLine className="mt-2 w-40" />
          </SkeletonRegion>
        )}

        <h2 className="mb-3 mt-6 text-lg font-bold text-ink-900 dark:text-white">Dates &amp; Guests</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-900 dark:text-white">
              Check-in
            </span>
            <input
              type="date"
              value={checkIn}
              min={toDateInputValue(new Date())}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-ink-900 focus:outline-none dark:bg-neutral-800 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-900 dark:text-white">
              Check-out
            </span>
            <input
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm text-ink-900 focus:outline-none dark:bg-neutral-800 dark:text-white"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-100 px-4 py-2.5 dark:bg-neutral-800">
          <span className="text-sm font-medium text-ink-900 dark:text-white">Guests</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              disabled={guests <= 1}
              className="flex size-7 items-center justify-center rounded-full bg-white disabled:opacity-40 dark:bg-neutral-700"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-4 text-center font-semibold text-ink-900 dark:text-white">{guests}</span>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(20, g + 1))}
              className="flex size-7 items-center justify-center rounded-full bg-white dark:bg-neutral-700"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <h2 className="mb-3 mt-6 text-lg font-bold text-ink-900 dark:text-white">Choose a Room</h2>
        {status === 'loading' ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-card" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <p className="text-sm text-neutral-400">No rooms available for those dates.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {rooms.map((room) => {
              const isSelected = selectedRoomId === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  disabled={!room.available}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`rounded-card border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-700/20'
                      : 'border-neutral-100 dark:border-neutral-800'
                  }`}
                >
                  <div className="font-semibold text-ink-900 dark:text-white">{room.name}</div>
                  <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    {room.maxGuests} Guests
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">{room.bed}</div>
                  <div className="mt-3 text-base font-bold text-brand-600 dark:text-brand-500">
                    {formatMoney(room.pricePerNightMinor, stay?.currency ?? 'GHS')}
                    <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
                      /night
                    </span>
                  </div>
                  {!room.available && (
                    <div className="mt-1 text-xs font-medium text-danger-500">Unavailable</div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {bookingError && <p className="mt-3 text-sm text-danger-500">{bookingError}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-[72px] mx-auto flex max-w-md items-center justify-between border-t border-neutral-100 bg-white py-3 pl-5 pr-20 dark:border-neutral-800 dark:bg-neutral-950 md:pr-8 md:sticky md:inset-x-auto md:bottom-0 md:max-w-none md:rounded-t-card md:border md:border-b-0 md:shadow-[0_-6px_20px_rgba(20,33,61,0.08)]">
        <div>
          <span className="text-lg font-bold text-brand-600 dark:text-brand-500">
            {stay ? formatMoney(displayTotalMinor, stay.currency) : '—'}
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400"> / {nights} nights</span>
        </div>
        <button
          type="button"
          onClick={handleReserve}
          disabled={booking || !selectedRoom}
          className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {booking ? 'Reserving…' : 'Reserve Now'}
        </button>
      </div>
    </div>
  );
}
