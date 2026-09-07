import { ManagerProfileScreen } from '@/features/managers/public';
import { getManagerProfile } from '@/features/managers/server';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export const dynamic = 'force-dynamic';

export default async function ManagerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const presentation = (await isPhonePresentation()) ? 'phone' : 'desktop';
  return <ManagerProfileScreen result={await getManagerProfile(id, presentation)} />;
}
