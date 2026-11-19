import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="grid min-h-[68vh] place-items-center overflow-hidden px-5 py-16">
      <div className="relative max-w-2xl text-center">
        <div className="absolute -left-20 -top-16 -z-10 h-48 w-48 rounded-full bg-[#dcecf5] blur-2xl" />
        <div className="absolute -right-20 top-20 -z-10 h-48 w-48 rounded-full bg-[#eee9f7] blur-2xl" />
        <p className="text-[100px] font-black leading-none tracking-[-.08em] text-[#c5d9e3] sm:text-[150px]">
          404
        </p>
        <p className="mt-5 text-xs font-bold tracking-[.2em] text-[#6c91a7]">OFF THE BEATEN PATH</p>
        <h1 className="mt-3 text-4xl font-black">Looks like this gear is missing.</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-500">
          The page you’re looking for may have moved, or the link might be taking a day off.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-xl bg-[#263b49] px-6 py-3 font-bold text-white">
            Back to home ↗
          </Link>
          <Link
            href="/equipment"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold"
          >
            Explore equipment
          </Link>
        </div>
      </div>
    </div>
  );
}
