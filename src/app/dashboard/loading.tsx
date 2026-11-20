export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="mb-8 space-y-3">
        <div className="h-3 w-32 rounded bg-slate-200" />
        <div className="h-10 w-64 rounded-xl bg-slate-200" />
        <div className="h-4 w-52 rounded bg-slate-100" />
      </div>
      <section className="space-y-4 rounded-3xl bg-white p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-slate-100" />
        ))}
      </section>
    </div>
  );
}
