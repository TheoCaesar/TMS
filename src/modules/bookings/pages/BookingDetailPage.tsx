import { CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError, bookingsApi, paymentsApi } from '@/lib/api';
import { useApiResource } from '@/hooks/useApiResource';
import { formatMoney } from '@/lib/format';

// Reached right after creating a booking (TourDetailPage) or later from
// the Bookings list. No Figma screen exists for this — see
// docs/DEVELOPMENT_LOG.md. Handles the Paystack handoff: initiating a
// payment redirects the browser to Paystack's hosted checkout page. We
// don't control the backend's configured callback_url, so this page also
// offers a manual "I've paid" verify action as a resilient fallback.
export function BookingDetailPage() {
  const { reference } = useParams<{ reference: string }>();
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const { data: bookingResource, status, retry } = useApiResource(() => {
    if (!reference) throw new Error('Missing booking reference');
    return bookingsApi.getBooking(reference);
  });

  async function handlePay() {
    if (!reference) return;
    setPaying(true);
    setPayError(null);
    try {
      const result = await paymentsApi.initiatePayment({ bookingReference: reference });
      window.location.href = result.authorizationUrl;
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'Could not start payment.');
      setPaying(false);
    }
  }

  async function handleVerify() {
    if (!reference) return;
    setVerifying(true);
    try {
      await paymentsApi.verifyPayment(reference);
    } catch {
      // Verify is best-effort here; refetching the booking below is the
      // real source of truth regardless of whether this call succeeded.
    } finally {
      setVerifying(false);
      retry();
    }
  }

  if (status === 'loading') {
    return (
      <div className="space-y-3 p-5">
        <div className="h-32 animate-pulse rounded-card bg-neutral-100 dark:bg-neutral-900" />
      </div>
    );
  }

  if (status === 'error' || !bookingResource) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Couldn't load this booking.</p>
        <button
          type="button"
          onClick={retry}
          className="flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-500"
        >
          <RefreshCw className="size-4" /> Retry
        </button>
      </div>
    );
  }

  const booking = bookingResource;

  return (
    <div className="px-5 py-6 md:mx-auto md:max-w-md md:py-12">
      <div className="mb-5 flex flex-col items-center text-center">
        {booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ? (
          <CheckCircle2 className="mb-2 size-12 text-brand-600" />
        ) : booking.status === 'CANCELLED' ? (
          <XCircle className="mb-2 size-12 text-danger-500" />
        ) : (
          <Clock className="mb-2 size-12 text-accent-500" />
        )}
        <h1 className="text-xl font-bold text-ink-900 dark:text-white">
          {booking.status === 'PENDING' && 'Payment pending'}
          {booking.status === 'CONFIRMED' && 'Booking confirmed'}
          {booking.status === 'COMPLETED' && 'Trip completed'}
          {booking.status === 'CANCELLED' && 'Booking cancelled'}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{booking.reference}</p>
      </div>

      <div className="space-y-3 rounded-card border border-neutral-100 p-4 dark:border-neutral-800">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">Seats</span>
          <span className="font-medium text-ink-900 dark:text-white">{booking.seats}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">Total</span>
          <span className="font-medium text-ink-900 dark:text-white">
            {formatMoney(booking.totalMinor, booking.currency)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">Status</span>
          <span className="font-medium text-ink-900 dark:text-white">{booking.status}</span>
        </div>
      </div>

      {payError && <p className="mt-3 text-sm text-danger-500">{payError}</p>}

      {booking.status === 'PENDING' && (
        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={handlePay}
            disabled={paying}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {paying ? 'Redirecting to Paystack…' : 'Pay with Paystack'}
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400"
          >
            <RefreshCw className={`size-4 ${verifying ? 'animate-spin' : ''}`} />
            I've already paid — check status
          </button>
        </div>
      )}
    </div>
  );
}
