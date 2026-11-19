import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { Reveal } from '@/components/shared/Reveal';
import { publicFetch } from '@/lib/api';
import type { Equipment } from '@/types';
import Link from 'next/link';

export async function FeaturedEquipmentSection() {
  let items: Equipment[] = [];
  let error = '';

  try {
    const data = await publicFetch<{ equipment: Equipment[] }>('/equipment/featured');
    items = data.equipment || [];
  } catch (fetchError) {
    error = fetchError instanceof Error ? fetchError.message : 'Unable to load equipment';
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div>
        <p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">CURATED FOR YOU</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight">Gear worth <span className="font-serif font-normal italic text-[#6c91a7]">getting.</span></h2>
        <p className="mt-2 text-slate-500">The latest approved listings from our community.</p>
      </div><Link href="/equipment" className="text-sm font-bold text-blue-deep">See all equipment ↗</Link></div>
      {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">Equipment could not be loaded. Please check your connection and try again.</div> : items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.slice(0, 6).map((item) => <Reveal key={item._id}><EquipmentCard item={item} /></Reveal>)}</div>
      ) : <div className="rounded-3xl bg-white p-10 text-center text-slate-500">No approved equipment is available yet.</div>}
    </section>
  );
}
