import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { User } from '@/types';
const allowed = [
  'overview',
  'my-rentals',
  'favorites',
  'profile',
  'add-equipment',
  'my-equipment',
  'rentals',
  'analytics',
  'users',
  'equipment',
];
export default async function DashboardSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!allowed.includes(section)) notFound();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/login?redirect=/dashboard/${section}`);
  const user = session.user as unknown as User;
  const role: string = user.role || 'customer';
  const ownerOnly = ['add-equipment', 'my-equipment'];
  const adminOnly = ['users', 'equipment'];
  if (ownerOnly.includes(section) && role !== 'owner') redirect('/dashboard');
  if (adminOnly.includes(section) && role !== 'admin') redirect('/dashboard');
  if (section === 'rentals' && role !== 'owner' && role !== 'admin') redirect('/dashboard');
  if (section === 'analytics' && role !== 'owner' && role !== 'admin') redirect('/dashboard');
  if (section === 'my-rentals' || section === 'favorites') {
    if (role !== 'customer' && role !== 'renter') redirect('/dashboard');
  }
  return <DashboardClient user={user} />;
}
