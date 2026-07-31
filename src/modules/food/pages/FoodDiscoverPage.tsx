import { Award, Leaf, Map, MapPin, Search, Star, Utensils } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { restaurants } from '@/modules/food/data';
import { ROUTES } from '@/lib/routes';

// Module M4 — Food & Drinks (SRS 3.5, FR-FOOD-01 to 11). UI only,
// matching a user-supplied Figma screenshot ("food") — see data.ts.
const priceRanges = ['GHS 0-50', 'GHS 50-150', 'GHS 150+'] as const;
const cuisines = ['All', 'Ghanaian', 'Continental', 'Chinese'] as const;
type Cuisine = (typeof cuisines)[number];

const dietaryOptions = [
  { icon: Leaf, label: 'Vegetarian' },
  { icon: Leaf, label: 'Vegan' },
  { icon: Award, label: 'Halal Certified' },
  { icon: Award, label: 'Award Winning' },
];

export function FoodDiscoverPage() {
  const [cuisine, setCuisine] = useState<Cuisine>('All');
  const [priceRange, setPriceRange] = useState<string | null>(null);

  const filtered = useMemo(
    () => (cuisine === 'All' ? restaurants : restaurants.filter((r) => r.cuisine === cuisine)),
    [cuisine],
  );

  return (
    <div className="md:mx-auto md:max-w-5xl md:px-6 lg:px-8">
      <header className="px-5 pt-6 pb-4 md:pt-10">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Food &amp; Drinks</h1>
      </header>

      <div className="px-5">
        <div className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <Search className="size-5" />
          <input
            type="text"
            placeholder="Search restaurants, cuisines..."
            className="w-full bg-transparent text-sm text-ink-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
          />
        </div>
      </div>

      <section className="px-5 pt-5">
        <h2 className="mb-2 text-sm font-semibold text-ink-900 dark:text-white">Price Range</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {priceRanges.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setPriceRange((r) => (r === range ? null : range))}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                priceRange === range
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 pt-5">
        <h2 className="mb-2 text-sm font-semibold text-ink-900 dark:text-white">Cuisine</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cuisines.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCuisine(c)}
              className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
                cuisine === c
                  ? 'bg-brand-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 pt-5">
        <h2 className="mb-2 text-sm font-semibold text-ink-900 dark:text-white">
          Dietary Options
        </h2>
        <div className="flex gap-3">
          {dietaryOptions.map(({ icon: Icon, label }, i) => (
            <button
              key={i}
              type="button"
              aria-label={label}
              className="flex size-11 items-center justify-center rounded-full border border-neutral-200 text-brand-600 dark:border-neutral-700"
            >
              <Icon className="size-5" />
            </button>
          ))}
        </div>
      </section>

      <div className="px-5 pt-5">
        <button
          type="button"
          className="flex w-full flex-col items-center justify-center gap-2 rounded-card bg-neutral-100 py-8 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
        >
          <Map className="size-7 text-brand-600" />
          <span className="text-sm font-medium">View on Map</span>
        </button>
      </div>

      <section className="px-5 py-6">
        <h2 className="mb-3 text-lg font-bold text-ink-900 dark:text-white">Nearby Restaurants</h2>
        <div className="flex flex-col gap-3">
          {filtered.map((restaurant) => (
            <Link
              key={restaurant.slug}
              to={`${ROUTES.food}/${restaurant.slug}`}
              className="flex gap-3 rounded-card border border-neutral-100 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-neutral-800 dark:to-neutral-950">
                <Utensils className="size-8" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-ink-900 dark:text-white">
                      {restaurant.name}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {restaurant.cuisine}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white">
                    Reserve
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <span>{restaurant.priceTier}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {restaurant.distanceKm} km
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm font-medium text-ink-900 dark:text-white">
                  <Star className="size-4 fill-accent-500 text-accent-500" /> {restaurant.rating}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
