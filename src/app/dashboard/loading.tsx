export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-5 py-10 lg:px-8">
      <div className="mb-8 space-y-3">
        <div className="h-3 w-32 rounded bg-slate-200" />
        <div className="h-10 w-64 rounded-xl bg-slate-200" />
        <div className="h-4 w-52 rounded bg-slate-100" />
      </div>
      <div className="grid gap-7 lg:grid-cols-[230px_1fr]">
        <aside className="h-80 rounded-3xl bg-white p-4">
          <div className="h-20 rounded-2xl bg-slate-100" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-slate-100" />
            ))}
          </div>
        </aside>
        <section className="space-y-4 rounded-3xl bg-white p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100" />
          ))}
        </section>
      </div>
    </div>
  );
}
