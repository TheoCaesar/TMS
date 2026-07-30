import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { SosButton } from './SosButton';

// Mobile-first shell: a phone-width column that also reads sensibly on
// larger screens. `transform-gpu` gives this element a containing block
// for `position: fixed` descendants (BottomNav, SosButton), so they stay
// pinned to the edges of this column instead of the full viewport once
// the column stops being full-width (tablet/desktop).
export function AppLayout() {
  return (
    <div className="relative mx-auto min-h-screen max-w-md transform-gpu bg-white dark:bg-neutral-950">
      <div className="pb-20">
        <Outlet />
      </div>
      <SosButton />
      <BottomNav />
    </div>
  );
}
