'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type CheckoutStatus = 'checking' | 'paid' | 'failed' | 'pending' | 'error';

export function PaymentSuccessStatus({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<CheckoutStatus>(sessionId ? 'checking' : 'error');

  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    async function checkPayment() {
      for (let attempt = 0; attempt < 20 && active; attempt += 1) {
        try {
          const result = await apiFetch<{
            bookings: { stripeSessionId?: string; paymentStatus?: string }[];
          }>('/bookings/my');
          const booking = result.bookings.find((item) => item.stripeSessionId === sessionId);

          if (booking?.paymentStatus === 'paid') {
            if (active) setStatus('paid');
            return;
          }
          if (booking?.paymentStatus === 'failed' || booking?.paymentStatus === 'cancelled') {
            if (active) setStatus('failed');
            return;
          }
        } catch {
          // Keep checking while Stripe's redirect and the API session settle.
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }

      if (active) setStatus('pending');
    }

    void checkPayment();
    return () => {
      active = false;
    };
  }, [sessionId]);

  const paid = status === 'paid';
  const failed = status === 'failed';

  return (
    <div className="grid min-h-[65vh] place-items-center px-5 py-16">
      <div className="max-w-lg rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-100/50">
        <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl ${paid ? 'bg-emerald-50 text-emerald-600' : failed ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
          {paid ? '✓' : failed ? '!' : '…'}
        </span>
        <p className={`mt-6 text-xs font-bold tracking-widest ${paid ? 'text-emerald-700' : 'text-amber-700'}`}>
          {paid ? 'PAYMENT CONFIRMED' : failed ? 'PAYMENT NOT COMPLETED' : 'CONFIRMING PAYMENT'}
        </p>
        <h1 className="mt-3 text-3xl font-black">
          {paid ? 'You’re all set.' : failed ? 'Payment was not completed.' : 'Checking your booking…'}
        </h1>
        <p className="mt-3 leading-7 text-slate-500">
          {paid
            ? 'Stripe confirmed the payment and Gearly updated your booking.'
            : failed
              ? 'Your booking remains unpaid. Return to your rentals to review its current status.'
              : status === 'pending'
                ? 'Stripe returned you to Gearly, but the webhook confirmation has not arrived yet. Your booking will remain unpaid until Stripe confirms it.'
                : 'We are waiting for Stripe’s server confirmation. This page will refresh the booking status automatically.'}
        </p>
        {status !== 'checking' && (
          <Link
            href="/dashboard/my-rentals"
            className="mt-7 inline-block rounded-xl bg-[#263b49] px-6 py-3 font-bold text-white"
          >
            View my rentals ↗
          </Link>
        )}
        {status === 'error' && (
          <p className="mt-4 text-sm text-slate-400">No Checkout Session was returned. Check your rentals for the latest status.</p>
        )}
      </div>
    </div>
  );
}
