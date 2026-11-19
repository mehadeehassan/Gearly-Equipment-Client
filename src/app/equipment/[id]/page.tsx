import { EquipmentDetailActions } from '@/components/EquipmentDetailActions';
import { publicFetch } from '@/lib/api';
import { auth } from '@/lib/auth';
import type { Equipment } from '@/types';
import { headers } from 'next/headers';
import Link from 'next/link';
import { EquipmentImageReveal } from '@/components/EquipmentImageReveal';
import { notFound, redirect } from 'next/navigation';
export default async function EquipmentDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/login?redirect=/equipment/${id}`);
  const role = (session.user as unknown as { role?: string }).role || 'customer';
  const data = await publicFetch<{ equipment: Equipment }>(`/equipment/${id}`).catch(() =>
    notFound(),
  );
  const item = data.equipment;
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <Link href="/equipment" className="text-sm font-semibold text-slate-500 hover:text-[#31566b]">
        ← Back to equipment
      </Link>
      <div className="mt-7 grid items-start gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-10">
        <EquipmentImageReveal image={item.image} title={item.title} />
        <div className="py-2">
          <span className="rounded-full bg-[#dcecf5] px-4 py-2 text-xs font-bold text-[#31566b]">
            {item.category}
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">{item.title}</h1>
          <p className="mt-4 leading-7 text-slate-500">{item.description}</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            {[
              ['Location', item.location],
              ['Rental type', item.rentalType],
              ['Available quantity', String(item.availableQuantity)],
              ['Condition', item.condition || 'Not specified'],
              ['Brand', item.brand || 'Not specified'],
              ['Model', item.model || 'Not specified'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white p-4">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-1 font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 border-t border-slate-200 pt-6">
            <strong className="text-3xl">৳{Number(item.price).toLocaleString('en-BD')}</strong>
            <span className="text-slate-500"> / {item.rentalType}</span>
            <p className="mt-2 text-sm text-slate-500">
              Listed by {item.ownerName || 'Equipment owner'}
            </p>
            {role === 'customer' || role === 'renter' ? (
              <EquipmentDetailActions item={item} userId={session.user.id} />
            ) : (
              <p className="mt-6 rounded-2xl bg-[#edf4f7] p-4 text-sm text-slate-600">
                Equipment booking and favorites are available to customer accounts.
              </p>
            )}
          </div>
          {item.terms && (
            <div className="mt-8 rounded-2xl bg-[#edf4f7] p-5">
              <h3 className="font-bold">Rental terms & conditions</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {item.terms}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
