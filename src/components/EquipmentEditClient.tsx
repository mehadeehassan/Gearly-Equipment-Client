'use client';

import { apiFetch } from '@/lib/api';
import { notify as toast } from '@/lib/toast';
import type { Equipment } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ImageUpload } from './ImageUpload';

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
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.price = String(Number(payload.price));
    payload.availableQuantity = String(Number(payload.availableQuantity));
    payload.image = image;
    if (!image) {
      toast.error('Add an equipment image before saving');
      return;
    }
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
      toast.error(cause instanceof Error ? cause.message : 'Unable to save equipment');
    } finally {
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
        className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-7"
      >
        <label className="text-sm font-semibold">
          Equipment title
          <input
            required
            name="title"
            defaultValue={equipment.title}
            maxLength={120}
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          Category
          <select
            required
            name="category"
            defaultValue={equipment.category}
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"
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
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          Rental type
          <select
            required
            name="rentalType"
            defaultValue={equipment.rentalType}
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"
          >
            {['Daily', 'Weekly', 'Monthly'].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Location
          <input
            required
            name="location"
            defaultValue={equipment.location}
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"
          />
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
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          Brand
          <input
            name="brand"
            defaultValue={equipment.brand || ''}
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          Model
          <input
            name="model"
            defaultValue={equipment.model || ''}
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          Condition
          <input
            name="condition"
            defaultValue={equipment.condition || ''}
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"
          />
        </label>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold">
            Description
            <textarea
              required
              name="description"
              defaultValue={equipment.description}
              rows={5}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
            />
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold">
            Rental terms
            <textarea
              name="terms"
              defaultValue={equipment.terms || ''}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
            />
          </label>
        </div>
        <div className="sm:col-span-2">
          <ImageUpload value={image} onChange={setImage} />
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
