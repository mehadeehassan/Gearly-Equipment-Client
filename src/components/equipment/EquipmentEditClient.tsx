'use client';

import { apiFetch, ApiRequestError } from '@/lib/api';
import { notify as toast } from '@/lib/toast';
import type { Equipment } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ImageUpload } from '@/components/shared/ImageUpload';

export function EquipmentEditClient({
  equipmentId,
  userId,
}: {
  equipmentId: string;
  userId: string;
}) {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const submitLock = useRef(false);
  const errorId = (name: string) => `edit-equipment-${name}-error`;
  const inputClass = (name: string) => `mt-2 h-12 w-full rounded-xl border px-3 font-normal ${fieldErrors[name] ? 'border-red-500' : 'border-slate-200'}`;
  const showError = (name: string) => <span id={errorId(name)} className="block min-h-4 text-xs font-normal text-red-600" role="alert">{fieldErrors[name] || ''}</span>;
  const fieldProps = (name: string) => ({
    'aria-invalid': Boolean(fieldErrors[name]),
    'aria-describedby': errorId(name),
    onChange: () => setFieldErrors((errors) => ({ ...errors, [name]: '' })),
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch<{ equipment: Equipment }>(
        `/owner/equipment/${equipmentId}`,
        {},
        userId,
      );
      setEquipment(result.equipment);
      setImage(result.equipment.image || '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load equipment');
    } finally {
      setLoading(false);
    }
  }, [equipmentId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current || saving) return;
    const form = new FormData(event.currentTarget);
    const errors: Record<string, string> = {};
    for (const name of ['title', 'category', 'price', 'rentalType', 'location', 'availableQuantity', 'description']) {
      if (!String(form.get(name) || '').trim()) errors[name] = 'This field is required.';
    }
    if (form.get('price') && Number(form.get('price')) <= 0) errors.price = 'Enter a price greater than zero.';
    if (form.get('availableQuantity') && Number(form.get('availableQuantity')) < 0) errors.availableQuantity = 'Quantity cannot be negative.';
    if (!image) errors.image = 'Add an equipment image before saving.';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    setFieldErrors({});
    submitLock.current = true;
    const payload = Object.fromEntries(form.entries());
    payload.price = String(Number(payload.price));
    payload.availableQuantity = String(Number(payload.availableQuantity));
    payload.image = image;
    setSaving(true);
    try {
      await apiFetch(
        `/owner/equipment/${equipmentId}`,
        { method: 'PATCH', body: JSON.stringify(payload) },
        userId,
      );
      toast.success('Equipment updated and sent for review');
      router.push('/dashboard/my-equipment');
      router.refresh();
    } catch (cause) {
      if (cause instanceof ApiRequestError && Object.keys(cause.fieldErrors).length) {
        const mapped = Object.fromEntries(Object.entries(cause.fieldErrors).map(([key, value]) => [key.split('.').pop()!.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), Array.isArray(value) ? value.join(', ') : value]));
        const known = Object.fromEntries(Object.entries(mapped).filter(([key]) => ['title', 'category', 'price', 'rentalType', 'location', 'availableQuantity', 'brand', 'model', 'condition', 'description', 'terms', 'image'].includes(key)));
        if (Object.keys(known).length) {
          setFieldErrors(known);
          toast.error(Object.values(known)[0]);
        } else toast.error(cause.message || 'Unable to save equipment. Please try again.');
      } else {
        toast.error(cause instanceof TypeError ? 'Network error. Check your connection and try again.' : cause instanceof Error ? cause.message : 'Unable to save equipment');
      }
    } finally {
      submitLock.current = false;
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500">
        Loading equipment details…
      </div>
    );
  if (error || !equipment)
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-8">
        <h1 className="text-xl font-bold">Unable to load equipment</h1>
        <p className="mt-2 text-sm text-slate-600">{error || 'Equipment not found.'}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl bg-[#263b49] px-4 py-2.5 text-sm font-bold text-white"
          >
            Try again
          </button>
          <Link
            href="/dashboard/my-equipment"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
          >
            Back to My Equipment
          </Link>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard/my-equipment"
        className="text-sm font-semibold text-slate-500 hover:text-blue-deep"
      >
        ← Back to My Equipment
      </Link>
      <div className="mb-6 mt-5">
        <p className="text-xs font-bold tracking-[.16em] text-[#6c91a7]">OWNER LISTING</p>
        <h1 className="mt-2 text-3xl font-black">Edit equipment</h1>
        <p className="mt-2 text-sm text-slate-500">
          Changes to a listing are sent for review before publication.
        </p>
      </div>
      <form
        onSubmit={save}
        noValidate
        className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-7"
      >
        <label className="text-sm font-semibold">
          Equipment title
          <input
            required
            name="title"
            defaultValue={equipment.title}
            maxLength={120}
            {...fieldProps('title')}
            className={inputClass('title')}
          />
          {showError('title')}
        </label>
        <label className="text-sm font-semibold">
          Category
          <select
            required
            {...fieldProps('category')}
            name="category"
            defaultValue={equipment.category}
            className={inputClass('category')}
          >
            {[
              'Construction Equipment',
              'Photography Equipment',
              'Vehicles & Transportation',
              'Agriculture Equipment',
              'Electronics',
              'Event Equipment',
            ].map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          {showError('category')}
        </label>
        <label className="text-sm font-semibold">
          Price
          <input
            required
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={equipment.price}
            {...fieldProps('price')}
            className={inputClass('price')}
          />
          {showError('price')}
        </label>
        <label className="text-sm font-semibold">
          Rental type
          <select
            required
            {...fieldProps('rentalType')}
            name="rentalType"
            defaultValue={equipment.rentalType}
            className={inputClass('rentalType')}
          >
            {['Daily', 'Weekly', 'Monthly'].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          {showError('rentalType')}
        </label>
        <label className="text-sm font-semibold">
          Location
          <input
            required
            name="location"
            defaultValue={equipment.location}
            {...fieldProps('location')}
            className={inputClass('location')}
          />
          {showError('location')}
        </label>
        <label className="text-sm font-semibold">
          Available quantity
          <input
            required
            name="availableQuantity"
            type="number"
            min="0"
            step="1"
            defaultValue={equipment.availableQuantity}
            {...fieldProps('availableQuantity')}
            className={inputClass('availableQuantity')}
          />
          {showError('availableQuantity')}
        </label>
        <label className="text-sm font-semibold">
          Brand
          <input
            name="brand"
            defaultValue={equipment.brand || ''}
            {...fieldProps('brand')}
            className={inputClass('brand')}
          />
          {showError('brand')}
        </label>
        <label className="text-sm font-semibold">
          Model
          <input
            name="model"
            defaultValue={equipment.model || ''}
            {...fieldProps('model')}
            className={inputClass('model')}
          />
          {showError('model')}
        </label>
        <label className="text-sm font-semibold">
          Condition
          <input
            name="condition"
            defaultValue={equipment.condition || ''}
            {...fieldProps('condition')}
            className={inputClass('condition')}
          />
          {showError('condition')}
        </label>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold">
            Description
            <textarea
              required
              {...fieldProps('description')}
              name="description"
              defaultValue={equipment.description}
              rows={5}
              className={`mt-2 w-full rounded-xl border p-3 font-normal ${fieldErrors.description ? 'border-red-500' : 'border-slate-200'}`}
            />
            {showError('description')}
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold">
            Rental terms
            <textarea
              name="terms"
              defaultValue={equipment.terms || ''}
              {...fieldProps('terms')}
              rows={3}
              className={`mt-2 w-full rounded-xl border p-3 font-normal ${fieldErrors.terms ? 'border-red-500' : 'border-slate-200'}`}
            />
            {showError('terms')}
          </label>
        </div>
        <div className="sm:col-span-2">
          <ImageUpload value={image} onChange={(value) => { setImage(value); setFieldErrors((errors) => ({ ...errors, image: '' })); }} invalid={Boolean(fieldErrors.image)} errorId={errorId('image')} />
          {showError('image')}
        </div>
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            disabled={saving}
            className="rounded-xl bg-[#263b49] px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <Link
            href="/dashboard/my-equipment"
            className="rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
