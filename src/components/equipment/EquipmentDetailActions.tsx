'use client';

import { apiFetch, ApiRequestError } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { notify as toast } from '@/lib/toast';
import type { Equipment } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ChevronLeft, ChevronRight, Heart, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type Favorite = { equipmentId?: string; equipment?: { _id?: string } };
type Availability = { available: boolean; remainingQuantity: number };
type MonthlyAvailability = {
  month: string;
  totalQuantity: number;
  days: { date: string; bookedQuantity: number; availableQuantity: number }[];
};

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
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [monthlyAvailability, setMonthlyAvailability] = useState<MonthlyAvailability | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(false);
  const [calendarRetry, setCalendarRetry] = useState(0);
  const monthCache = useRef<Record<string, MonthlyAvailability>>({});
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const cached = monthCache.current[calendarMonth];
    if (cached) {
      setMonthlyAvailability(cached);
      setCalendarError(false);
      setCalendarLoading(false);
      return;
    }
    const controller = new AbortController();
    setCalendarLoading(true);
    setCalendarError(false);
    const query = new URLSearchParams({ month: calendarMonth });
    apiFetch<MonthlyAvailability>(
      `/equipment/${item._id}/monthly-availability?${query.toString()}`,
      { signal: controller.signal },
      userId,
    ).then((result) => {
      if (controller.signal.aborted) return;
      const valid = result?.month === calendarMonth && Array.isArray(result.days) &&
        result.days.every((day) => typeof day.date === 'string' && Number.isFinite(day.availableQuantity));
      if (!valid) throw new Error('Invalid monthly availability response');
      monthCache.current[calendarMonth] = result;
      setMonthlyAvailability(result);
    }).catch(() => {
      if (!controller.signal.aborted) {
        setMonthlyAvailability(null);
        setCalendarError(true);
      }
    }).finally(() => {
      if (!controller.signal.aborted) setCalendarLoading(false);
    });
    return () => controller.abort();
  }, [open, item._id, userId, calendarMonth, calendarRetry]);

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
  const [calendarYear, calendarMonthNumber] = calendarMonth.split('-').map(Number);
  const calendarDayCount = new Date(Date.UTC(calendarYear, calendarMonthNumber, 0)).getUTCDate();
  const calendarOffset = new Date(Date.UTC(calendarYear, calendarMonthNumber - 1, 1)).getUTCDay();
  const availabilityByDate = new Map(
    (monthlyAvailability?.month === calendarMonth ? monthlyAvailability.days : []).map((day) => [day.date, day]),
  );
  const calendarTitle = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(calendarYear, calendarMonthNumber - 1, 1)));

  function selectCalendarDate(date: string) {
    const available = availabilityByDate.get(date)?.availableQuantity;
    if (date < initialDate || available === undefined || available < bookingDates.quantity) return;
    let nextDates: typeof bookingDates;
    if (!bookingDates.startDate || bookingDates.endDate || date <= bookingDates.startDate) {
      nextDates = { ...bookingDates, startDate: date, endDate: '' };
    } else {
      nextDates = { ...bookingDates, endDate: date };
    }
    setBookingDates(nextDates);
    setBookingErrors((errors) => ({ ...errors, startDate: '', endDate: '' }));
    setAvailabilityStatus(
      nextDates.startDate >= initialDate && nextDates.endDate > nextDates.startDate
        ? 'checking'
        : 'idle',
    );
  }

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
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-2 sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-title"
              className="my-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-3xl"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between border-b border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
                <div>
                  <p className="text-xs font-bold tracking-[.16em] text-[#6c91a7]">
                    RESERVE EQUIPMENT
                  </p>
                  <h2 id="booking-title" className="mt-1 text-xl font-black sm:text-2xl">
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
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"
                >
                  <X size={19} />
                </button>
              </div>
              <div className="mx-3 mt-3 flex shrink-0 items-center gap-3 rounded-xl bg-[#edf4f7] p-2.5 sm:mx-5 sm:mt-4">
                <Image
                  src={item.image || '/icon.svg'}
                  alt=""
                  width={80}
                  height={80}
                  className="h-11 w-11 rounded-lg object-cover sm:h-12 sm:w-12"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.rentalType} rental · {item.availableQuantity} available
                  </p>
                </div>
                <p className="shrink-0 text-right font-black">
                  <span className="text-sm">৳{Number(item.price).toLocaleString()}</span>
                  <span className="block text-[10px] font-normal text-slate-500">per {rentalUnit}</span>
                </p>
              </div>
              <form onSubmit={book} noValidate className="min-h-0 overflow-y-auto">
                <div className="grid gap-4 p-3 sm:gap-5 sm:p-5 lg:grid-cols-[minmax(280px,0.9fr)_minmax(340px,1.1fr)]">
                <section aria-label="Equipment availability calendar" className="h-fit rounded-xl border border-slate-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Availability</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500">Choose a start date, then an end date.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label="Previous month" onClick={() => setCalendarMonth((month) => {
                        const [year, number] = month.split('-').map(Number);
                        return new Date(Date.UTC(year, number - 2, 1)).toISOString().slice(0, 7);
                      })} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50">
                        <ChevronLeft size={17} aria-hidden="true" />
                      </button>
                      <p className="min-w-24 text-center text-xs font-semibold" aria-live="polite">{calendarTitle}</p>
                      <button type="button" aria-label="Next month" onClick={() => setCalendarMonth((month) => {
                        const [year, number] = month.split('-').map(Number);
                        return new Date(Date.UTC(year, number, 1)).toISOString().slice(0, 7);
                      })} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50">
                        <ChevronRight size={17} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  {calendarError ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                      <span>Availability calendar could not load. Try again or use the date fields below.</span>
                      <button type="button" onClick={() => setCalendarRetry((retry) => retry + 1)} className="font-bold underline">Retry</button>
                    </div>
                  ) : calendarLoading ? (
                    <p className="mt-3 py-6 text-center text-sm text-slate-500" aria-live="polite">Loading availability…</p>
                  ) : (
                    <>
                      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[9px] font-semibold text-slate-500 sm:text-[10px]">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="py-0.5">{day}</div>)}
                        {Array.from({ length: calendarOffset }, (_, index) => <div key={`blank-${index}`} aria-hidden="true" />)}
                        {Array.from({ length: calendarDayCount }, (_, index) => {
                          const dayNumber = index + 1;
                          const date = `${calendarMonth}-${String(dayNumber).padStart(2, '0')}`;
                          const info = availabilityByDate.get(date);
                          const enough = info !== undefined && info.availableQuantity >= bookingDates.quantity;
                          const past = date < initialDate;
                          const selectedStart = date === bookingDates.startDate;
                          const selectedEnd = date === bookingDates.endDate;
                          const inRange = !!bookingDates.startDate && !!bookingDates.endDate && date > bookingDates.startDate && date < bookingDates.endDate;
                          const status = !info ? 'Availability unknown' : info.availableQuantity === 0 ? 'Full' : `${info.availableQuantity} left`;
                          const statusColor = !info ? 'text-slate-400' : info.availableQuantity === 0 ? 'text-rose-600' : info.availableQuantity < bookingDates.quantity ? 'text-amber-700' : 'text-emerald-700';
                          const availabilityDot = !info ? 'bg-slate-300' : info.availableQuantity === 0 ? 'bg-rose-500' : info.availableQuantity < bookingDates.quantity ? 'bg-amber-500' : 'bg-emerald-500';
                          return (
                            <button
                              key={date}
                              type="button"
                              disabled={past || !enough}
                              onClick={() => selectCalendarDate(date)}
                              aria-label={`${new Intl.DateTimeFormat('en', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))}: ${status}${enough ? ', available for selected quantity' : ''}`}
                              aria-pressed={selectedStart || selectedEnd}
                              className={`min-h-10 rounded-md border px-0.5 py-1 text-center transition disabled:cursor-not-allowed disabled:opacity-55 sm:min-h-11 ${selectedStart || selectedEnd ? 'border-[#263b49] bg-[#263b49] text-white' : inRange ? 'border-sky-200 bg-sky-50' : info?.availableQuantity === 0 ? 'border-rose-100 bg-rose-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                            >
                              <span className="block text-[11px] font-bold leading-none sm:text-xs">{dayNumber}</span>
                              <span className={`mt-1 inline-flex max-w-full items-center justify-center gap-1 truncate text-[8px] leading-none sm:text-[9px] ${selectedStart || selectedEnd ? 'text-white/90' : statusColor}`}>
                                {!selectedStart && !selectedEnd && <i aria-hidden="true" className={`h-1 w-1 shrink-0 rounded-full ${availabilityDot}`} />}
                                {info ? info.availableQuantity === 0 ? 'Full' : `${info.availableQuantity} left` : '—'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[9px] text-slate-600 sm:text-[10px]" aria-label="Availability legend">
                        <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Enough</span>
                        <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-amber-500" />Limited</span>
                        <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-rose-500" />Full</span>
                      </div>
                    </>
                  )}
                </section>
                <div className="grid content-start gap-3 sm:grid-cols-2 sm:gap-4">
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
                      if (event.target.value) setCalendarMonth(event.target.value.slice(0, 7));
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
                    className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-sm font-normal ${bookingErrors.startDate ? 'border-red-500' : 'border-slate-200'}`}
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
                      if (event.target.value) setCalendarMonth(event.target.value.slice(0, 7));
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
                    className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-sm font-normal ${bookingErrors.endDate ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  <span id="booking-endDate-error" className="block min-h-4 text-xs font-normal text-red-600" role="alert">{bookingErrors.endDate || ''}</span>
                </label>
                {availabilityStatus === 'unavailable' && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 sm:col-span-2"
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
                    className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-sm font-normal ${bookingErrors.quantity ? 'border-red-500' : 'border-slate-200'}`}
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
                    className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-sm font-normal ${bookingErrors.contactNumber ? 'border-red-500' : 'border-slate-200'}`}
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
                    className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-sm font-normal ${bookingErrors.deliveryAddress ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  <span id="booking-deliveryAddress-error" className="block min-h-4 text-xs font-normal text-red-600" role="alert">{bookingErrors.deliveryAddress || ''}</span>
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  Additional notes <span className="font-normal text-slate-400">(optional)</span>
                  <textarea
                    name="notes"
                    rows={2}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal"
                  />
                </label>
                <div className="rounded-xl bg-[#edf4f7] p-3 sm:col-span-2">
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
                  <div className="mt-2 flex items-center justify-between border-t border-[#d5e4eb] pt-2">
                    <span className="font-bold">Estimated total</span>
                    <strong className="text-lg">৳{estimatedTotal.toLocaleString('en-BD')}</strong>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-500">
                    The server confirms the final rental amount when the booking is submitted.
                  </p>
                </div>
                <button
                  disabled={busy || availabilityStatus === 'checking' || availabilityStatus === 'unavailable'}
                  className="rounded-lg bg-[#263b49] px-5 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-50 sm:col-span-2"
                >
                  {busy ? 'Submitting booking…' : availabilityStatus === 'checking' ? 'Checking dates…' : 'Confirm booking request'}
                </button>
                </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
