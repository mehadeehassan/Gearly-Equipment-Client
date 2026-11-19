import { EquipmentSkeleton } from '@/components/shared/Skeletons';
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <div className="mb-8 h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <EquipmentSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
