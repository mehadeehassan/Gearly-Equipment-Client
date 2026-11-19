import { auth } from '@/lib/auth';
import type { User } from '@/types';
import { headers } from 'next/headers';
import Link from 'next/link';
import { UserMenu } from './UserMenu';
export default async function Navbar() {
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-[27px] font-black tracking-tight">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue text-xl text-blue-deep">
            g.
          </span>
          gearly<span className="-ml-3 text-[#7ca9c0]">.</span>
        </Link>
        <nav className="hidden items-center gap-10 text-[15px] font-medium text-slate-600 md:flex">
          <Link className="transition hover:text-blue-deep" href="/">
            Discover
          </Link>
          <Link className="transition hover:text-blue-deep" href="/equipment">
            Explore equipment
          </Link>
          <Link className="transition hover:text-blue-deep" href="/#how-it-works">
            How it works
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <UserMenu user={session.user as unknown as User} />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-slate-600 hover:text-blue-deep sm:block"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-[#263b49] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-deep"
              >
                Get started ↗
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
