import { Briefcase, Compass, Home as HomeIcon, User, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

export interface NavTab {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

// Shared between BottomNav (mobile) and TopNav (tablet/desktop). "Bookings"
// (Calendar icon) was dropped — it was a dead placeholder duplicating
// My Trips (see DEVELOPMENT_LOG.md); BottomNav puts the SOS button in its
// old slot instead.
export const navTabs: NavTab[] = [
  { to: ROUTES.home, label: 'Home', icon: HomeIcon, end: true },
  { to: ROUTES.explore, label: 'Explore', icon: Compass },
  { to: ROUTES.trips, label: 'My Trips', icon: Briefcase },
  { to: ROUTES.profile, label: 'Profile', icon: User },
];
