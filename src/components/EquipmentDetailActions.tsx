'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notify as toast } from '@/lib/toast';
import { apiFetch } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { Equipment } from '@/types';

type Favorite = { equipmentId?: string; equipment?: { _id?: string } };

export function EquipmentDetailActions({ item }: { item: Equipment }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(true);
  const [favoriteLoadError, setFavoriteLoadError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookingDates, setBookingDates] = useState({ startDate: '', endDate: '', quantity: 1 });
  const router = useRouter();

  useEffect(() => {
    let active = true;
    apiFetch<{ favorites: Favorite[] }>('/favorites')
      .then(({ favorites }) => {
        if (active) setIsFavorite((favorites || []).some((favorite) => (favorite.equipmentId || favorite.equipment?._id) === item._id));
      })
      .catch(() => { if (active) { setIsFavorite(false); setFavoriteLoadError(true); toast.error('Could not load your saved favorites', { id: `favorite-load-${item._id}` }); } })
      .finally(() => { if (active) setFavoriteBusy(false); });
    return () => { active = false; };
  }, [item._id]);

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
      await apiFetch(`/favorites/${item._id}`, { method: isFavorite ? 'DELETE' : 'POST' });
      setIsFavorite(!isFavorite);
      setFavoriteLoadError(false);
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites', { id: `favorite-${item._id}` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update favorite', { id: `favorite-error-${item._id}` });
    } finally { setFavoriteBusy(false); }
  }

  const rentalUnit = item.rentalType === 'Weekly' ? 'week' : item.rentalType === 'Monthly' ? 'month' : 'day';
  const initialDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const rentalUnits = bookingDates.startDate && bookingDates.endDate
    ? Math.max(0, Math.ceil((new Date(bookingDates.endDate).getTime() - new Date(bookingDates.startDate).getTime()) / 86400000))
    : 0;
  const billedUnits = rentalUnits ? item.rentalType === 'Weekly' ? Math.ceil(rentalUnits / 7) : item.rentalType === 'Monthly' ? Math.ceil(rentalUnits / 30) : rentalUnits : 0;
  const estimatedTotal = Number(item.price) * billedUnits * bookingDates.quantity;

  async function book(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!formElement.reportValidity()) return;
    const form = new FormData(formElement);
    const startDate = String(form.get('startDate') || '');
    const endDate = String(form.get('endDate') || '');
    const quantity = Number(form.get('quantity'));
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('End date must be after the start date', { id: 'booking-date-validation' });
      return;
    }
    if (quantity < 1 || quantity > item.availableQuantity) {
      toast.error('Choose a quantity within the available amount', { id: 'booking-quantity-validation' });
      return;
    }
    setBusy(true);
    const payload = { equipmentId: item._id, startDate, endDate, quantity, contactNumber: form.get('contactNumber'), deliveryAddress: form.get('deliveryAddress'), notes: form.get('notes') };
    try {
      await apiFetch('/bookings', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Booking request created', { id: 'booking-created' });
      setOpen(false);
      router.push('/dashboard/my-rentals');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Booking failed', { id: 'booking-create-error' });
    } finally { setBusy(false); }
  }

  return <div className="mt-7 flex flex-wrap gap-3">
    <button type="button" onClick={toggleFavorite} disabled={favoriteBusy} aria-pressed={isFavorite} className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold transition disabled:opacity-60 ${isFavorite ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white hover:bg-[#edf4f7]'}`}>
      <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />{favoriteBusy ? 'Loading…' : favoriteLoadError ? 'Try saving favorite' : isFavorite ? 'Saved to favorites' : 'Add to favorites'}
    </button>
    <button type="button" disabled={item.availableQuantity < 1} onClick={() => setOpen(true)} className="rounded-2xl bg-[#263b49] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-40">Book now ↗</button>
    <AnimatePresence>
      {open && <motion.div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/55 p-3 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
        <motion.div role="dialog" aria-modal="true" aria-labelledby="booking-title" className="my-auto max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.2 }}>
          <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-7"><div><p className="text-xs font-bold tracking-[.16em] text-[#6c91a7]">RESERVE EQUIPMENT</p><h2 id="booking-title" className="mt-2 text-2xl font-black">Book this equipment</h2><p className="mt-1 text-sm text-slate-500">Review the rental details and dates.</p></div><button type="button" aria-label="Close booking form" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600"><X size={19}/></button></div>
          <div className="m-5 flex items-center gap-4 rounded-2xl bg-[#edf4f7] p-3 sm:m-7 sm:mb-0 sm:p-4"><img src={item.image || '/icon.svg'} alt="" className="h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20"/><div className="min-w-0 flex-1"><p className="truncate font-bold">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.rentalType} rental · {item.availableQuantity} available</p></div><p className="shrink-0 text-right font-black">৳{Number(item.price).toLocaleString()}<span className="block text-xs font-normal text-slate-500">per {rentalUnit}</span></p></div>
          <form onSubmit={book} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
            <label className="text-sm font-semibold">Start date<input required name="startDate" type="date" min={initialDate} value={bookingDates.startDate} onChange={(event) => setBookingDates((value) => ({ ...value, startDate: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"/></label>
            <label className="text-sm font-semibold">End date<input required name="endDate" type="date" min={bookingDates.startDate || initialDate} value={bookingDates.endDate} onChange={(event) => setBookingDates((value) => ({ ...value, endDate: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"/></label>
            <label className="text-sm font-semibold">Quantity<input required name="quantity" type="number" min="1" max={item.availableQuantity} value={bookingDates.quantity} onChange={(event) => setBookingDates((value) => ({ ...value, quantity: Math.max(1, Number(event.target.value) || 1) }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"/></label>
            <label className="text-sm font-semibold">Contact number<input required name="contactNumber" type="tel" pattern="[0-9+() -]{7,20}" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" placeholder="01XXXXXXXXX"/></label>
            <label className="text-sm font-semibold sm:col-span-2">Delivery address<input required name="deliveryAddress" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"/></label>
            <label className="text-sm font-semibold sm:col-span-2">Additional notes <span className="font-normal text-slate-400">(optional)</span><textarea name="notes" rows={2} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"/></label>
            <div className="rounded-2xl bg-[#edf4f7] p-4 sm:col-span-2"><div className="flex items-center justify-between text-sm text-slate-600"><span>Rental duration</span><strong>{rentalUnits ? `${rentalUnits} day${rentalUnits === 1 ? '' : 's'} · ${billedUnits} ${rentalUnit}${billedUnits === 1 ? '' : 's'}` : 'Choose dates'}</strong></div><div className="mt-2 flex items-center justify-between text-sm text-slate-600"><span>Quantity</span><strong>{bookingDates.quantity}</strong></div><div className="mt-3 flex items-center justify-between border-t border-[#d5e4eb] pt-3"><span className="font-bold">Estimated total</span><strong className="text-xl">৳{estimatedTotal.toLocaleString('en-BD')}</strong></div><p className="mt-2 text-xs text-slate-500">The server confirms the final rental amount when the booking is submitted.</p></div>
            <button disabled={busy} className="rounded-xl bg-[#263b49] px-5 py-3.5 font-bold text-white disabled:cursor-wait disabled:opacity-50 sm:col-span-2">{busy ? 'Submitting booking…' : 'Confirm booking request'}</button>
          </form>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
