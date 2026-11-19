import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
export default async function DashboardIndex() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login?redirect=/dashboard');
  redirect('/dashboard/overview');
}
