import Link from 'next/link';
export function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-[#f4f4ef]">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-10 sm:flex-row sm:items-center lg:px-8">
        <div>
          <Link href="/" className="text-2xl font-black">
            gearly<span className="text-[#7ca9c0]">.</span>
          </Link>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            The right equipment, for the right amount of time.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-slate-600">
          <Link href="/equipment">Explore</Link>
          <Link href="/register">Become an owner</Link>
          <Link href="/#how-it-works">How it works</Link>
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Gearly</p>
      </div>
    </footer>
  );
}
