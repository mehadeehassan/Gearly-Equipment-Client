import Link from 'next/link';

export function CallToActionSection() {
  return <section className="mx-auto mb-16 flex max-w-7xl flex-col items-start justify-between gap-6 rounded-4xl bg-[#e7eff2] px-7 py-10 sm:flex-row sm:items-center sm:px-12"><div><p className="text-xs font-bold tracking-[.18em] text-[#66899c]">YOUR NEXT PROJECT STARTS HERE</p><h2 className="mt-3 text-4xl font-black">Need the gear.<br /><span className="font-serif font-normal italic text-[#66899c]">Not the ownership.</span></h2></div><Link href="/equipment" className="rounded-2xl bg-[#263b49] px-6 py-4 text-sm font-bold text-white">Find equipment ↗</Link></section>;
}
