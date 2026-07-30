import { NavLink } from 'react-router-dom';
import { navTabs } from './navTabs';

// Mobile only (<md) — tablet/desktop use TopNav instead.
export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 md:hidden">
      {navTabs.map(({ to, label, icon: Icon, end }) => (
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
