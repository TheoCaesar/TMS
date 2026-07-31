import { ArrowLeftRight, Calendar, ChevronDown, Users } from 'lucide-react';
import { useState } from 'react';

// Module M2 — Flight Booking (SRS 3.3, FR-FLT-01 to 12). No backend
// endpoint exists for this module (see docs/HANDOFF.md) — this is UI
// only, matching a user-supplied Figma screenshot, with no mock
// flight/fare data beyond the design's own static "Popular Routes" copy.
const tripTypes = ['One-way', 'Return', 'Multi-city'] as const;
type TripType = (typeof tripTypes)[number];

const popularRoutes = [
  { route: 'Accra ⇄ Lagos', from: 'GHS 850' },
  { route: 'Accra ⇄ London', from: 'GHS 4,200' },
];

export function FlightSearchPage() {
  const [tripType, setTripType] = useState<TripType>('Return');

  return (
    <div className="md:mx-auto md:max-w-xl">
      <header className="px-5 pt-6 pb-4 md:pt-10">
        <div className="flex gap-1 rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
          {tripTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTripType(type)}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                tripType === type
                  ? 'bg-brand-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-5 rounded-card border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
          From
        </label>
        <input
          type="text"
          placeholder="Accra (ACC)"
          className="w-full rounded-xl bg-neutral-100 px-4 py-3 text-sm text-ink-900 placeholder:text-neutral-400 focus:outline-none dark:bg-neutral-800 dark:text-white"
        />

        <div className="relative my-2 flex justify-center">
          <button
            type="button"
            aria-label="Swap origin and destination"
            className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700"
          >
            <ArrowLeftRight className="size-4" />
          </button>
        </div>

        <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
          To
        </label>
        <input
          type="text"
          placeholder="Lagos (LOS)"
          className="mb-5 w-full rounded-xl bg-neutral-100 px-4 py-3 text-sm text-ink-900 placeholder:text-neutral-400 focus:outline-none dark:bg-neutral-800 dark:text-white"
        />

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Departure
            </label>
            <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
              <Calendar className="size-4 text-neutral-400" />
              <span className="text-sm text-neutral-400">May 25</span>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Return
            </label>
            <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
              <Calendar className="size-4 text-neutral-400" />
              <span className="text-sm text-neutral-400">Jun 2</span>
            </div>
          </div>
        </div>

        <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Passengers
        </label>
        <button
          type="button"
          className="mb-5 flex w-full items-center justify-between rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800"
        >
          <span className="flex items-center gap-2 text-sm text-ink-900 dark:text-white">
            <Users className="size-4 text-neutral-400" /> 1 Adult
          </span>
          <ChevronDown className="size-4 text-neutral-400" />
        </button>

        <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Cabin Class
        </label>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800"
        >
          <span className="text-sm font-medium text-ink-900 dark:text-white">Economy</span>
          <ChevronDown className="size-4 text-neutral-400" />
        </button>
      </div>

      <div className="px-5 pt-5">
        <button
          type="button"
          className="w-full rounded-xl bg-brand-600 py-3.5 text-base font-semibold text-white transition hover:bg-brand-700"
        >
          Search Flights
        </button>
      </div>

      <section className="px-5 py-6">
        <h2 className="mb-3 text-lg font-bold text-ink-900 dark:text-white">Popular Routes</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {popularRoutes.map(({ route, from }) => (
            <div
              key={route}
              className="shrink-0 rounded-card border border-neutral-100 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="whitespace-nowrap font-semibold text-ink-900 dark:text-white">
                {route}
              </div>
              <div className="mt-1 text-sm font-semibold text-brand-600 dark:text-brand-500">
                from {from}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
