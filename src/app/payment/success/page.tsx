import { PaymentSuccessStatus } from '@/components/PaymentSuccessStatus';

export default async function PaymentSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId = '' } = await searchParams;
  return <PaymentSuccessStatus sessionId={sessionId} />;
}
