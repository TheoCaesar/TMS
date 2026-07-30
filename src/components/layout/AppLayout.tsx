import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <NavBar />
      <Outlet />
    </div>
  );
}
