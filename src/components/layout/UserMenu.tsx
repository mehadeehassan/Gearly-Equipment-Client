'use client';
import { authClient } from '@/lib/auth-client';
import { notify as toast } from '@/lib/toast';
import type { User } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  async function logout() {
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message);
      toast.success('You have been logged out');
      setOpen(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to log out');
    }
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm"
        aria-expanded={open}
      >
        <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-blue font-bold text-blue-deep">
          {user.image ? (
            <Image
              src={user.image}
              alt="Profile"
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          ) : (
            (user.name || user.email || 'U').slice(0, 1).toUpperCase()
          )}
        </span>
        <span className="hidden text-sm font-semibold sm:block">
          {user.name?.split(' ')[0] || 'Account'}
        </span>
        <span className="text-xs">⌄</span>
      </button>
      {open && (
        <div className="absolute right-0 top-14 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="font-bold">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <Link
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50"
            href="/dashboard/profile"
          >
            My profile
          </Link>
          <button
            onClick={logout}
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
