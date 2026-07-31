import { Ambulance, Landmark, MapPin, Navigation, Phone, TriangleAlert } from 'lucide-react';

// Module M6 — Emergency Medical Assistance (SRS 3.7, FR-EMRG-01 to 11)
// Safety-critical: must remain reachable without authentication (FR-EMRG-08).
// No backend endpoint exists for this module (see docs/HANDOFF.md) — this is
// UI only, matching a user-supplied Figma screenshot; facility data below is
// the design's own static content, not live/mocked API data.

type Tone = 'danger' | 'brand' | 'accent' | 'neutral';

const toneClasses: Record<Tone, string> = {
  danger: 'bg-danger-500',
  brand: 'bg-brand-600',
  accent: 'bg-accent-500',
  neutral: 'bg-neutral-400 dark:bg-neutral-600',
};

const quickActions: { label: string; sub?: string; icon: typeof Phone; tone: Tone }[] = [
  { label: 'Call Ambulance', icon: Phone, tone: 'danger' },
  { label: 'Nearest Hospital', sub: '0.9km · Korle Bu', icon: MapPin, tone: 'brand' },
  { label: 'My Embassy', icon: Landmark, tone: 'accent' },
  { label: 'Travel Advisory', icon: TriangleAlert, tone: 'neutral' },
];

const facilities = [
  { name: 'Korle Bu Teaching Hospital', type: 'Emergency & Trauma Center', distance: '0.9 km' },
  { name: '37 Military Hospital', type: 'General Hospital', distance: '2.3 km' },
  { name: 'Ridge Hospital', type: 'General Hospital', distance: '3.1 km' },
];

export function EmergencyPage() {
  return (
    <div className="md:mx-auto md:max-w-xl">
      <header className="bg-danger-500 px-5 pt-6 pb-6 md:rounded-t-card md:pt-10">
        <h1 className="text-2xl font-bold text-white">Emergency</h1>
      </header>

      <div className="px-5 pt-5">
        <button
          type="button"
          className="flex w-full flex-col items-center gap-3 rounded-card bg-danger-500 px-6 py-8 text-white shadow-sm transition hover:bg-danger-600"
        >
          <Ambulance className="size-12" strokeWidth={1.5} />
          <span className="text-lg font-bold tracking-wide">TRIGGER SOS ALERT</span>
        </button>
      </div>

      <section className="px-5 pt-6">
        <h2 className="mb-3 text-lg font-bold text-ink-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ label, sub, icon: Icon, tone }) => (
            <button
              key={label}
              type="button"
              className="flex flex-col items-start gap-2 rounded-card border border-neutral-100 bg-white p-4 text-left shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span
                className={`flex size-11 items-center justify-center rounded-xl text-white ${toneClasses[tone]}`}
              >
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-semibold text-ink-900 dark:text-white">{label}</span>
              {sub ? (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{sub}</span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 py-6">
        <h2 className="mb-3 text-lg font-bold text-ink-900 dark:text-white">
          Nearest Medical Facilities
        </h2>
        <div className="flex flex-col gap-3">
          {facilities.map((facility) => (
            <div
              key={facility.name}
              className="rounded-card border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3 className="font-semibold text-ink-900 dark:text-white">{facility.name}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{facility.type}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <MapPin className="size-4 text-brand-600" />
                {facility.distance}
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-500">
                  Available
                </span>
              </div>
              <button
                type="button"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <Navigation className="size-4" /> Get Directions
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
