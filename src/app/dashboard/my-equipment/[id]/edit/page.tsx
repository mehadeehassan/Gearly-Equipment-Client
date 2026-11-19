import { EquipmentEditClient } from '@/components/EquipmentEditClient';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/login?redirect=/dashboard/my-equipment/${id}/edit`);
  const role = (session.user as typeof session.user & { role?: string }).role;
  if (role !== 'owner') redirect('/dashboard');
  return <EquipmentEditClient equipmentId={id} userId={session.user.id} />;
}
