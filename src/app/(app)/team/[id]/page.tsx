import { TeamProfileNotFoundScreen, TeamProfileScreen } from '@/features/teams/public';
import { getTeamProfileData } from '@/features/teams/server';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export default async function TeamPage({ params }: PageProps) {
  const { id } = await params;
  const [model, phone] = await Promise.all([getTeamProfileData(id), isPhonePresentation()]);
  if (!model) return <TeamProfileNotFoundScreen />;
  return <TeamProfileScreen model={model} presentation={phone ? 'phone' : 'desktop'} />;
}
