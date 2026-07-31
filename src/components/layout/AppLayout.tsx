import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';

// Mobile-first shell: a phone-width column on small screens, widening at
// md/lg into a desktop layout with a top nav instead of the bottom tab
// bar. `transform-gpu` gives this element a containing block for
// `position: fixed` descendants (BottomNav — which now carries the raised
// SOS button itself — and page-level fixed bars like the booking sticky
// bar), so they stay pinned to the edges of this column — whatever width
// it currently is — instead of the full viewport.
export function AppLayout() {
  return (
    <div className="relative mx-auto min-h-screen max-w-md transform-gpu bg-white dark:bg-neutral-950 md:max-w-3xl lg:max-w-6xl">
      <TopNav />
      <div className="pb-20 md:pb-0">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
