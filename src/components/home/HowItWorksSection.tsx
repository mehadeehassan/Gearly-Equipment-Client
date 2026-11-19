import Image from 'next/image';

const benefits = [
  ['01', 'Spend smarter', 'Pay for the time you actually need.'],
  ['02', 'Find trusted owners', 'Connect with local equipment providers.'],
  ['03', 'Stay flexible', 'Choose daily, weekly or monthly rentals.'],
  ['04', 'Book with confidence', 'Secure checkout and clear rental details.'],
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-2 lg:items-center lg:px-8">
      <div className="relative h-107.5 overflow-hidden rounded-4xl bg-[#e9eff0]"><Image fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1200" alt="Tools and equipment at work" /></div>
      <div><p className="text-xs font-bold tracking-[.18em] text-[#6c91a7]">THE GEARLY DIFFERENCE</p><h2 className="mt-4 text-5xl font-black leading-tight tracking-tight">Less buying.<br /><span className="font-serif font-normal italic text-[#6c91a7]">More doing.</span></h2><p className="mt-5 leading-7 text-slate-500">Access the tools you need without the long-term commitment. Gearly brings equipment owners and people with projects together.</p>
        <div className="mt-7 space-y-5">{benefits.map(([number, title, description]) => <div key={number} className="flex gap-4"><span className="font-bold text-[#86a8b9]">{number}</span><div><p className="font-bold">{title}</p><p className="mt-1 text-sm text-slate-500">{description}</p></div></div>)}</div>
      </div>
    </section>
  );
}
