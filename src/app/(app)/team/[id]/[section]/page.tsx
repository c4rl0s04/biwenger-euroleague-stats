import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { fetchTeamProfile } from '@/lib/services';

type PageProps = { params: Promise<{ id: string; section: string }> };
type Team = Record<string, any>;

export default async function TeamSectionPage({ params }: PageProps) {
  const { id, section } = await params;
  const route = await requireMobileRoute(`/team/${id}/${section}`);
  const team = (await fetchTeamProfile(id)) as Team | null;
  if (!team) return null;
  const data =
    section === 'roster'
      ? team.roster
      : [...(team.upcomingMatches ?? []), ...(team.recentMatches ?? [])];

  return (
    <MobileDetailScaffold title={route.definition.title} context={team.name} backHref={`/team/${id}`}>
      <MobileSectionHeading>
        {section === 'roster' ? 'Jugadores' : 'Calendario y resultados'}
      </MobileSectionHeading>
      <MobileRecordList data={data} linkPrefix={section === 'roster' ? '/player' : undefined} />
    </MobileDetailScaffold>
  );
}
