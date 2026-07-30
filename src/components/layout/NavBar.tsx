import { NavLink } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const links = [
  { to: ROUTES.poi, label: 'Explore' },
  { to: ROUTES.flights, label: 'Flights' },
  { to: ROUTES.accommodation, label: 'Stays' },
  { to: ROUTES.food, label: 'Food' },
  { to: ROUTES.transport, label: 'Transport' },
];

export function NavBar() {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <NavLink to={ROUTES.home} className="font-semibold text-neutral-900 dark:text-neutral-100">
          TMS
        </NavLink>
        <nav className="hidden gap-6 text-sm sm:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                isActive
                  ? 'text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <NavLink
          to={ROUTES.emergency}
          className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Emergency
        </NavLink>
      </div>
    </header>
  );
}
