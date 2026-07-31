import { CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { throwError } from 'rxjs';
import { finalize } from 'rxjs/operators';
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
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data: bookingResource, status, retry } = useApiResource(() => {
    if (!reference) return throwError(() => new Error('Missing booking reference'));
    return bookingsApi.getBooking$(reference);
  });

  function handlePay() {
    if (!reference) return;
    setPaying(true);
    setPayError(null);
    paymentsApi.initiatePayment$({ bookingReference: reference }).subscribe({
      next: (result) => {
        window.location.href = result.authorizationUrl;
      },
      error: (err: unknown) => {
        setPayError(err instanceof ApiError ? err.message : 'Could not start payment.');
        setPaying(false);
      },
    });
  }

  function handleCancel() {
    if (!reference) return;
    setCanceling(true);
    setCancelError(null);
    bookingsApi.cancelBooking$(reference).subscribe({
      next: () => {
        setConfirmingCancel(false);
        setCanceling(false);
        retry();
      },
      error: (err: unknown) => {
        setCancelError(err instanceof ApiError ? err.message : 'Could not cancel booking.');
        setCanceling(false);
      },
    });
  }

  function handleVerify() {
    if (!reference) return;
    setVerifying(true);
    paymentsApi
      .verifyPayment$(reference)
      .pipe(finalize(() => setVerifying(false)))
      .subscribe({
        // Verify is best-effort here; refetching the booking below is the
        // real source of truth regardless of whether this call succeeded.
        next: retry,
        error: retry,
      });
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

      {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
        <div className="mt-5">
          {cancelError && <p className="mb-3 text-sm text-danger-500">{cancelError}</p>}
          {confirmingCancel ? (
            <div className="space-y-3 rounded-card border border-danger-500/30 bg-danger-500/5 p-4">
              <p className="text-sm text-ink-900 dark:text-white">
                Cancel this booking? This can't be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  disabled={canceling}
                  className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-600 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-400"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={canceling}
                  className="flex-1 rounded-xl bg-danger-500 py-2.5 text-sm font-semibold text-white transition hover:bg-danger-600 disabled:opacity-60"
                >
                  {canceling ? 'Cancelling…' : 'Yes, cancel'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingCancel(true)}
              className="w-full text-sm font-medium text-danger-500"
            >
              Cancel booking
            </button>
          )}
        </div>
      )}
    </div>
  );
}
