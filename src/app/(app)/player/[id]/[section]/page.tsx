import {
  getPlayerPerformanceSummaryForProfile,
  getPlayerProfileData,
  parsePlayerProfileSection,
} from '@/features/players/server';
import { PlayerProfileSectionScreen } from '@/features/players/public';
import { requireMobileRoute } from '@/lib/mobile/route-server';

type PageProps = { params: Promise<{ id: string; section: string }> };
export default async function PlayerSectionPage({ params }: PageProps) {
  const { id, section } = await params;
  const route = await requireMobileRoute(`/player/${id}/${section}`);
  const parsedSection = parsePlayerProfileSection(section);
  if (!parsedSection) return null;
  const player = await getPlayerProfileData(id);
  if (!player) return null;

  const summary =
    parsedSection === 'performance' ? getPlayerPerformanceSummaryForProfile(player) : undefined;

  return (
    <PlayerProfileSectionScreen
      player={player}
      section={parsedSection}
      title={route.definition.title}
      summary={summary}
    />
  );
}
