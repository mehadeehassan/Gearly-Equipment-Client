import Link from 'next/link';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { UserMenu } from './UserMenu';
import type { User } from '@/types';
export default async function Navbar() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#fbfaf7]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"><Link href="/" className="flex items-center gap-3 text-[27px] font-black tracking-tight"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dcecf5] text-xl text-[#31566b]">g.</span>gearly<span className="-ml-3 text-[#7ca9c0]">.</span></Link><nav className="hidden items-center gap-10 text-[15px] font-medium text-slate-600 md:flex"><Link className="transition hover:text-[#31566b]" href="/">Discover</Link><Link className="transition hover:text-[#31566b]" href="/equipment">Explore equipment</Link><Link className="transition hover:text-[#31566b]" href="/#how-it-works">How it works</Link></nav><div className="flex items-center gap-4">{session?.user ? <UserMenu user={session.user as unknown as User}/> : <><Link href="/login" className="hidden text-sm font-semibold text-slate-600 hover:text-[#31566b] sm:block">Log in</Link><Link href="/register" className="rounded-xl bg-[#263b49] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#31566b]">Get started ↗</Link></>}</div></div></header>;
}
