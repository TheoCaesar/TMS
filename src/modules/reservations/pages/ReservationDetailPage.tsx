import { Calendar, CheckCircle2, Clock, ExternalLink, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { throwError } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiError, paymentsApi, reservationsApi, socketApi } from '@/lib/api';
import { useApiResource } from '@/hooks/useApiResource';
import { SkeletonCircle, SkeletonLine, SkeletonRegion } from '@/components/ui/Skeleton';
import { formatDate, formatMoney, formatTime } from '@/lib/format';

// Reached after booking a Stay room (AccommodationDetailPage) or a Flight
// offer (FlightResultsPage) — and reusable for restaurant Table
// reservations too, since all three share the same
// /reservations/{reference} shape. This is the Reservation-flavoured
// twin of BookingDetailPage (Tours only) — same Paystack handoff, same
// manual-verify fallback, same cancel-with-confirm. See that file for the
// fuller rationale; kept as a separate component because the two
// underlying API resources (Booking vs Reservation) are genuinely
// different endpoints, not just a naming difference.
//
// Payment confirmation is asynchronous (Paystack calls the backend's
// webhook, never this page directly). The /bookings socket namespace is
// documented as Tour-booking-only, so whether it also pushes
// STAY/FLIGHT/TABLE reference updates is unconfirmed — subscribed anyway
// since a dead/no-op socket degrades silently (manual verify + tab-focus
// refetch still work either way).
export function ReservationDetailPage() {
  const { reference } = useParams<{ reference: string }>();
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data: reservation, status, retry } = useApiResource(() => {
    if (!reference) return throwError(() => new Error('Missing reservation reference'));
    return reservationsApi.getReservation$(reference);
  });

  const retryRef = useRef(retry);
  retryRef.current = retry;

  useEffect(() => {
    if (!reference) return;
    const subscription = socketApi.bookingStatus$().subscribe({
      next: (event) => {
        if (event.reference === reference) retryRef.current();
      },
      error: () => {},
    });
    return () => subscription.unsubscribe();
  }, [reference]);

  useEffect(() => {
    if (!awaitingPayment) return;
    function onVisible() {
      if (document.visibilityState === 'visible') retryRef.current();
    }
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [awaitingPayment]);

  function handlePay() {
    if (!reference) return;
    const payWindow = window.open('', '_blank');
    if (payWindow) payWindow.opener = null;

    setPaying(true);
    setPayError(null);
    setAwaitingPayment(false);
    setCheckoutUrl(null);

    paymentsApi.initiatePayment$({ bookingReference: reference }).subscribe({
      next: (result) => {
        setPaying(false);
        setAwaitingPayment(true);
        setCheckoutUrl(result.authorizationUrl);
        if (payWindow && !payWindow.closed) {
          payWindow.location.replace(result.authorizationUrl);
        }
      },
      error: (err: unknown) => {
        payWindow?.close();
        setPayError(err instanceof ApiError ? err.message : 'Could not start payment.');
        setPaying(false);
      },
    });
  }

  function handleCancel() {
    if (!reference) return;
    setCanceling(true);
    setCancelError(null);
    reservationsApi.cancelReservation$(reference).subscribe({
      next: () => {
        setConfirmingCancel(false);
        setCanceling(false);
        retry();
      },
      error: (err: unknown) => {
        setCancelError(err instanceof ApiError ? err.message : 'Could not cancel this reservation.');
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
        next: retry,
        error: retry,
      });
  }

  return (
    <div className="px-5 py-6 md:mx-auto md:max-w-md md:py-12">
      <div className="mb-5 flex flex-col items-center text-center">
        {!reservation ? (
          <SkeletonCircle className="mb-2 size-12" />
        ) : reservation.status === 'CONFIRMED' || reservation.status === 'COMPLETED' ? (
          <CheckCircle2 className="mb-2 size-12 text-brand-600" />
        ) : reservation.status === 'CANCELLED' ? (
          <XCircle className="mb-2 size-12 text-danger-500" />
        ) : (
          <Clock className="mb-2 size-12 text-accent-500" />
        )}

        {reservation ? (
          <>
            <h1 className="text-xl font-bold text-ink-900 dark:text-white">
              {reservation.status === 'PENDING' && 'Payment pending'}
              {reservation.status === 'CONFIRMED' && 'Reservation confirmed'}
              {reservation.status === 'COMPLETED' && 'Completed'}
              {reservation.status === 'CANCELLED' && 'Reservation cancelled'}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{reservation.reference}</p>
          </>
        ) : (
          <SkeletonRegion label="Loading reservation" className="flex flex-col items-center">
            <SkeletonLine boxClassName="h-7" className="w-44" />
            <SkeletonLine className="w-28" />
          </SkeletonRegion>
        )}
      </div>

      <div className="space-y-3 rounded-card border border-neutral-100 p-4 dark:border-neutral-800">
        {!reservation ? (
          <div className="flex items-center gap-3">
            <div className="size-14 shrink-0 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="w-2/3" />
              <SkeletonLine className="h-3 w-1/2" />
            </div>
          </div>
        ) : (
          reservation.item && (
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-3 dark:border-neutral-800">
              {reservation.item.imageUrl && (
                <img
                  src={reservation.item.imageUrl}
                  alt=""
                  className="size-14 shrink-0 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0">
                <div className="truncate font-semibold text-ink-900 dark:text-white">
                  {reservation.item.title}
                </div>
                {reservation.item.subtitle && (
                  <div className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                    {reservation.item.subtitle}
                  </div>
                )}
                {reservation.item.startsAt && (
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                    <Calendar className="size-3.5" />
                    {formatDate(reservation.item.startsAt)} · {formatTime(reservation.item.startsAt)}
                    {reservation.item.endsAt && ` → ${formatDate(reservation.item.endsAt)}`}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {(['Total', 'Status'] as const).map((label) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
            {reservation ? (
              <span className="font-medium text-ink-900 dark:text-white">
                {label === 'Total' && formatMoney(reservation.totalMinor, reservation.currency)}
                {label === 'Status' && reservation.status}
              </span>
            ) : (
              <SkeletonLine className={label === 'Total' ? 'w-24' : 'w-16'} />
            )}
          </div>
        ))}
      </div>

      {status === 'error' && (
        <div className="mt-4 flex items-center justify-between rounded-card border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          <span>Couldn't load this reservation.</span>
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

      {reservation?.status === 'PENDING' && (
        <div className="mt-5 space-y-3">
          {awaitingPayment ? (
            <div className="space-y-3 rounded-card border border-brand-500/30 bg-brand-50 p-4 dark:bg-brand-700/15">
              <div className="flex items-start gap-2">
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-500" />
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">
                    Complete your payment in the other tab
                  </p>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    Come back here when you're done — this page updates on its own once Paystack
                    confirms. You can leave it open.
                  </p>
                </div>
              </div>

              {checkoutUrl && (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  <ExternalLink className="size-4" /> Open the payment page again
                </a>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {paying ? (
                <>
                  <RefreshCw className="size-4 animate-spin" /> Opening Paystack…
                </>
              ) : (
                <>
                  <ExternalLink className="size-4" /> Pay with Paystack
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400"
          >
            <RefreshCw className={`size-4 ${verifying ? 'animate-spin' : ''}`} />
            {awaitingPayment ? 'Check payment status now' : "I've already paid — check status"}
          </button>
        </div>
      )}

      {(reservation?.status === 'PENDING' || reservation?.status === 'CONFIRMED') && (
        <div className="mt-5">
          {cancelError && <p className="mb-3 text-sm text-danger-500">{cancelError}</p>}
          {confirmingCancel ? (
            <div className="space-y-3 rounded-card border border-danger-500/30 bg-danger-500/5 p-4">
              <p className="text-sm text-ink-900 dark:text-white">
                Cancel this reservation? This can't be undone.
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
              Cancel reservation
            </button>
          )}
        </div>
      )}
    </div>
  );
}
