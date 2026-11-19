'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError, apiFetch } from '@/lib/api';

type CheckoutStatus = 'checking' | 'paid' | 'failed' | 'expired' | 'pending' | 'timeout' | 'error';
type Verification = { status: 'paid' | 'pending' | 'failed' | 'expired' | 'unpaid'; bookingId?: string };
type BookingList = { bookings: { _id: string; stripeSessionId?: string; paymentStatus?: string }[] };

export function PaymentSuccessStatus({ sessionId, userId }: { sessionId: string; userId: string }) {
  const [status, setStatus] = useState<CheckoutStatus>(sessionId ? 'checking' : 'error');
  const stopRef = useRef<(() => void) | null>(null);
  const [retry, setRetry] = useState(0);

  const verify = useCallback(async (signal: AbortSignal): Promise<Verification> => {
    const result = await apiFetch<Verification>('/payments/verify-session', {
      method: 'POST', body: JSON.stringify({ sessionId }), signal,
    }, userId);
    if (result.status === 'paid') {
      const { bookings } = await apiFetch<BookingList>('/bookings/my', {}, userId);
      const booking = bookings.find((item) => item.stripeSessionId === sessionId);
      if (booking?.paymentStatus !== 'paid') return { status: 'pending' };
    }
    return result;
  }, [sessionId, userId]);

  useEffect(() => {
    if (!sessionId || !userId) { setStatus('error'); return; }
    setStatus('checking');
    let active = true;
    let inFlight = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const stop = () => {
      if (!active) return;
      active = false;
      if (pollTimer) clearTimeout(pollTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      controller.abort();
    };
    const terminalStatuses = ['paid', 'failed', 'expired', 'unpaid'];
    const check = async () => {
      if (!active || inFlight) return;
      inFlight = true;
      try {
        const result = await verify(controller.signal);
        if (!active) return;
        setStatus(result.status === 'unpaid' ? 'pending' : result.status);
        if (terminalStatuses.includes(result.status)) stop();
      } catch (error) {
        if (active && error instanceof ApiRequestError && error.status >= 400 && error.status < 500) {
          setStatus('error');
          stop();
        }
      } finally {
        inFlight = false;
        if (active) pollTimer = setTimeout(check, 3000);
      }
    };
    const timeoutTimer = setTimeout(() => {
      if (active) setStatus('timeout');
      stop();
    }, 60000);
    void check();
    stopRef.current = stop;
    return () => { stop(); if (stopRef.current === stop) stopRef.current = null; };
  }, [sessionId, userId, retry, verify]);

  const paid = status === 'paid';
  const failed = status === 'failed' || status === 'expired' || status === 'error';
  const retryVerification = () => { stopRef.current?.(); setRetry((value) => value + 1); };
  const title = paid ? 'You’re all set.' : status === 'expired' ? 'Checkout expired.' : status === 'failed' ? 'Payment was not completed.' : status === 'timeout' ? 'Verification is taking longer than expected.' : status === 'error' ? 'Unable to verify payment.' : 'Checking your booking…';
  const message = paid ? 'Stripe confirmed the payment and Gearly updated your booking.'
    : status === 'failed' ? 'Stripe reported that this payment did not complete. Your booking remains unpaid.'
    : status === 'expired' ? 'This Checkout Session expired. Start a new checkout from your rentals.'
    : status === 'timeout' ? 'We could not confirm the payment within 60 seconds. Your booking has not been marked paid. You can retry verification.'
    : status === 'error' ? 'The payment could not be verified for this signed-in account. Check your rentals or retry.'
    : 'Gearly is verifying this Checkout Session directly with Stripe. This page will retry every 3 seconds while it is processing.';

  return <div className="grid min-h-[65vh] place-items-center px-5 py-16"><div className="max-w-lg rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-100/50">
    <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl ${paid ? 'bg-emerald-50 text-emerald-600' : failed ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{paid ? '✓' : failed ? '!' : '…'}</span>
    <p className={`mt-6 text-xs font-bold tracking-widest ${paid ? 'text-emerald-700' : failed ? 'text-rose-700' : 'text-amber-700'}`}>{paid ? 'PAYMENT CONFIRMED' : failed ? 'PAYMENT NOT CONFIRMED' : status === 'timeout' ? 'VERIFICATION TIMED OUT' : 'CONFIRMING PAYMENT'}</p>
    <h1 className="mt-3 text-3xl font-black">{title}</h1><p className="mt-3 leading-7 text-slate-500">{message}</p>
    {(status === 'timeout' || status === 'error') && <button type="button" onClick={retryVerification} className="mt-6 rounded-xl border border-slate-300 px-5 py-3 font-bold">Retry verification</button>}
    {status !== 'checking' && <Link href="/dashboard/my-rentals" className="mt-7 inline-block rounded-xl bg-[#263b49] px-6 py-3 font-bold text-white">View my rentals ↗</Link>}
  </div></div>;
}
