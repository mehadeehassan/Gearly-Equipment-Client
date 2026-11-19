import { PaymentSuccessStatus } from '@/components/PaymentSuccessStatus';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function PaymentSuccess({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId = '' } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/login?redirect=/payment/success?session_id=${encodeURIComponent(sessionId)}`);
  return <PaymentSuccessStatus sessionId={sessionId} userId={session.user.id} />;
}
