import { ReviewManagementClient } from '@/components/dashboard/ReviewManagementClient';
import { auth } from '@/lib/auth';
import type { User } from '@/types';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminReviewsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login?redirect=/dashboard/admin/reviews');
  const user = session.user as unknown as User;
  if ((user.role || '').toLowerCase() !== 'admin') redirect('/dashboard');
  return <ReviewManagementClient user={user} mode="admin" />;
}
