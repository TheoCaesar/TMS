import { Clock, MapPin, Navigation } from 'lucide-react';
import { useState } from 'react';

// Module M5 — Local Transport (SRS 3.6, FR-TRANS-01 to 12). No backend
// endpoint exists for this module (see docs/DEVELOPMENT_LOG.md) — this is
// UI only, matching the Figma screen, with no mock ride/fare data.
const vehicleTypes = ['Taxi', 'Car Hire', 'Shuttle', 'Bus'] as const;
type VehicleType = (typeof vehicleTypes)[number];

export function TransportBookingPage() {
  const [vehicleType, setVehicleType] = useState<VehicleType>('Taxi');
  const [when, setWhen] = useState<'now' | 'schedule'>('now');

  return (
    <div className="md:mx-auto md:max-w-xl">
      <header className="px-5 pt-6 pb-4 md:pt-10">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Local Transport</h1>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 pb-4">
        {vehicleTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setVehicleType(type)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
              vehicleType === type
                ? 'bg-brand-600 text-white'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="mx-5 rounded-card border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Pickup Location
        </label>
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
          <MapPin className="size-5 text-brand-600" />
          <input
            type="text"
            placeholder="Current location"
            className="w-full bg-transparent text-sm text-ink-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
          />
        </div>
        <button
          type="button"
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-500"
        >
          <Navigation className="size-4" /> Use my location
        </button>

        <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Destination
        </label>
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
          <MapPin className="size-5 text-accent-500" />
          <input
            type="text"
            placeholder="Where are you going?"
            className="w-full bg-transparent text-sm text-ink-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
          />
        </div>

        <label className="mb-2 block text-sm font-medium text-neutral-500 dark:text-neutral-400">
          When
        </label>
        <div className="flex gap-3">
          {(['now', 'schedule'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setWhen(option)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold capitalize transition ${
                when === option
                  ? 'bg-brand-600 text-white'
                  : 'border border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400'
              }`}
            >
              <Clock className="size-4" /> {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
