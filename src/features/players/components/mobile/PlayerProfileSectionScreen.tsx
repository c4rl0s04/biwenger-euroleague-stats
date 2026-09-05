import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import {
  MobileMetric,
  MobileMetricGrid,
  MobileSectionHeading,
} from '@/components/mobile/MobileScreen';

import type {
  PlayerPerformanceSummaryViewModel,
  PlayerProfileSection,
  PlayerProfileViewModel,
} from '../../models/player-profile';

export function PlayerProfileSectionScreen({
  player,
  section,
  title,
  summary,
}: {
  player: PlayerProfileViewModel;
  section: PlayerProfileSection;
  title: string;
  summary?: PlayerPerformanceSummaryViewModel | null;
}) {
  let content;
  if (section === 'performance') {
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
            value={`${Number(player.price).toLocaleString('es-ES')}€`}
            tone="accent"
          />
          <MobileMetric
            label="Variación"
            value={`${Number(player.price_increment).toLocaleString('es-ES')}€`}
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
    <MobileDetailScaffold title={title} context={player.name} backHref={`/player/${player.id}`}>
      {content}
    </MobileDetailScaffold>
  );
}
