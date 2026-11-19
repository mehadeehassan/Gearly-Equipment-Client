import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/shared/Reveal';

export function HeroSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-16">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-green px-4 py-2 text-xs font-bold tracking-[.15em] text-[#456b53]">
          <span className="h-2 w-2 rounded-full bg-[#6c9877]" /> RENT SMARTER. MAKE MORE.
        </span>
        <h1 className="mt-7 text-5xl font-black leading-[1.06] tracking-[-.055em] sm:text-6xl lg:text-7xl">
          Good work starts<br />with the{' '}
          <span className="font-serif font-normal italic text-[#6c91a7]">right gear.</span>
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500">
          Find dependable equipment for your next big idea. Rent what you need, for exactly as long as you need it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/equipment" className="rounded-2xl bg-[#263b49] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-slate-300/50 transition hover:-translate-y-1">Explore equipment ↗</Link>
          <Link href="/register" className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold transition hover:bg-[#edf4f7]">List your equipment</Link>
        </div>
        <div className="mt-10 flex items-center gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-blue text-lg text-blue-deep">✳</span>
          <div><p className="text-sm font-bold">Made for makers</p><p className="text-xs text-slate-500">Tools, gear and people that move work forward.</p></div>
        </div>
      </div>
      <Reveal className="relative">
        <div className="relative h-107.5 overflow-hidden rounded-[34px] bg-[#e6edf0] shadow-2xl shadow-slate-300/50 sm:h-140">
          <Image fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1400" alt="Professional equipment in a workshop" />
          <div className="absolute inset-0 bg-linear-to-t from-[#172d39]/30 to-transparent" />
          <div className="absolute bottom-6 left-6 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-lg backdrop-blur"><p className="font-bold">✳ Ready when you are</p><p className="mt-1 text-xs text-slate-500">Flexible rentals. Real people.</p></div>
        </div>
        <div className="absolute -right-3 -top-4 -z-10 h-32 w-32 rounded-full bg-lilac sm:-right-6" />
      </Reveal>
    </section>
  );
}
