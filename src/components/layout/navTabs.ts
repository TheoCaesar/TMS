import { Briefcase, Calendar, Compass, Home as HomeIcon, User, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

export interface NavTab {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

// Shared between BottomNav (mobile) and TopNav (tablet/desktop).
export const navTabs: NavTab[] = [
  { to: ROUTES.home, label: 'Home', icon: HomeIcon, end: true },
  { to: ROUTES.explore, label: 'Explore', icon: Compass },
  { to: ROUTES.trips, label: 'My Trips', icon: Briefcase },
  { to: ROUTES.bookings, label: 'Bookings', icon: Calendar },
  { to: ROUTES.profile, label: 'Profile', icon: User },
];
