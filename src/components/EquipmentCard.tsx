import Link from 'next/link';
import type { Equipment } from '@/types';

export function EquipmentCard({ item }: { item: Equipment }) {
  return (
    <Link href={`/equipment/${item._id}`} aria-label={`View details for ${item.title}`} className="group block overflow-hidden rounded-[26px] border border-slate-200/80 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c91a7]">
      <article>
        <div className="relative block aspect-[4/3] overflow-hidden bg-[#e9eff0]">
          {item.image ? <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#e7f0f5] via-[#f2eef8] to-[#e8f0e7] text-4xl text-[#6c91a7]" aria-label="No equipment image">✳</div>}
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#31566b] backdrop-blur">{item.category}</span>
        </div>
        <div className="p-5">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-500"><span className="truncate">⌖ {item.location}</span><span className={item.availableQuantity > 0 ? 'text-emerald-700' : 'text-rose-600'}>{item.availableQuantity > 0 ? 'Available' : 'Unavailable'}</span></div>
          <h2 className="line-clamp-1 text-lg font-bold tracking-tight group-hover:text-[#31566b]">{item.title}</h2>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{item.description}</p>
          <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4"><div><strong className="text-xl">৳{Number(item.price || 0).toLocaleString('en-BD')}</strong><span className="text-xs text-slate-500"> / {item.rentalType}</span></div><span className="text-sm font-bold text-[#31566b]">Details ↗</span></div>
        </div>
      </article>
    </Link>
  );
}
