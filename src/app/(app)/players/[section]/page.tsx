import {
  getPlayerCatalogueData,
  getPlayerCatalogueInsightsData,
  parsePlayerCatalogueSection,
  PlayerCatalogueSectionScreen,
} from '@/features/players/server';
import { requireMobileRoute } from '@/lib/mobile/route-server';

type PageProps = { params: Promise<{ section: string }> };

export default async function PlayersSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = await requireMobileRoute(`/players/${section}`);
  const parsedSection = parsePlayerCatalogueSection(section);
  if (!parsedSection) return null;
  const insights =
    parsedSection === 'insights' ? await getPlayerCatalogueInsightsData() : undefined;
  const players = parsedSection === 'squads' ? await getPlayerCatalogueData() : undefined;

  return (
    <PlayerCatalogueSectionScreen
      section={parsedSection}
      title={route.definition.title}
      insights={insights}
      players={players}
    />
  );
}
