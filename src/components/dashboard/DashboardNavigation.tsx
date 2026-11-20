'use client';

import type { User } from '@/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const customerLinks = [
  ['overview', 'Overview'],
  ['my-rentals', 'My rentals'],
  ['favorites', 'Favorites'],
  ['profile', 'Profile'],
];

const ownerLinks = [
  ['overview', 'Overview'],
  ['add-equipment', 'Add equipment'],
  ['my-equipment', 'My equipment'],
  ['rentals', 'Rental requests'],
  ['owner/reviews', 'My equipment reviews'],
  ['analytics', 'Analytics'],
  ['profile', 'Profile'],
];

const adminLinks = [
  ['overview', 'Overview'],
  ['users', 'All users'],
  ['equipment', 'All equipment'],
  ['rentals', 'All rentals'],
  ['admin/reviews', 'Customer reviews'],
  ['analytics', 'Analytics'],
  ['profile', 'Profile'],
];

export function getDashboardLinks(role: string) {
  return role === 'admin' ? adminLinks : role === 'owner' ? ownerLinks : customerLinks;
}

export function DashboardNavigation({
  user,
  role,
}: {
  user: User;
  role: string;
}) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean).slice(1);
  const section = ['owner', 'admin'].includes(segments[0])
    ? `${segments[0]}/${segments[1] || ''}`
    : segments[0] || 'overview';

  return (
    <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-3">
      <div className="mb-3 rounded-2xl bg-[#edf4f7] p-4">
        <p className="font-bold">{user.name}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
        <span className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-deep">
          {role}
        </span>
      </div>
      <nav className="space-y-1">
        {getDashboardLinks(role).map(([key, label]) => (
          <Link
            key={key}
            href={`/dashboard/${key}`}
            className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${section === key ? 'bg-[#263b49] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
