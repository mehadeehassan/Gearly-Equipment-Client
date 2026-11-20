'use client';

import { apiFetch, ApiRequestError } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { notify as toast } from '@/lib/toast';
import type { Equipment } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Heart, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Favorite = { equipmentId?: string; equipment?: { _id?: string } };
type Availability = { available: boolean; remainingQuantity: number };

const unavailableMessage =
  'Equipment unavailable for the selected dates. An existing booking overlaps this rental period and there is not enough quantity left. Please choose another date range or lower the quantity.';

export function EquipmentDetailActions({ item, userId }: { item: Equipment; userId: string }) {
  const [open, setOpen] = useState(false);
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable' | 'error'
  >('idle');
  const [busy, setBusy] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(true);
  const [favoriteLoadError, setFavoriteLoadError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookingDates, setBookingDates] = useState({ startDate: '', endDate: '', quantity: 1 });
  const router = useRouter();

  useEffect(() => {
    let active = true;
    apiFetch<{ favorites: Favorite[] }>('/favorites', {}, userId)
      .then(({ favorites }) => {
        if (active)
          setIsFavorite(
            (favorites || []).some(
              (favorite) => (favorite.equipmentId || favorite.equipment?._id) === item._id,
            ),
          );
      })
      .catch(() => {
        if (active) {
          setIsFavorite(false);
          setFavoriteLoadError(true);
          toast.error('Could not load your saved favorites', { id: `favorite-load-${item._id}` });
        }
      })
      .finally(() => {
        if (active) setFavoriteBusy(false);
      });
    return () => {
      active = false;
    };
  }, [item._id, userId]);

  async function toggleFavorite() {
    if (favoriteBusy || busy) return;
    const session = await authClient.getSession();
    if (!session.data) {
      toast.error('Please log in to save favorites', { id: 'favorite-auth' });
      router.push(`/login?redirect=/equipment/${item._id}`);
      return;
    }
    setFavoriteBusy(true);
    try {
      await apiFetch(`/favorites/${item._id}`, { method: isFavorite ? 'DELETE' : 'POST' }, userId);
      setIsFavorite(!isFavorite);
      setFavoriteLoadError(false);
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites', {
        id: `favorite-${item._id}`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update favorite', {
        id: `favorite-error-${item._id}`,
      });
    } finally {
      setFavoriteBusy(false);
    }
  }

  const rentalUnit =
    item.rentalType === 'Weekly' ? 'week' : item.rentalType === 'Monthly' ? 'month' : 'day';
  const initialDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const rentalUnits =
    bookingDates.startDate && bookingDates.endDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(bookingDates.endDate).getTime() -
              new Date(bookingDates.startDate).getTime()) /
              86400000,
          ),
        )
      : 0;
  const billedUnits = rentalUnits
    ? item.rentalType === 'Weekly'
      ? Math.ceil(rentalUnits / 7)
      : item.rentalType === 'Monthly'
        ? Math.ceil(rentalUnits / 30)
        : rentalUnits
    : 0;
  const estimatedTotal = Number(item.price) * billedUnits * bookingDates.quantity;

  useEffect(() => {
    if (
      !open ||
      !bookingDates.startDate ||
      !bookingDates.endDate ||
      bookingDates.startDate < initialDate ||
      bookingDates.endDate <= bookingDates.startDate ||
      bookingDates.quantity < 1 ||
      bookingDates.quantity > item.availableQuantity
    ) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAvailabilityStatus('checking');
      const query = new URLSearchParams({
        startDate: bookingDates.startDate,
        endDate: bookingDates.endDate,
        quantity: String(bookingDates.quantity),
      });
      try {
        const result = await apiFetch<Availability>(
          `/equipment/${item._id}/availability?${query.toString()}`,
          { signal: controller.signal },
          userId,
        );
        if (!controller.signal.aborted)
          setAvailabilityStatus(result.available ? 'available' : 'unavailable');
      } catch (error) {
        if (controller.signal.aborted) return;
        setAvailabilityStatus('error');
        if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
          toast.error(
            error.status === 401
              ? 'Your session expired. Please sign in again.'
              : 'Your account cannot check booking availability.',
            { id: `booking-availability-auth-${item._id}` },
          );
        } else {
          toast.error('Could not check availability. The server will verify the dates when you submit.', {
            id: `booking-availability-${item._id}`,
          });
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    open,
    item._id,
    item.availableQuantity,
    userId,
    initialDate,
    bookingDates.startDate,
    bookingDates.endDate,
    bookingDates.quantity,
  ]);

  async function book(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const startDate = String(form.get('startDate') || '');
    const endDate = String(form.get('endDate') || '');
    const quantity = Number(form.get('quantity'));
    const nextErrors: Record<string, string> = {};
    if (!startDate) nextErrors.startDate = 'Choose a start date.';
    else if (startDate < initialDate) nextErrors.startDate = 'Choose today or a future date.';
    if (!endDate) nextErrors.endDate = 'Choose an end date.';
    if (new Date(endDate) <= new Date(startDate)) nextErrors.endDate = 'End date must be after the start date.';
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.availableQuantity) nextErrors.quantity = 'Choose a quantity within the available amount.';
    if (!String(form.get('contactNumber') || '').trim()) nextErrors.contactNumber = 'Enter a contact number.';
    else if (!/^[0-9+() -]{7,20}$/.test(String(form.get('contactNumber')))) nextErrors.contactNumber = 'Enter a valid contact number.';
    if (!String(form.get('deliveryAddress') || '').trim()) nextErrors.deliveryAddress = 'Enter a delivery address.';
    if (Object.keys(nextErrors).length) {
      setBookingErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }
    if (availabilityStatus === 'checking' || availabilityStatus === 'unavailable') return;
    setBookingErrors({});
    setBusy(true);
    const payload = {
      equipmentId: item._id,
      startDate,
      endDate,
      quantity,
      contactNumber: form.get('contactNumber'),
      deliveryAddress: form.get('deliveryAddress'),
      notes: form.get('notes'),
    };
    let bookingId: string | undefined;
    try {
      const booking = await apiFetch<{ bookingId: string }>(
        '/bookings',
        { method: 'POST', body: JSON.stringify(payload) },
        userId,
      );
      bookingId = booking.bookingId;
      const checkout = await apiFetch<{ url: string }>(
        `/payments/checkout/${bookingId}`,
        { method: 'POST' },
        userId,
      );
      window.location.assign(checkout.url);
    } catch (error) {
      if (bookingId) {
        toast.error(
          'Your booking is saved, but checkout could not start. You can retry payment from My Rentals.',
          { id: 'checkout-start-error' },
        );
        router.push('/dashboard/my-rentals');
      } else if (error instanceof ApiRequestError && error.status === 409) {
        setAvailabilityStatus('unavailable');
        toast.error(unavailableMessage, { id: 'booking-date-conflict' });
      } else if (error instanceof ApiRequestError && error.status === 401) {
        toast.error('Your session expired. Please sign in again.', { id: 'booking-auth-error' });
      } else {
        toast.error(error instanceof TypeError ? 'Network error. Check your connection and try again.' : 'Unable to submit your booking. Please try again.', {
          id: 'booking-create-error',
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={favoriteBusy}
        aria-pressed={isFavorite}
        className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold transition disabled:opacity-60 ${isFavorite ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white hover:bg-[#edf4f7]'}`}
      >
        <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
        {favoriteBusy
          ? 'Loading…'
          : favoriteLoadError
            ? 'Try saving favorite'
            : isFavorite
              ? 'Saved to favorites'
              : 'Add to favorites'}
      </button>
      <button
        type="button"
        disabled={item.availableQuantity < 1}
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-[#263b49] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-40"
      >
        Book now ↗
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/55 p-3 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-title"
              className="my-auto max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-7">
                <div>
                  <p className="text-xs font-bold tracking-[.16em] text-[#6c91a7]">
                    RESERVE EQUIPMENT
                  </p>
                  <h2 id="booking-title" className="mt-2 text-2xl font-black">
                    Book this equipment
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review the rental details and dates.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close booking form"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600"
                >
                  <X size={19} />
                </button>
              </div>
              <div className="m-5 flex items-center gap-4 rounded-2xl bg-[#edf4f7] p-3 sm:m-7 sm:mb-0 sm:p-4">
                <Image
                  src={item.image || '/icon.svg'}
                  alt=""
                  width={80}
                  height={80}
                  className="h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.rentalType} rental · {item.availableQuantity} available
                  </p>
                </div>
                <p className="shrink-0 text-right font-black">
                  ৳{Number(item.price).toLocaleString()}
                  <span className="block text-xs font-normal text-slate-500">per {rentalUnit}</span>
                </p>
              </div>
              <form onSubmit={book} noValidate className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                <label className="text-sm font-semibold">
                  Start date
                  <input
                    required
                    aria-invalid={!!bookingErrors.startDate}
                    aria-describedby="booking-startDate-error"
                    name="startDate"
                    type="date"
                    min={initialDate}
                    value={bookingDates.startDate}
                    onChange={(event) => {
                      const nextDates = { ...bookingDates, startDate: event.target.value };
                      setBookingDates(nextDates);
                      setBookingErrors((errors) => ({ ...errors, startDate: '', endDate: '' }));
                      setAvailabilityStatus(
                        nextDates.startDate >= initialDate &&
                          nextDates.endDate > nextDates.startDate &&
                          nextDates.quantity <= item.availableQuantity
                          ? 'checking'
                          : 'idle',
                      );
                    }}
                    className={`mt-2 h-12 w-full rounded-xl border px-3 font-normal ${bookingErrors.startDate ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  <span id="booking-startDate-error" className="block min-h-4 text-xs font-normal text-red-600" role="alert">{bookingErrors.startDate || ''}</span>
                </label>
                <label className="text-sm font-semibold">
                  End date
                  <input
                    required
                    aria-invalid={!!bookingErrors.endDate}
                    aria-describedby="booking-endDate-error"
                    name="endDate"
                    type="date"
                    min={bookingDates.startDate || initialDate}
                    value={bookingDates.endDate}
                    onChange={(event) => {
                      const nextDates = { ...bookingDates, endDate: event.target.value };
                      setBookingDates(nextDates);
                      setBookingErrors((errors) => ({ ...errors, endDate: '' }));
                      setAvailabilityStatus(
                        nextDates.startDate >= initialDate &&
                          nextDates.endDate > nextDates.startDate &&
                          nextDates.quantity <= item.availableQuantity
                          ? 'checking'
                          : 'idle',
                      );
                    }}
                    className={`mt-2 h-12 w-full rounded-xl border px-3 font-normal ${bookingErrors.endDate ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  <span id="booking-endDate-error" className="block min-h-4 text-xs font-normal text-red-600" role="alert">{bookingErrors.endDate || ''}</span>
                </label>
                {availabilityStatus === 'unavailable' && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:col-span-2"
                  >
                    <AlertCircle size={19} className="mt-0.5 shrink-0 text-rose-600" aria-hidden="true" />
                    <div>
                      <p className="font-bold">Unavailable for these dates</p>
                      <p className="mt-1">{unavailableMessage}</p>
                    </div>
                  </div>
                )}
                {availabilityStatus === 'checking' && (
                  <p className="text-xs text-slate-500 sm:col-span-2" aria-live="polite">
                    Checking date availability…
                  </p>
                )}
                <label className="text-sm font-semibold">
                  Quantity
                  <input
                    required
                    aria-invalid={!!bookingErrors.quantity}
                    aria-describedby="booking-quantity-error"
                    name="quantity"
                    type="number"
                    min="1"
                    max={item.availableQuantity}
                    value={bookingDates.quantity}
                    onChange={(event) => {
                      const nextDates = {
                        ...bookingDates,
                        quantity: Math.max(1, Number(event.target.value) || 1),
                      };
                      setBookingDates(nextDates);
                      setBookingErrors((errors) => ({ ...errors, quantity: '' }));
                      setAvailabilityStatus(
                        nextDates.startDate >= initialDate &&
                          nextDates.endDate > nextDates.startDate &&
                          nextDates.quantity <= item.availableQuantity
                          ? 'checking'
                          : 'idle',
                      );
                    }}
                    className={`mt-2 h-12 w-full rounded-xl border px-3 font-normal ${bookingErrors.quantity ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  <span id="booking-quantity-error" className="block min-h-4 text-xs font-normal text-red-600" role="alert">{bookingErrors.quantity || ''}</span>
                </label>
                <label className="text-sm font-semibold">
                  Contact number
                  <input
                    required
                    aria-invalid={!!bookingErrors.contactNumber}
                    aria-describedby="booking-contactNumber-error"
                    name="contactNumber"
                    type="tel"
                    pattern="[0-9+() -]{7,20}"
                    onChange={() => setBookingErrors((errors) => ({ ...errors, contactNumber: '' }))}
                    className={`mt-2 h-12 w-full rounded-xl border px-3 font-normal ${bookingErrors.contactNumber ? 'border-red-500' : 'border-slate-200'}`}
                    placeholder="01XXXXXXXXX"
                  />
                  <span id="booking-contactNumber-error" className="block min-h-4 text-xs font-normal text-red-600" role="alert">{bookingErrors.contactNumber || ''}</span>
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  Delivery address
                  <input
                    required
                    aria-invalid={!!bookingErrors.deliveryAddress}
                    aria-describedby="booking-deliveryAddress-error"
                    name="deliveryAddress"
                    onChange={() => setBookingErrors((errors) => ({ ...errors, deliveryAddress: '' }))}
                    className={`mt-2 h-12 w-full rounded-xl border px-3 font-normal ${bookingErrors.deliveryAddress ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  <span id="booking-deliveryAddress-error" className="block min-h-4 text-xs font-normal text-red-600" role="alert">{bookingErrors.deliveryAddress || ''}</span>
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  Additional notes <span className="font-normal text-slate-400">(optional)</span>
                  <textarea
                    name="notes"
                    rows={2}
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
                  />
                </label>
                <div className="rounded-2xl bg-[#edf4f7] p-4 sm:col-span-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Rental duration</span>
                    <strong>
                      {rentalUnits
                        ? `${rentalUnits} day${rentalUnits === 1 ? '' : 's'} · ${billedUnits} ${rentalUnit}${billedUnits === 1 ? '' : 's'}`
                        : 'Choose dates'}
                    </strong>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Quantity</span>
                    <strong>{bookingDates.quantity}</strong>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#d5e4eb] pt-3">
                    <span className="font-bold">Estimated total</span>
                    <strong className="text-xl">৳{estimatedTotal.toLocaleString('en-BD')}</strong>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    The server confirms the final rental amount when the booking is submitted.
                  </p>
                </div>
                <button
                  disabled={busy || availabilityStatus === 'checking' || availabilityStatus === 'unavailable'}
                  className="rounded-xl bg-[#263b49] px-5 py-3.5 font-bold text-white disabled:cursor-wait disabled:opacity-50 sm:col-span-2"
                >
                  {busy ? 'Submitting booking…' : availabilityStatus === 'checking' ? 'Checking dates…' : 'Confirm booking request'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
