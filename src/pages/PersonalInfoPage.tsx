import { ChevronLeft, RefreshCw } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, usersApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton, SkeletonRegion } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { ROUTES } from '@/lib/routes';

// Reached from Profile's "Personal Info" row — the one settings-menu item
// with real backend support (PATCH /users/me). Email isn't editable: the
// API has no change-email endpoint.
export function PersonalInfoPage() {
  // Reads from — and writes back to — the shared auth context, so saving
  // here updates the nav and Profile without a refetch or a reload.
  const { user: profile, loading, refresh } = useAuth();
  const status = loading ? 'loading' : profile ? 'ready' : 'error';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    usersApi.updateMe$({ fullName, phone }).subscribe({
      next: () => {
        setSaving(false);
        setSaved(true);
        // Keep the shared profile in step with what was just persisted.
        refresh();
      },
      error: (err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Could not save your changes.');
        setSaving(false);
      },
    });
  }

  return (
    <div className="px-5 pt-6 pb-10 md:max-w-lg md:px-0 md:pt-0">
      <div className="mb-6 flex items-center gap-3">
        {/* Only needed on mobile, where this page replaces the settings list
            full-screen. On desktop the list stays visible right alongside
            this pane, so a "back" affordance would be redundant. */}
        <Link
          to={ROUTES.profile}
          className="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-ink-900 dark:bg-neutral-900 dark:text-white md:hidden"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Personal Info</h1>
      </div>

      {/* Field labels are static, so the form's shape is visible immediately
          and only the input values fill in — the layout never shifts. */}
      {status === 'loading' && (
        <SkeletonRegion label="Loading your details">
          {['Full Name', 'Email', 'Phone'].map((label) => (
            <div key={label} className="mb-4">
              <span className="mb-1.5 block text-sm font-medium text-ink-900 dark:text-white">
                {label}
              </span>
              <Skeleton className="h-[46px] w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-[46px] w-full rounded-xl" />
        </SkeletonRegion>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Couldn't load your info.</p>
          <button
            type="button"
            onClick={refresh}
            className="flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-500"
          >
            <RefreshCw className="size-4" /> Retry
          </button>
        </div>
      )}

      {status === 'ready' && profile && (
        <form onSubmit={handleSubmit}>
          <TextField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            minLength={2}
          />
          <TextField label="Email" value={profile.email} disabled />
          <TextField
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
          />

          {error && <p className="mb-4 text-sm text-danger-500">{error}</p>}
          {saved && <p className="mb-4 text-sm text-brand-600 dark:text-brand-500">Saved.</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  );
}
