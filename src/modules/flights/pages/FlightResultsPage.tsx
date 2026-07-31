import { ArrowLeft, ArrowRight, Briefcase, Plane, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ApiError,
  flightsApi,
  type CabinClass,
  type FlightOffer,
  type FlightSearchResult,
  type TripType,
} from '@/lib/api';
import { formatMoney, formatTime } from '@/lib/format';
import { ROUTES } from '@/lib/routes';

// Module M2 — Flight Booking (SRS 3.3, FR-FLT-01 to 12). Real data via
// POST /flights/search (was fully static). No GET-by-searchId endpoint
// exists, so the previous screen hands the result over via router state
// rather than this page re-fetching by an ID — reloading this page
// directly (no state) shows an honest "search again" prompt instead of
// resurrecting stale/expired offers.
interface SearchQuery {
  originCode: string;
  originLabel: string;
  destinationCode: string;
  destinationLabel: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  cabin: CabinClass;
  tripType: TripType;
}

const sortOptions = [
  { value: 'price', label: 'Price: Low to High' },
  { value: 'departsAt', label: 'Departure Time' },
];

function OfferCard({
  offer,
  onSelect,
  selecting,
}: {
  offer: FlightOffer;
  onSelect: () => void;
  selecting: boolean;
}) {
  const segment = offer.segments[0];
  return (
    <div className="rounded-card border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-500">
          <Plane className="size-5" />
        </span>
        <span className="font-semibold text-ink-900 dark:text-white">{offer.airline.name}</span>
      </div>

      {segment && (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-ink-900 dark:text-white">
              {formatTime(segment.departsAt)}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">{segment.origin}</div>
          </div>
          <div className="flex flex-1 flex-col items-center px-3">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {Math.floor(segment.durationMinutes / 60)}h {segment.durationMinutes % 60}m
            </span>
            <div className="my-1 flex w-full items-center gap-1 text-neutral-300 dark:text-neutral-500">
              <span className="h-0.5 flex-1 rounded-full bg-current" />
              <ArrowRight className="size-3.5 shrink-0" />
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {offer.stops === 0 ? 'Direct' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-ink-900 dark:text-white">
              {formatTime(segment.arrivesAt)}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">{segment.destination}</div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {offer.baggageKg && (
          <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            <Briefcase className="size-3.5" /> {offer.baggageKg}kg baggage
          </span>
        )}
        {offer.refundable && (
          <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            <RefreshCw className="size-3.5" /> Refundable
          </span>
        )}
        {offer.amenities.map((label) => (
          <span
            key={label}
            className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <div>
          <div className="text-lg font-bold text-brand-600 dark:text-brand-500">
            {formatMoney(offer.totalMinor, offer.currency)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">per person</div>
        </div>
        <button
          type="button"
          onClick={onSelect}
          disabled={selecting}
          className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {selecting ? 'Booking…' : 'Select'}
        </button>
      </div>
    </div>
  );
}

export function FlightResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { result: FlightSearchResult; query: SearchQuery } | undefined;

  const [result, setResult] = useState(state?.result);
  const [sort, setSort] = useState<string | null>(null);
  const [resorting, setResorting] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);

  function handleSort(value: string) {
    if (!state) return;
    setSort((s) => (s === value ? null : value));
    setResorting(true);
    const { query } = state;
    flightsApi
      .searchFlights$({
        tripType: query.tripType,
        origin: query.originCode,
        destination: query.destinationCode,
        date: `${query.departDate}T00:00:00.000Z`,
        passengers: { adults: query.adults },
        cabin: query.cabin,
        sort: sort === value ? undefined : value,
      })
      .subscribe({
        next: (r) => {
          setResult(r);
          setResorting(false);
        },
        error: () => setResorting(false),
      });
  }

  function handleSelect(offerId: string) {
    setSelectingId(offerId);
    setSelectError(null);
    flightsApi.bookFlightOffer$(offerId).subscribe({
      next: (reservation) => navigate(`${ROUTES.reservations}/${reservation.reference}`),
      error: (err: unknown) => {
        setSelectError(err instanceof ApiError ? err.message : 'Could not book this flight.');
        setSelectingId(null);
      },
    });
  }

  if (!state) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No search results to show — flight offers are time-limited and aren't saved.
        </p>
        <Link to={ROUTES.flights} className="text-sm font-medium text-brand-600 dark:text-brand-500">
          Search again
        </Link>
      </div>
    );
  }

  const { query } = state;

  return (
    <div className="md:mx-auto md:max-w-xl">
      <header className="flex items-center gap-4 px-5 pt-6 pb-4 md:pt-10">
        <Link
          to={ROUTES.flights}
          aria-label="Back to search"
          className="text-ink-900 dark:text-white"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">
            {query.originLabel} → {query.destinationLabel}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {query.departDate} · {query.adults} {query.adults === 1 ? 'Adult' : 'Adults'} ·{' '}
            {query.cabin.charAt(0) + query.cabin.slice(1).toLowerCase().replace('_', ' ')}
          </p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 pb-4">
        {sortOptions.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleSort(value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              sort === value
                ? 'bg-brand-600 text-white'
                : 'border border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {selectError && <p className="mx-5 mb-3 text-sm text-danger-500">{selectError}</p>}

      {resorting ? (
        <div className="flex flex-col gap-4 px-5 pb-6">
          {Array.from({ length: 2 }, (_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-card bg-neutral-100 dark:bg-neutral-900"
            />
          ))}
        </div>
      ) : result && result.offers.length > 0 ? (
        <div className="flex flex-col gap-4 px-5 pb-6">
          {result.offers.map((offer) => (
            <OfferCard
              key={offer.offerId}
              offer={offer}
              onSelect={() => handleSelect(offer.offerId)}
              selecting={selectingId === offer.offerId}
            />
          ))}
        </div>
      ) : (
        <p className="mx-5 rounded-card border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-400 dark:border-neutral-800">
          No flights found for that route and date.
        </p>
      )}
    </div>
  );
}
