import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import {
  fetchUserRecentRounds,
  fetchUserSeasonStats,
  fetchUserSquadDetails,
  fetchUserTopContributors,
  fetchUserTournaments,
} from '@/lib/services';

type PageProps = { params: Promise<{ id: string; section: string }> };

export default async function ManagerSectionPage({ params }: PageProps) {
  const { id, section } = await params;
  const route = await requireMobileRoute(`/user/${id}/${section}`);
  const stats = await fetchUserSeasonStats(id);
  const data =
    section === 'season'
      ? stats
      : section === 'squad'
        ? await fetchUserSquadDetails(id)
        : section === 'evolution'
          ? await fetchUserRecentRounds(id)
          : section === 'contributors'
            ? await fetchUserTopContributors(id)
            : await fetchUserTournaments(id);

  return (
    <MobileDetailScaffold title={route.definition.title} context={stats.name} backHref={`/user/${id}`}>
      <MobileSectionHeading>Detalle</MobileSectionHeading>
      <MobileRecordList
        data={data}
        linkPrefix={section === 'squad' || section === 'contributors' ? '/player' : undefined}
      />
    </MobileDetailScaffold>
  );
}
