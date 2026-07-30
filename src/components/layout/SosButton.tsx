import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

// Always-reachable emergency entry point (FR-EMRG-08 — no auth gate, no
// digging through menus). Fixed above the bottom tab bar on mobile.
// Hidden md+: TopNav's persistent "Emergency" link covers the same
// requirement there without a redundant floating button.
export function SosButton() {
  return (
    <Link
      to={ROUTES.emergency}
      className="fixed bottom-20 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-danger-500 text-xs font-bold text-white shadow-lg shadow-danger-500/30 transition hover:bg-danger-600 md:hidden"
      aria-label="Emergency SOS"
    >
      SOS
    </Link>
  );
}
