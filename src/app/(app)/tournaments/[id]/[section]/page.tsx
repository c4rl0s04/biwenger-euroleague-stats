import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getFixtures, getStandings, getTournamentDetails } from '@/lib/services/tournamentService';

type PageProps = { params: Promise<{ id: string; section: string }> };

export default async function TournamentSectionPage({ params }: PageProps) {
  const { id, section } = await params;
  const route = await requireMobileRoute(`/tournaments/${id}/${section}`);
  const [tournament, standings, fixtures] = await Promise.all([
    getTournamentDetails(id),
    getStandings(id),
    getFixtures(id),
  ]);
  if (!tournament) return null;
  const data = section === 'standings' ? standings : fixtures;

  return (
    <MobileDetailScaffold title={route.definition.title} context={tournament.name} backHref={`/tournaments/${id}`}>
      <MobileSectionHeading>{section === 'standings' ? 'Clasificación' : 'Enfrentamientos'}</MobileSectionHeading>
      <MobileRecordList data={data} linkPrefix={section === 'standings' ? '/user' : undefined} />
    </MobileDetailScaffold>
  );
}
