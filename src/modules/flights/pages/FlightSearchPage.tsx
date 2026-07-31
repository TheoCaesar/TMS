import { ArrowLeftRight, Calendar, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, flightsApi, type Airport, type CabinClass, type TripType } from '@/lib/api';
import { ROUTES } from '@/lib/routes';

// Module M2 — Flight Booking (SRS 3.3, FR-FLT-01 to 12). Real data via
// POST /flights/search (was fully static). Popular Routes stays the
// design's own static content — there's no "popular routes" endpoint —
// but tapping one now fills in real, valid airport codes rather than
// doing nothing.
const tripTypeOptions: { value: TripType; label: string }[] = [
  { value: 'ONE_WAY', label: 'One-way' },
  { value: 'RETURN', label: 'Return' },
  { value: 'MULTI_CITY', label: 'Multi-city' },
];

const cabinOptions: { value: CabinClass; label: string }[] = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'PREMIUM_ECONOMY', label: 'Premium Economy' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FIRST', label: 'First' },
];

// Real airports (verified against GET /flights/airports), so tapping one
// fills in a genuinely valid From/To rather than a made-up placeholder.
const accra: Airport = { code: 'ACC', name: 'Kotoka International', city: 'Accra', country: 'Ghana' };
const popularRoutes: { route: string; from: string; origin: Airport; destination: Airport }[] = [
  {
    route: 'Accra ⇄ Lagos',
    from: 'GHS 850',
    origin: accra,
    destination: { code: 'LOS', name: 'Murtala Muhammed', city: 'Lagos', country: 'Nigeria' },
  },
  {
    route: 'Accra ⇄ London',
    from: 'GHS 4,200',
    origin: accra,
    destination: { code: 'LHR', name: 'Heathrow', city: 'London', country: 'United Kingdom' },
  },
];

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function toIsoMidnight(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}
const defaultDate = toDateInputValue(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

interface AirportFieldProps {
  label: string;
  placeholder: string;
  value: Airport | null;
  onChange: (airport: Airport) => void;
  iconClassName: string;
}

// Debounced airport search-as-you-type — GET /flights/airports requires a
// non-empty `q`, so nothing fires until the user has typed something.
function AirportField({ label, placeholder, value, onChange, iconClassName }: AirportFieldProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(() => {
      flightsApi.searchAirports$(q).subscribe({
        next: setResults,
        error: () => setResults([]),
      });
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
        <MapPin className={`size-5 ${iconClassName}`} />
        <input
          type="text"
          value={open ? query : (value ? `${value.city} (${value.code})` : '')}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery('');
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-ink-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {results.map((airport) => (
            <button
              key={airport.code}
              type="button"
              onClick={() => {
                onChange(airport);
                setOpen(false);
                setQuery('');
              }}
              className="flex w-full flex-col items-start px-4 py-2.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <span className="text-sm font-medium text-ink-900 dark:text-white">
                {airport.city} ({airport.code})
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {airport.name}, {airport.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FlightSearchPage() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState<TripType>('RETURN');
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [departDate, setDepartDate] = useState(defaultDate);
  const [returnDate, setReturnDate] = useState(defaultDate);
  const [adults, setAdults] = useState(1);
  const [cabin, setCabin] = useState<CabinClass>('ECONOMY');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  function handleSwap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function handleSearch() {
    if (!origin || !destination) {
      setSearchError('Choose where you are flying from and to.');
      return;
    }
    setSearching(true);
    setSearchError(null);
    flightsApi
      .searchFlights$({
        tripType,
        origin: origin.code,
        destination: destination.code,
        date: toIsoMidnight(departDate),
        passengers: { adults },
        cabin,
      })
      .subscribe({
        next: (result) => {
          setSearching(false);
          navigate(ROUTES.flightResults, {
            state: {
              result,
              query: {
                originCode: origin.code,
                originLabel: `${origin.city} (${origin.code})`,
                destinationCode: destination.code,
                destinationLabel: `${destination.city} (${destination.code})`,
                departDate,
                returnDate: tripType === 'RETURN' ? returnDate : undefined,
                adults,
                cabin,
                tripType,
              },
            },
          });
        },
        error: (err: unknown) => {
          setSearching(false);
          setSearchError(err instanceof ApiError ? err.message : 'Could not search flights.');
        },
      });
  }

  return (
    <div className="md:mx-auto md:max-w-xl">
      <header className="px-5 pt-6 pb-4 md:pt-10">
        <div className="flex gap-1 rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
          {tripTypeOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTripType(value)}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                tripType === value
                  ? 'bg-brand-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-5 rounded-card border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <AirportField
          label="From"
          placeholder="Accra (ACC)"
          value={origin}
          onChange={setOrigin}
          iconClassName="text-brand-600"
        />

        <div className="relative my-2 flex justify-center">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Swap origin and destination"
            className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700"
          >
            <ArrowLeftRight className="size-4" />
          </button>
        </div>

        <div className="mb-5">
          <AirportField
            label="To"
            placeholder="Lagos (LOS)"
            value={destination}
            onChange={setDestination}
            iconClassName="text-accent-500"
          />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Departure
            </label>
            <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
              <Calendar className="size-4 text-neutral-400" />
              <input
                type="date"
                value={departDate}
                min={toDateInputValue(new Date())}
                onChange={(e) => setDepartDate(e.target.value)}
                className="w-full bg-transparent text-sm text-ink-900 focus:outline-none dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Return
            </label>
            <div
              className={`flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800 ${tripType !== 'RETURN' ? 'opacity-50' : ''}`}
            >
              <Calendar className="size-4 text-neutral-400" />
              <input
                type="date"
                value={returnDate}
                min={departDate}
                disabled={tripType !== 'RETURN'}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-transparent text-sm text-ink-900 focus:outline-none disabled:cursor-not-allowed dark:text-white"
              />
            </div>
          </div>
        </div>

        <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Passengers
        </label>
        <div className="mb-5 flex items-center justify-between rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
          <span className="flex items-center gap-2 text-sm text-ink-900 dark:text-white">
            <Users className="size-4 text-neutral-400" /> {adults} {adults === 1 ? 'Adult' : 'Adults'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAdults((a) => Math.max(1, a - 1))}
              disabled={adults <= 1}
              className="flex size-7 items-center justify-center rounded-full bg-white text-ink-900 disabled:opacity-40 dark:bg-neutral-700 dark:text-white"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setAdults((a) => Math.min(9, a + 1))}
              className="flex size-7 items-center justify-center rounded-full bg-white text-ink-900 dark:bg-neutral-700 dark:text-white"
            >
              +
            </button>
          </div>
        </div>

        <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Cabin Class
        </label>
        <select
          value={cabin}
          onChange={(e) => setCabin(e.target.value as CabinClass)}
          className="w-full rounded-xl bg-neutral-100 px-4 py-3 text-sm font-medium text-ink-900 focus:outline-none dark:bg-neutral-800 dark:text-white"
        >
          {cabinOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {searchError && <p className="mx-5 mt-3 text-sm text-danger-500">{searchError}</p>}

      <div className="px-5 pt-5">
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="block w-full rounded-xl bg-brand-600 py-3.5 text-center text-base font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {searching ? 'Searching…' : 'Search Flights'}
        </button>
      </div>

      <section className="px-5 py-6">
        <h2 className="mb-3 text-lg font-bold text-ink-900 dark:text-white">Popular Routes</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {popularRoutes.map(({ route, from, origin: o, destination: d }) => (
            <button
              key={route}
              type="button"
              onClick={() => {
                setOrigin(o);
                setDestination(d);
              }}
              className="shrink-0 rounded-card border border-neutral-100 bg-white px-4 py-3 text-left shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="whitespace-nowrap font-semibold text-ink-900 dark:text-white">
                {route}
              </div>
              <div className="mt-1 text-sm font-semibold text-brand-600 dark:text-brand-500">
                from {from}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
