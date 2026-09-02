import { TeamProfileSectionScreen } from '@/features/teams/public';
import { getTeamProfileData, parseTeamProfileSection } from '@/features/teams/server';
import { requireMobileRoute } from '@/lib/mobile/route-server';

type PageProps = { params: Promise<{ id: string; section: string }> };

export default async function TeamSectionPage({ params }: PageProps) {
  const { id, section } = await params;
  const [route, model] = await Promise.all([
    requireMobileRoute(`/team/${id}/${section}`),
    getTeamProfileData(id),
  ]);
  const parsedSection = parseTeamProfileSection(section);
  if (!model || !parsedSection) return null;
  return (
    <TeamProfileSectionScreen
      model={model}
      section={parsedSection}
      title={route.definition.title}
    />
  );
}
