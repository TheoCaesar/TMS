import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const modules = [
  { to: ROUTES.poi, label: 'Explore', desc: 'Places of Interest' },
  { to: ROUTES.flights, label: 'Flights', desc: 'Search & book flights' },
  { to: ROUTES.accommodation, label: 'Stays', desc: 'Hotels, villas, hostels' },
  { to: ROUTES.food, label: 'Food & Drinks', desc: 'Restaurants & reservations' },
  { to: ROUTES.transport, label: 'Local Transport', desc: 'Taxis, rentals, shuttles' },
  { to: ROUTES.emergency, label: 'Emergency', desc: 'SOS & nearest medical help' },
];

export function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-semibold text-neutral-900 dark:text-neutral-100">
        Tourism Management System
      </h1>
      <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-400">
        A complete travel companion — plan, book, and stay safe, all in one place.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
          >
            <div className="font-medium text-neutral-900 dark:text-neutral-100">{m.label}</div>
            <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{m.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
