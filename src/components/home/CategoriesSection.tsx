import { Reveal } from '@/components/shared/Reveal';
import Link from 'next/link';

const categories = [
  ['01', 'Construction Equipment', '/equipment?category=Construction%20Equipment'],
  ['02', 'Photography Equipment', '/equipment?category=Photography%20Equipment'],
  ['03', 'Vehicles & Transportation', '/equipment?category=Vehicles%20%26%20Transportation'],
  ['04', 'Agriculture Equipment', '/equipment?category=Agriculture%20Equipment'],
  ['05', 'Electronics', '/equipment?category=Electronics'],
  ['06', 'Event Equipment', '/equipment?category=Event%20Equipment'],
];

export function CategoriesSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">FIND YOUR CATEGORY</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight">
          Whatever the job,{' '}
          <span className="font-serif font-normal italic text-[#6c91a7]">there&apos;s gear.</span>
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(([number, name, url], index) => (
          <Reveal key={name} delay={index * 0.04}>
            <Link
              href={url}
              className="group flex min-h-28 items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:bg-[#edf4f7] hover:shadow-lg"
            >
              <div>
                <span className="text-xs font-bold text-[#86a8b9]">{number}</span>
                <p className="mt-2 text-lg font-bold">{name}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f1f3f2] transition group-hover:bg-white">
                ↗
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
