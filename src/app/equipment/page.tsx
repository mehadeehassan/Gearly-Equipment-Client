import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { EquipmentExplorer } from '@/components/equipment/EquipmentExplorer';
import { EquipmentSkeleton } from '@/components/shared/Skeletons';
import { publicFetch } from '@/lib/api';
import type { Equipment, EquipmentResponse } from '@/types';
import Link from 'next/link';
import { Suspense } from 'react';
async function Results({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const query = new URLSearchParams();
  for (const key of [
    'search',
    'category',
    'rentalType',
    'availability',
    'sort',
    'page',
    'minPrice',
    'maxPrice',
  ])
    if (p[key]) query.set(key, p[key]!);
  query.set('limit', '12');
  let data: EquipmentResponse = { equipment: [], total: 0, page: 1, totalPages: 1 };
  let error = '';
  try {
    data = await publicFetch<EquipmentResponse>(`/equipment?${query.toString()}`);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unable to load equipment';
  }
  return (
    <>
      <EquipmentExplorer total={data.total || 0} />
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
          {error}. Make sure the API server is running.
        </div>
      ) : data.equipment?.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.equipment.map((item: Equipment) => (
            <EquipmentCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-xl font-bold">No equipment found</h3>
          <p className="mt-2 text-sm text-slate-500">Try another search or remove some filters.</p>
          <Link href="/equipment" className="mt-5 inline-block font-bold text-blue-deep">
            Clear all filters ↗
          </Link>
        </div>
      )}
      <div className="mt-10 flex items-center justify-center gap-6 text-sm">
        <Link
          aria-disabled={data.page <= 1}
          className={
            data.page <= 1 ? 'pointer-events-none text-slate-300' : 'font-bold text-blue-deep'
          }
          href={`/equipment?${new URLSearchParams({ ...Object.fromEntries(query), page: String(Math.max(1, data.page - 1)) })}`}
        >
          ← Previous
        </Link>
        <span className="text-slate-500">
          Page {data.page || 1} of {data.totalPages || 1}
        </span>
        <Link
          aria-disabled={data.page >= data.totalPages}
          className={
            data.page >= data.totalPages
              ? 'pointer-events-none text-slate-300'
              : 'font-bold text-blue-deep'
          }
          href={`/equipment?${new URLSearchParams({ ...Object.fromEntries(query), page: String(Math.min(data.totalPages, data.page + 1)) })}`}
        >
          Next →
        </Link>
      </div>
    </>
  );
}
export default function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
      <p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">THE GEAR LIBRARY</p>
      <h1 className="mt-3 text-5xl font-black tracking-tight">
        Find your next{' '}
        <span className="font-serif font-normal italic text-[#6c91a7]">great tool.</span>
      </h1>
      <p className="mb-9 mt-3 text-slate-500">
        Browse dependable equipment from owners in your community.
      </p>
      <Suspense
        fallback={
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <EquipmentSkeleton key={i} />
            ))}
          </div>
        }
      >
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
