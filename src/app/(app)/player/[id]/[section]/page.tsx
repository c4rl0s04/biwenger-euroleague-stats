import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import {
  MobileMetric,
  MobileMetricGrid,
  MobileSectionHeading,
} from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getPlayerProfile, getPlayerPerformanceSummary } from '@/lib/services';

type PageProps = { params: Promise<{ id: string; section: string }> };
type RecordValue = Record<string, any>;

export default async function PlayerSectionPage({ params }: PageProps) {
  const { id, section } = await params;
  const route = await requireMobileRoute(`/player/${id}/${section}`);
  const player = (await getPlayerProfile(id)) as RecordValue | null;
  if (!player) return null;

  let content;
  if (section === 'performance') {
    const summary = (await getPlayerPerformanceSummary(id)) as RecordValue | null;
    content = (
      <>
        <MobileMetricGrid>
          <MobileMetric label="Forma" value={summary?.formStatus ?? '—'} tone="accent" />
          <MobileMetric
            label="Media reciente"
            value={Number(summary?.recentAverage ?? 0).toLocaleString('es-ES')}
          />
          <MobileMetric label="Partidos" value={summary?.gamesPlayed ?? 0} />
          <MobileMetric
            label="Total"
            value={Number(summary?.totalPoints ?? 0).toLocaleString('es-ES')}
            tone="positive"
          />
        </MobileMetricGrid>
        <MobileSectionHeading>Partidos recientes</MobileSectionHeading>
        <MobileRecordList data={player.recentMatches} />
      </>
    );
  } else if (section === 'market') {
    content = (
      <>
        <MobileMetricGrid>
          <MobileMetric
            label="Precio"
            value={`${Number(player.price ?? 0).toLocaleString('es-ES')}€`}
            tone="accent"
          />
          <MobileMetric
            label="Variación"
            value={`${Number(player.price_increment ?? 0).toLocaleString('es-ES')}€`}
          />
        </MobileMetricGrid>
        <MobileSectionHeading>Traspasos</MobileSectionHeading>
        <MobileRecordList data={player.transfers} />
      </>
    );
  } else {
    content = (
      <>
        <MobileSectionHeading>Jornadas</MobileSectionHeading>
        <MobileRecordList data={player.recentMatches} />
      </>
    );
  }

  return (
    <MobileDetailScaffold
      title={route.definition.title}
      context={player.name}
      backHref={`/player/${id}`}
    >
      {content}
    </MobileDetailScaffold>
  );
}
