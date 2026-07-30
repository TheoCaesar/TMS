import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

// Module M6 — Emergency Medical Assistance (SRS 3.7, FR-EMRG-01 to 11)
// Safety-critical: must remain reachable without authentication (FR-EMRG-08).
export function EmergencyPage() {
  return (
    <PlaceholderPage
      title="Emergency"
      description="Nearest medical facilities, one-tap SOS, and health/safety advisories."
    />
  );
}
