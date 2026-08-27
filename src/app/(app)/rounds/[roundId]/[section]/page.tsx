import { auth } from '@/auth';
import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileMetric, MobileMetricGrid, MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import {
  fetchRoundCompleteData,
  fetchRoundStandings,
  getUserPerformanceHistoryService,
} from '@/lib/services';

type PageProps = { params: Promise<{ roundId: string; section: string }> };
type RecordValue = Record<string, any>;

export default async function RoundSectionPage({ params }: PageProps) {
  const { roundId, section } = await params;
  const route = await requireMobileRoute(`/rounds/${roundId}/${section}`);
  const session = await auth();
  const userId = session?.user?.id;
  const roundData = userId ? ((await fetchRoundCompleteData(roundId, userId)) as RecordValue) : null;
  const user = roundData?.users?.[0];
  const data =
    section === 'history'
      ? userId
        ? await getUserPerformanceHistoryService(userId)
        : []
      : section === 'comparison'
        ? await fetchRoundStandings(roundId)
        : section === 'stats'
          ? [roundData?.global, ...(roundData?.idealLineup ?? [])]
          : user?.lineup?.players ?? [];

  return (
    <MobileDetailScaffold title={route.definition.title} context={`Jornada ${roundId}`} backHref={`/rounds?roundId=${roundId}`}>
      {section === 'lineup' && (
        <MobileMetricGrid>
          <MobileMetric label="Puntos" value={user?.points ?? 0} tone="accent" />
          <MobileMetric label="Ideal" value={user?.ideal_points ?? 0} />
        </MobileMetricGrid>
      )}
      <MobileSectionHeading>Detalle</MobileSectionHeading>
      <MobileRecordList data={data} linkPrefix={section === 'lineup' || section === 'stats' ? '/player' : undefined} />
    </MobileDetailScaffold>
  );
}
