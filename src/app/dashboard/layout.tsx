import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation';
import { auth } from '@/lib/auth';
import type { User } from '@/types';
import { headers } from 'next/headers';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return children;

  const user = session.user as unknown as User;
  const role = (user.role || 'customer').toLowerCase();

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="grid items-start gap-7 lg:grid-cols-[230px_minmax(0,1fr)]">
        <DashboardNavigation user={user} role={role} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
