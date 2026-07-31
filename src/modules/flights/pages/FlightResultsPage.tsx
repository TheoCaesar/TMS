import { ArrowLeft, ArrowRight, Briefcase, Plane, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

// Module M2 — Flight Booking (SRS 3.3, FR-FLT-01 to 12). No backend
// endpoint exists for this module (see docs/HANDOFF.md) — this is UI
// only, matching a user-supplied Figma screenshot ("Flight options").
// The results below are the design's own static content, not a real
// search response, so they don't change with the (also inert) search
// form's inputs.
type Amenity = { label: string; icon?: typeof Briefcase };

const flights: {
  airline: string;
  departTime: string;
  departCode: string;
  arriveTime: string;
  arriveCode: string;
  duration: string;
  stops: string;
  amenities: Amenity[];
  price: string;
}[] = [
  {
    airline: 'Africa World Airlines',
    departTime: '08:30',
    departCode: 'ACC',
    arriveTime: '10:45',
    arriveCode: 'LOS',
    duration: '2h 15m',
    stops: 'Direct',
    amenities: [
      { label: '20kg baggage', icon: Briefcase },
      { label: 'Refundable', icon: RefreshCw },
    ],
    price: 'GHS 850',
  },
  {
    airline: 'Air Peace',
    departTime: '11:15',
    departCode: 'ACC',
    arriveTime: '13:35',
    arriveCode: 'LOS',
    duration: '2h 20m',
    stops: 'Direct',
    amenities: [{ label: '25kg baggage', icon: Briefcase }, { label: 'Meal Included' }],
    price: 'GHS 920',
  },
  {
    airline: 'Kenya Airways',
    departTime: '14:00',
    departCode: 'ACC',
    arriveTime: '16:20',
    arriveCode: 'LOS',
    duration: '2h 20m',
    stops: 'Direct',
    amenities: [
      { label: '30kg baggage', icon: Briefcase },
      { label: 'Refundable', icon: RefreshCw },
      { label: 'Priority boarding' },
    ],
    price: 'GHS 1,050',
  },
  {
    airline: 'ASKY Airlines',
    departTime: '17:45',
    departCode: 'ACC',
    arriveTime: '21:30',
    arriveCode: 'LOS',
    duration: '3h 45m',
    stops: '1 stop',
    amenities: [{ label: '20kg baggage', icon: Briefcase }],
    price: 'GHS 780',
  },
];

const filters = ['Filter', 'Price: Low to High', 'Departure Time'];

export function FlightResultsPage() {
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
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">Accra → Lagos</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            May 25 · 1 Adult · Economy
          </p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 pb-4">
        {filters.map((filter, i) => (
          <button
            key={filter}
            type="button"
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              i === 1
                ? 'bg-brand-600 text-white'
                : 'border border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400'
            }`}
          >
            {i === 0 ? <SlidersHorizontal className="size-4" /> : null}
            {filter}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 px-5 pb-6">
        {flights.map((flight) => (
          <div
            key={flight.airline}
            className="rounded-card border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-500">
                <Plane className="size-5" />
              </span>
              <span className="font-semibold text-ink-900 dark:text-white">{flight.airline}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-ink-900 dark:text-white">
                  {flight.departTime}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {flight.departCode}
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center px-3">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {flight.duration}
                </span>
                <div className="my-1 flex w-full items-center gap-1 text-neutral-300 dark:text-neutral-500">
                  <span className="h-0.5 flex-1 rounded-full bg-current" />
                  <ArrowRight className="size-3.5 shrink-0" />
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {flight.stops}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-ink-900 dark:text-white">
                  {flight.arriveTime}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {flight.arriveCode}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {flight.amenities.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                >
                  {Icon ? <Icon className="size-3.5" /> : null}
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <div>
                <div className="text-lg font-bold text-brand-600 dark:text-brand-500">
                  {flight.price}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">per person</div>
              </div>
              <button
                type="button"
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
