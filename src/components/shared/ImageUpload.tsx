'use client';
import { notify as toast } from '@/lib/toast';
import { CheckCircle2, ImagePlus, LoaderCircle } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

/** Uploads the selected image to ImgBB and returns its hosted URL. */
export function ImageUpload({
  value,
  onChange,
  label = 'Equipment image',
  invalid = false,
  errorId,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  invalid?: boolean;
  errorId?: string;
}) {
  const [busy, setBusy] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5 MB or smaller');
      return;
    }
    const key = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!key) {
      toast.error('Add NEXT_PUBLIC_IMGBB_API_KEY to .env.local first');
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`,
        { method: 'POST', body },
      );
      const result = await response.json();
      if (!response.ok || !result.success || !result.data?.url)
        throw new Error(result.error?.message || 'Image upload failed');
      onChange(result.data.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to upload image');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <span className="block text-sm font-semibold">{label}</span>
      <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed bg-white p-4 transition hover:border-[#86a8b9] hover:bg-[#f5f9fb] ${invalid ? 'border-red-500' : 'border-slate-300'}`}>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e7f0f5] text-[#31566b]">
          {busy ? (
            <LoaderCircle className="animate-spin" />
          ) : value ? (
            <CheckCircle2 />
          ) : (
            <ImagePlus />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">
            {busy ? 'Uploading image…' : value ? 'Image uploaded' : 'Choose an image'}
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            JPG, PNG or WEBP · Maximum 5 MB · Uploaded to ImgBB
          </span>
        </span>
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          aria-invalid={invalid}
          aria-describedby={errorId}
          className="sr-only"
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </label>
      {value && (
        <div className="flex items-center gap-3">
          <Image
            src={value}
            alt="Uploaded preview"
            width={80}
            height={64}
            className="h-16 w-20 rounded-xl border border-slate-200 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs font-semibold text-rose-600"
          >
            Remove image
          </button>
        </div>
      )}
    </div>
  );
}
