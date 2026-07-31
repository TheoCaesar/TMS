import {
  Bell,
  ChevronRight,
  CreditCard,
  HelpCircle,
  LogOut,
  MapPin,
  RefreshCw,
  Settings,
  User,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forkJoin } from 'rxjs';
import { authApi, getTokens, usersApi } from '@/lib/api';
import { useApiResource } from '@/hooks/useApiResource';
import { ROUTES } from '@/lib/routes';

// Built from a user-supplied screenshot of the settings menu ("profile-b");
// no screenshot exists for the header (avatar/name/loyalty), so that part
// is designed from the real data fields (GET /users/me + /users/me/loyalty)
// consistent with the rest of the app. Most menu rows have no backend at
// all (Travel Preferences, Payment Methods, Saved Places, Notifications,
// Emergency Contacts, Help & Support) — left non-interactive per the
// user's call, matching Figma visually without dead-end fake navigation.
// Personal Info is the one row with real backend support (PATCH
// /users/me), so it links to a real edit page.
interface MenuRow {
  label: string;
  icon: ComponentType<{ className?: string }>;
  to?: string;
  danger?: boolean;
}

const menuRows: MenuRow[] = [
  { label: 'Personal Info', icon: User, to: ROUTES.profilePersonalInfo },
  { label: 'Travel Preferences', icon: Settings },
  { label: 'Payment Methods', icon: CreditCard },
  { label: 'Saved Places', icon: MapPin },
  { label: 'Notifications', icon: Bell },
  { label: 'Emergency Contacts', icon: Users, danger: true },
  { label: 'Help & Support', icon: HelpCircle },
];

function LoggedOutPrompt() {
  return (
    <div className="flex flex-col items-center gap-4 px-5 py-16 text-center">
      <User className="size-12 text-neutral-300 dark:text-neutral-700" />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Log in to see your profile, bookings, and loyalty points.
      </p>
      <Link
        to={ROUTES.auth.login}
        className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white"
      >
        Log in
      </Link>
    </div>
  );
}

function ProfileContent() {
  const navigate = useNavigate();
  const { data, status, retry } = useApiResource(() =>
    forkJoin({ profile: usersApi.getMe$(), loyalty: usersApi.getMyLoyalty$() }),
  );

  function handleLogOut() {
    authApi.logout$().subscribe(() => navigate(ROUTES.home));
  }

  if (status === 'loading') {
    return (
      <div className="space-y-3 p-5 md:mx-auto md:max-w-md">
        <div className="h-24 animate-pulse rounded-card bg-neutral-100 dark:bg-neutral-900" />
        <div className="h-64 animate-pulse rounded-card bg-neutral-100 dark:bg-neutral-900" />
      </div>
    );
  }

  if (status === 'error' || !data) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Couldn't load your profile.</p>
        <button
          type="button"
          onClick={retry}
          className="flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-500"
        >
          <RefreshCw className="size-4" /> Retry
        </button>
      </div>
    );
  }

  const { profile, loyalty } = data;
  const initial = profile.fullName.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="px-5 py-6 md:mx-auto md:max-w-md md:py-10">
      <div className="mb-6 flex items-center gap-4 rounded-card border border-neutral-100 p-4 dark:border-neutral-800">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-2xl font-bold text-brand-600 dark:bg-brand-700/20">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.fullName} className="size-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold text-ink-900 dark:text-white">{profile.fullName}</div>
          <div className="truncate text-sm text-neutral-500 dark:text-neutral-400">{profile.email}</div>
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-2.5 py-0.5 text-xs font-semibold text-accent-500">
            {loyalty.tier} · {loyalty.points} pts
          </div>
        </div>
      </div>

      <div className="mb-4 overflow-hidden rounded-card border border-neutral-100 dark:border-neutral-800">
        {menuRows.map((row, i) => {
          const content = (
            <>
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                  row.danger
                    ? 'bg-danger-500/10 text-danger-500'
                    : 'bg-brand-50 text-brand-600 dark:bg-brand-700/20'
                }`}
              >
                <row.icon className="size-5" />
              </div>
              <span
                className={`flex-1 font-medium ${row.danger ? 'text-danger-500' : 'text-ink-900 dark:text-white'}`}
              >
                {row.label}
              </span>
              {row.to && <ChevronRight className="size-5 text-neutral-300 dark:text-neutral-600" />}
            </>
          );
          const rowClass = `flex items-center gap-3 px-4 py-3.5 ${
            i !== menuRows.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''
          }`;
          return row.to ? (
            <Link key={row.label} to={row.to} className={rowClass}>
              {content}
            </Link>
          ) : (
            <div key={row.label} className={`${rowClass} opacity-60`}>
              {content}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleLogOut}
        className="flex w-full items-center gap-3 rounded-card border border-neutral-100 px-4 py-3.5 text-danger-500 dark:border-neutral-800"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-danger-500/10">
          <LogOut className="size-5" />
        </div>
        <span className="font-medium">Log Out</span>
      </button>
    </div>
  );
}

export function ProfilePage() {
  if (!getTokens()) return <LoggedOutPrompt />;
  return <ProfileContent />;
}
