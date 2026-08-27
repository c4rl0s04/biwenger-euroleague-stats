import { Eye, Swords, Target } from 'lucide-react';

import { MobileListRow, MobileMetric, MobileMetricGrid, MobileScreen, MobileScreenHeader, MobileSectionHeading } from '../MobileScreen';

type Leader = Record<string, any>;

export default function MobilePlayoffsScreen({ leaderboard }: { leaderboard: Leader[] }) {
  const leader = leaderboard[0];
  const bestAccuracy = Math.max(0, ...leaderboard.map((entry) => Number(entry.accuracy ?? 0)));
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader eyebrow="Fase final" title="Playoffs" description="Predicciones y clasificación" />
      <MobileMetricGrid>
        <MobileMetric label="Líder" value={leader?.userName ?? '—'} tone="accent" />
        <MobileMetric label="Puntos" value={leader?.points ?? 0} />
        <MobileMetric label="Mejor precisión" value={`${bestAccuracy.toFixed(0)}%`} tone="positive" />
        <MobileMetric label="Participantes" value={leaderboard.length} />
      </MobileMetricGrid>
      <MobileSectionHeading>Clasificación</MobileSectionHeading>
      <div>{leaderboard.map((entry, index) => <MobileListRow key={String(entry.userId)} href={`/playoffs/predictions/${entry.userId}`} leading={<span className={`mobile-rank mobile-rank-${index + 1}`}>{index + 1}</span>} title={entry.userName} subtitle={`${entry.correctCount} / ${entry.totalCount} aciertos`} trailing={`${entry.points} pts`} />)}</div>
    </MobileScreen>
  );
}
