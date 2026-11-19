import { EquipmentCard } from '@/components/EquipmentCard';
import { Reveal } from '@/components/Reveal';
import { ReviewCarousel } from '@/components/ReviewCarousel';
import { publicFetch } from '@/lib/api';
import type { Equipment, Review } from '@/types';
import Link from 'next/link';
const categories = [
  ['01', 'Construction Equipment', '/equipment?category=Construction%20Equipment'],
  ['02', 'Photography Equipment', '/equipment?category=Photography%20Equipment'],
  ['03', 'Vehicles & Transportation', '/equipment?category=Vehicles%20%26%20Transportation'],
  ['04', 'Agriculture Equipment', '/equipment?category=Agriculture%20Equipment'],
  ['05', 'Electronics', '/equipment?category=Electronics'],
  ['06', 'Event Equipment', '/equipment?category=Event%20Equipment'],
];

export default async function Home() {
  let items: Equipment[] = [];
  let reviews: Review[] = [];
  let equipmentError = '';
  try {
    const data = await publicFetch<{ equipment: Equipment[] }>('/equipment/featured');
    items = data.equipment || [];
  } catch (error) {
    equipmentError = error instanceof Error ? error.message : 'Unable to load equipment';
  }
  try {
    const data = await publicFetch<{ reviews: Review[] }>('/reviews');
    reviews = data.reviews || [];
  } catch {}
  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e4eee5] px-4 py-2 text-xs font-bold tracking-[.15em] text-[#456b53]">
            <span className="h-2 w-2 rounded-full bg-[#6c9877]" /> RENT SMARTER. MAKE MORE.
          </span>
          <h1 className="mt-7 text-5xl font-black leading-[1.06] tracking-[-.055em] sm:text-6xl lg:text-7xl">
            Good work starts
            <br />
            with the{' '}
            <span className="font-serif font-normal italic text-[#6c91a7]">right gear.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500">
            Find dependable equipment for your next big idea. Rent what you need, for exactly as
            long as you need it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/equipment"
              className="rounded-2xl bg-[#263b49] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-slate-300/50 transition hover:-translate-y-1"
            >
              Explore equipment ↗
            </Link>
            <Link
              href="/register"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold transition hover:bg-[#edf4f7]"
            >
              List your equipment
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#dcecf5] text-lg text-[#31566b]">
              ✳
            </span>
            <div>
              <p className="text-sm font-bold">Made for makers</p>
              <p className="text-xs text-slate-500">
                Tools, gear and people that move work forward.
              </p>
            </div>
          </div>
        </div>
        <Reveal className="relative">
          <div className="relative overflow-hidden rounded-[34px] bg-[#e6edf0] shadow-2xl shadow-slate-300/50">
            <img
              className="h-[430px] w-full object-cover sm:h-[560px]"
              src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1400"
              alt="Professional equipment in a workshop"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#172d39]/30 to-transparent" />
            <div className="absolute bottom-6 left-6 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-lg backdrop-blur">
              <p className="font-bold">✳ Ready when you are</p>
              <p className="mt-1 text-xs text-slate-500">Flexible rentals. Real people.</p>
            </div>
          </div>
          <div className="absolute -right-3 -top-4 -z-10 h-32 w-32 rounded-full bg-[#eee9f7] sm:-right-6" />
        </Reveal>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">CURATED FOR YOU</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Gear worth{' '}
              <span className="font-serif font-normal italic text-[#6c91a7]">getting.</span>
            </h2>
            <p className="mt-2 text-slate-500">The latest approved listings from our community.</p>
          </div>
          <Link href="/equipment" className="text-sm font-bold text-[#31566b]">
            See all equipment ↗
          </Link>
        </div>
        {equipmentError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
            Equipment could not be loaded. Please check your connection and try again.
          </div>
        ) : items.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 6).map((item) => (
              <Reveal key={item._id}>
                <EquipmentCard item={item} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-10 text-center text-slate-500">
            No approved equipment is available yet.
          </div>
        )}
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">FIND YOUR CATEGORY</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">
            Whatever the job,{' '}
            <span className="font-serif font-normal italic text-[#6c91a7]">there&apos;s gear.</span>
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(([n, name, url], i) => (
            <Reveal key={name} delay={i * 0.04}>
              <Link
                href={url}
                className="group flex min-h-28 items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:bg-[#edf4f7] hover:shadow-lg"
              >
                <div>
                  <span className="text-xs font-bold text-[#86a8b9]">{n}</span>
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
      <section
        id="how-it-works"
        className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-2 lg:items-center lg:px-8"
      >
        <div className="overflow-hidden rounded-[32px] bg-[#e9eff0]">
          <img
            className="h-[430px] w-full object-cover"
            src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1200"
            alt="Tools and equipment at work"
          />
        </div>
        <div>
          <p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">THE GEARLY DIFFERENCE</p>
          <h2 className="mt-4 text-5xl font-black leading-tight tracking-tight">
            Less buying.
            <br />
            <span className="font-serif font-normal italic text-[#6c91a7]">More doing.</span>
          </h2>
          <p className="mt-5 leading-7 text-slate-500">
            Access the tools you need without the long-term commitment. Gearly brings equipment
            owners and people with projects together.
          </p>
          <div className="mt-7 space-y-5">
            {[
              ['01', 'Spend smarter', 'Pay for the time you actually need.'],
              ['02', 'Find trusted owners', 'Connect with local equipment providers.'],
              ['03', 'Stay flexible', 'Choose daily, weekly or monthly rentals.'],
              ['04', 'Book with confidence', 'Secure checkout and clear rental details.'],
            ].map(([n, t, d]) => (
              <div key={n} className="flex gap-4">
                <span className="font-bold text-[#86a8b9]">{n}</span>
                <div>
                  <p className="font-bold">{t}</p>
                  <p className="mt-1 text-sm text-slate-500">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">GOOD WORDS, GOOD WORK</p>
          <h2 className="mt-3 text-4xl font-black">
            Customer <span className="font-serif font-normal italic text-[#6c91a7]">reviews.</span>
          </h2>
        </div>
        <ReviewCarousel reviews={reviews} />
      </section>
      <section className="mx-auto mb-16 flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[32px] bg-[#e7eff2] px-7 py-10 sm:flex-row sm:items-center sm:px-12">
        <div>
          <p className="text-xs font-bold tracking-[.18em] text-[#66899c]">
            YOUR NEXT PROJECT STARTS HERE
          </p>
          <h2 className="mt-3 text-4xl font-black">
            Need the gear.
            <br />
            <span className="font-serif font-normal italic text-[#66899c]">Not the ownership.</span>
          </h2>
        </div>
        <Link
          href="/equipment"
          className="rounded-2xl bg-[#263b49] px-6 py-4 text-sm font-bold text-white"
        >
          Find equipment ↗
        </Link>
      </section>
    </>
  );
}
