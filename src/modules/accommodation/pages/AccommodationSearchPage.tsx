import { Calendar, Hotel, Search, Star, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { amenityMeta, hotels } from '@/modules/accommodation/data';
import { ROUTES } from '@/lib/routes';

// Module M3 — Accommodation Booking (SRS 3.4, FR-ACC-01 to 12). UI only,
// matching a user-supplied Figma screenshot ("Hotel") — see data.ts.
const categories = ['All', 'Hotels', 'Villas', 'Hostels', 'Apartments'] as const;
type Category = (typeof categories)[number];

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

export function AccommodationSearchPage() {
  const [category, setCategory] = useState<Category>('All');

  return (
    <div className="md:mx-auto md:max-w-2xl">
      <header className="px-5 pt-6 pb-4 md:pt-10">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Find a Place to Stay</h1>
      </header>

      <div className="px-5">
        <div className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <Search className="size-5" />
          <input
            type="text"
            placeholder="Where are you going?"
            className="w-full bg-transparent text-sm text-ink-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 px-3 py-3 text-sm font-medium text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
          >
            <Calendar className="size-4" /> Check-in
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 px-3 py-3 text-sm font-medium text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
          >
            <Calendar className="size-4" /> Check-out
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 px-3 py-3 text-sm font-medium text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
          >
            <Users className="size-4" /> Guests
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 py-4">
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

      {category !== 'All' ? (
        <p className="px-5 py-6 text-center text-sm text-neutral-400">
          No {category.toLowerCase()} listed yet — check back soon.
        </p>
      ) : (
        <div className="flex flex-col gap-4 px-5 pb-6 md:grid md:grid-cols-2 md:gap-4">
          {hotels.map((hotel) => (
            <Link
              key={hotel.slug}
              to={`${ROUTES.hotels}/${hotel.slug}`}
              className="overflow-hidden rounded-card border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex h-44 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-neutral-800 dark:to-neutral-950">
                <Hotel className="size-10" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold text-ink-900 dark:text-white">{hotel.name}</h2>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-ink-900 dark:text-white">
                    <Star className="size-4 fill-accent-500 text-accent-500" /> {hotel.rating}
                  </span>
                </div>
                <div className="mt-1">
                  <StarRow count={hotel.stars} />
                </div>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  {hotel.location}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {hotel.amenities.map((key) => {
                    const { icon: Icon, short } = amenityMeta[key];
                    return (
                      <span
                        key={key}
                        className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"
                      >
                        <Icon className="size-3.5 text-brand-600" /> {short}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  <span>
                    <span className="text-lg font-bold text-brand-600 dark:text-brand-500">
                      {hotel.pricePerNight}
                    </span>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400"> / night</span>
                  </span>
                  <span className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
                    Book Now
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
