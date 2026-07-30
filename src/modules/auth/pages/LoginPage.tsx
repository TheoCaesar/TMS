import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField } from '@/components/ui/TextField';
import { PasswordField } from '@/components/ui/PasswordField';
import { authApi, ApiError } from '@/lib/api';
import { ROUTES } from '@/lib/routes';

// No Figma screen captured for Login — styled consistently with Register
// (which does match a captured Figma screen) and the rest of the app.
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    authApi.login$({ email, password }).subscribe({
      next: () => navigate(ROUTES.home),
      error: (err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
        setSubmitting(false);
      },
    });
  }

  return (
    <div className="px-5 pt-6 pb-10 md:mx-auto md:max-w-md md:pt-16">
      <h1 className="mb-6 text-2xl font-bold text-ink-900 dark:text-white">Log In</h1>

      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordField
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="mb-4 text-sm text-danger-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Don't have an account?{' '}
        <Link to={ROUTES.auth.register} className="font-medium text-brand-600 dark:text-brand-500">
          Sign up
        </Link>
      </p>
    </div>
  );
}
