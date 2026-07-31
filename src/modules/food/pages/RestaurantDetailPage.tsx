import { ChevronLeft, Heart, Star, Utensils } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { restaurants } from '@/modules/food/data';
import { ROUTES } from '@/lib/routes';

// Restaurant detail — reached from FoodDiscoverPage. UI only, matching a
// user-supplied Figma screenshot ("food-detail") for Asanka Local
// specifically; see data.ts for which restaurants have a menu vs. an
// honest empty state.
const tabs = ['Menu', 'Reserve', 'Reviews', 'Info'] as const;
type Tab = (typeof tabs)[number];

export function RestaurantDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const restaurant = restaurants.find((r) => r.slug === slug);
  const [favorite, setFavorite] = useState(false);
  const [tab, setTab] = useState<Tab>('Menu');

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Couldn't find this restaurant.
        </p>
        <Link to={ROUTES.food} className="text-sm font-medium text-brand-600 dark:text-brand-500">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-28 md:mx-auto md:max-w-2xl md:pb-0">
      <div className="relative flex h-72 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-neutral-800 dark:to-neutral-950 md:mt-6 md:h-80 md:rounded-card">
        <Utensils className="size-12" />
        <Link
          to={ROUTES.food}
          className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <button
          type="button"
          onClick={() => setFavorite((f) => !f)}
          aria-label="Save restaurant"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow"
        >
          <Heart className={`size-5 ${favorite ? 'fill-danger-500 text-danger-500' : ''}`} />
        </button>
      </div>

      <div className="px-5 py-5">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">{restaurant.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-500">
            {restaurant.cuisine}
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {restaurant.priceTier}
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-ink-900 dark:text-white">
            <Star className="size-4 fill-accent-500 text-accent-500" /> {restaurant.rating}
          </span>
          {restaurant.status && (
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                restaurant.status === 'Open'
                  ? 'bg-brand-600 text-white'
                  : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              {restaurant.status}
            </span>
          )}
        </div>

        <div className="mt-5 flex gap-1 rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                tab === t ? 'bg-brand-600 text-white' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Menu' ? (
          !restaurant.menu || restaurant.menu.length === 0 ? (
            <p className="mt-6 text-sm text-neutral-400">No menu available yet.</p>
          ) : (
            restaurant.menu.map((section) => (
              <div key={section.category} className="mt-6">
                <h2 className="mb-3 text-lg font-bold text-ink-900 dark:text-white">
                  {section.category}
                </h2>
                <div className="flex flex-col gap-3">
                  {section.items.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-card border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-ink-900 dark:text-white">
                          {item.name}
                        </span>
                        <span className="shrink-0 font-semibold text-brand-600 dark:text-brand-500">
                          {item.price}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )
        ) : (
          <p className="mt-6 text-sm text-neutral-400">This section isn't available yet.</p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[72px] mx-auto max-w-md px-5 py-3 md:sticky md:inset-x-auto md:bottom-0 md:max-w-none md:bg-white md:pb-5 md:dark:bg-neutral-950">
        <button
          type="button"
          className="w-full rounded-xl bg-brand-600 py-3.5 text-base font-semibold text-white transition hover:bg-brand-700"
        >
          Reserve a Table
        </button>
      </div>
    </div>
  );
}
