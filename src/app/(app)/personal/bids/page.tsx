import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import { PersonalBidsScreen } from '@/features/market/public';
import { assertPersonalBidAccess, readPersonalBidWorkspace } from '@/features/market/server';

export const metadata = { title: 'Pujas privadas - Biwenger Stats' };
export const dynamic = 'force-dynamic';

export default async function PersonalBidsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  try {
    assertPersonalBidAccess(session.user.id);
  } catch {
    notFound();
  }
  const data = await readPersonalBidWorkspace(session.user.id);
  return <PersonalBidsScreen initialData={data} />;
}
