const statusStyles: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  paid: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  confirmed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  ongoing: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-900 ring-amber-200',
  unpaid: 'bg-amber-50 text-amber-900 ring-amber-200',
  pending_approval: 'bg-amber-50 text-amber-900 ring-amber-200',
  pending_payment: 'bg-orange-50 text-orange-900 ring-orange-200',
  payment_expired: 'bg-slate-100 text-slate-700 ring-slate-200',
  payment_failed: 'bg-rose-50 text-rose-800 ring-rose-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
  failed: 'bg-rose-50 text-rose-800 ring-rose-200',
  cancelled: 'bg-slate-100 text-slate-700 ring-slate-200',
  canceled: 'bg-slate-100 text-slate-700 ring-slate-200',
  expired: 'bg-slate-100 text-slate-700 ring-slate-200',
  inactive: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function StatusBadge({ status }: { status?: string }) {
  const normalized = String(status || 'unknown').toLowerCase().replaceAll(' ', '_').replaceAll('-', '_');
  const label = normalized.split('_').map((part) => part ? part[0].toUpperCase() + part.slice(1) : '').join(' ');
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[normalized] || 'bg-slate-50 text-slate-700 ring-slate-200'}`}>{label}</span>;
}
