import { Briefcase, Calendar, Compass, Home as HomeIcon, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const tabs = [
  { to: ROUTES.home, label: 'Home', icon: HomeIcon, end: true },
  { to: ROUTES.explore, label: 'Explore', icon: Compass },
  { to: ROUTES.trips, label: 'My Trips', icon: Briefcase },
  { to: ROUTES.bookings, label: 'Bookings', icon: Calendar },
  { to: ROUTES.profile, label: 'Profile', icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
              isActive
                ? 'text-brand-600 dark:text-brand-500'
                : 'text-neutral-400 dark:text-neutral-500'
            }`
          }
        >
          <Icon className="size-5" strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
