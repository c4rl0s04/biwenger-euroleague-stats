import { ChartSpline, History, Target, Trophy, Users } from 'lucide-react';

import { MobileListRow, MobileMetric, MobileMetricGrid, MobileScreen, MobileScreenHeader, MobileSectionHeading, MobileSectionLink } from '../MobileScreen';

type Stats = Record<string, any>;

export default function MobilePredictionsScreen({ stats }: { stats: Stats }) {
  const ranking = stats.table_stats ?? [];
  const leader = ranking[0];
  const victories = stats.porra_stats?.victorias?.[0];
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader eyebrow="Competición" title="Porras" description="Aciertos, ranking y evolución" />
      <MobileMetricGrid>
        <MobileMetric label="Líder" value={leader?.usuario ?? '—'} detail={`${leader?.total_aciertos ?? 0} aciertos`} tone="accent" />
        <MobileMetric label="Más victorias" value={victories?.usuario ?? '—'} detail={`${victories?.victorias ?? 0} jornadas`} />
        <MobileMetric label="Participantes" value={ranking.length} tone="positive" />
        <MobileMetric label="Jornadas" value={stats.participation?.length ?? 0} />
      </MobileMetricGrid>
      <MobileSectionHeading>Clasificación</MobileSectionHeading>
      <div>{ranking.slice(0, 7).map((row: Stats, index: number) => <MobileListRow key={String(row.user_id)} href={`/user/${row.user_id}`} leading={<span className={`mobile-rank mobile-rank-${index + 1}`}>{index + 1}</span>} title={row.usuario} subtitle={`${row.jornadas_jugadas} jornadas`} trailing={row.total_aciertos} />)}</div>
      <MobileSectionHeading>Explorar</MobileSectionHeading>
      <div>
        <MobileSectionLink href="/predictions/evolution" title="Evolución" description="Aciertos jornada a jornada" icon={ChartSpline} accent="blue" />
        <MobileSectionLink href="/predictions/ranking" title="Ranking" description="Clasificación completa y promedios" icon={Trophy} />
        <MobileSectionLink href="/predictions/teams" title="Equipos" description="Qué equipos son más previsibles" icon={Users} accent="green" />
        <MobileSectionLink href="/predictions/history" title="Historial" description="Detalle de todas las porras" icon={History} accent="violet" />
      </div>
    </MobileScreen>
  );
}
