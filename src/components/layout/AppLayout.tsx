import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';

// Mobile-first shell: a phone-width column on small screens, widening at
// md/lg into a desktop layout with a top nav instead of the bottom tab
// bar.
//
// The outer element is `fixed inset-0` (pinned to the true viewport,
// never moves) *and* `transform-gpu` (a containing block for
// `position: fixed` descendants — BottomNav, and page-level sticky bars
// like the booking bar). Both matter together: `transform-gpu` alone
// isn't enough, because a transformed ancestor that's just a normal,
// taller-than-the-viewport block still scrolls away with the page —
// dragging every "fixed" descendant along with it instead of keeping
// them pinned to the screen (this was a real bug: the bottom nav and
// sticky bars drifted on scroll). Only the inner `<Outlet />` region
// scrolls (`overflow-y-auto`); the frame around it stays put, so
// anything fixed to that frame genuinely stays fixed.
export function AppLayout() {
  return (
    <div className="fixed inset-0 transform-gpu">
      <div className="relative mx-auto flex h-full max-w-md flex-col bg-white dark:bg-neutral-950 md:max-w-3xl lg:max-w-6xl">
        <TopNav />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
