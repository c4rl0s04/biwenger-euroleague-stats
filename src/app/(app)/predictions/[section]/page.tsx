import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { fetchPredictionsStats } from '@/lib/services/features/predictionsService';

type PageProps = { params: Promise<{ section: string }> };
type Stats = Record<string, any>;

export default async function PredictionsSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = await requireMobileRoute(`/predictions/${section}`);
  const stats = (await fetchPredictionsStats()) as Stats;
  const data =
    section === 'evolution'
      ? stats.performance
      : section === 'ranking'
        ? stats.table_stats
        : section === 'teams'
          ? stats.porra_stats?.predictable_teams
          : stats.history?.jornadas;

  return (
    <MobileDetailScaffold title={route.definition.title} context="Porras" backHref="/predictions">
      <MobileSectionHeading>Detalle</MobileSectionHeading>
      <MobileRecordList data={data} linkPrefix={section === 'ranking' ? '/user' : undefined} />
    </MobileDetailScaffold>
  );
}
