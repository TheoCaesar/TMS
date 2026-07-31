import { CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { throwError } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiError, bookingsApi, paymentsApi, socketApi } from '@/lib/api';
import { useApiResource } from '@/hooks/useApiResource';
import { SkeletonCircle, SkeletonLine, SkeletonRegion } from '@/components/ui/Skeleton';
import { formatMoney } from '@/lib/format';

// Reached right after creating a booking (TourDetailPage) or later from
// the Bookings list. No Figma screen exists for this — see
// docs/DEVELOPMENT_LOG.md. Handles the Paystack handoff: initiating a
// payment redirects the browser to Paystack's hosted checkout page. We
// don't control the backend's configured callback_url, so this page also
// offers a manual "I've paid" verify action as a resilient fallback.
//
// Payment confirmation is asynchronous: Paystack calls the backend's
// webhook server-to-server, so no request this page makes ever returns the
// confirmation directly. The /bookings socket is what closes that loop —
// see the booking.status_changed effect below.
export function BookingDetailPage() {
  const { reference } = useParams<{ reference: string }>();
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const { data: bookingResource, status, retry } = useApiResource(() => {
    if (!reference) return throwError(() => new Error('Missing booking reference'));
    return bookingsApi.getBooking$(reference);
  });

  // Keep the effect below off retry's identity — useApiResource returns a
  // fresh `load` closure each render, which would otherwise reconnect the
  // socket on every state change.
  const retryRef = useRef(retry);
  retryRef.current = retry;

  // Live PENDING -> CONFIRMED (and -> CANCELLED on hold expiry, -> COMPLETED
  // after the trip). The event is authoritative, but refetching over REST
  // keeps a single source of truth and reuses all the rendering below
  // unchanged. Purely additive: if the socket never connects, the manual
  // verify button still works.
  useEffect(() => {
    if (!reference) return;
    const subscription = socketApi.bookingStatus$().subscribe({
      next: (event) => {
        if (event.reference === reference) retryRef.current();
      },
      // A dead socket must not disturb the page — REST already rendered it.
      error: () => {},
    });
    return () => subscription.unsubscribe();
  }, [reference]);

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

  // Shell-first: the status block, the summary card frame and its three
  // static row labels all paint immediately; only the values resolve.
  const booking = bookingResource;

  return (
    <div className="px-5 py-6 md:mx-auto md:max-w-md md:py-12">
      <div className="mb-5 flex flex-col items-center text-center">
        {!booking ? (
          <SkeletonCircle className="mb-2 size-12" />
        ) : booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ? (
          <CheckCircle2 className="mb-2 size-12 text-brand-600" />
        ) : booking.status === 'CANCELLED' ? (
          <XCircle className="mb-2 size-12 text-danger-500" />
        ) : (
          <Clock className="mb-2 size-12 text-accent-500" />
        )}

        {booking ? (
          <>
            <h1 className="text-xl font-bold text-ink-900 dark:text-white">
              {booking.status === 'PENDING' && 'Payment pending'}
              {booking.status === 'CONFIRMED' && 'Booking confirmed'}
              {booking.status === 'COMPLETED' && 'Trip completed'}
              {booking.status === 'CANCELLED' && 'Booking cancelled'}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{booking.reference}</p>
          </>
        ) : (
          // h-7 matches text-xl's line box; the reference line is text-sm.
          <SkeletonRegion label="Loading booking" className="flex flex-col items-center">
            <SkeletonLine boxClassName="h-7" className="w-44" />
            <SkeletonLine className="w-28" />
          </SkeletonRegion>
        )}
      </div>

      {/* Row labels are static — they never wait on the fetch, so only the
          right-hand values swap in and the card never changes height. */}
      <div className="space-y-3 rounded-card border border-neutral-100 p-4 dark:border-neutral-800">
        {(['Seats', 'Total', 'Status'] as const).map((label) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
            {booking ? (
              <span className="font-medium text-ink-900 dark:text-white">
                {label === 'Seats' && booking.seats}
                {label === 'Total' && formatMoney(booking.totalMinor, booking.currency)}
                {label === 'Status' && booking.status}
              </span>
            ) : (
              <SkeletonLine className={label === 'Total' ? 'w-24' : 'w-16'} />
            )}
          </div>
        ))}
      </div>

      {status === 'error' && (
        <div className="mt-4 flex items-center justify-between rounded-card border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          <span>Couldn't load this booking.</span>
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-1 font-medium text-brand-600 dark:text-brand-500"
          >
            <RefreshCw className="size-4" /> Retry
          </button>
        </div>
      )}

      {payError && <p className="mt-3 text-sm text-danger-500">{payError}</p>}

      {booking?.status === 'PENDING' && (
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
