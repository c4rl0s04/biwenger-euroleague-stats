import { Activity, Award, ChartSpline, Crown, DraftingCompass, Flame, Gauge, Sparkles } from 'lucide-react';

import {
  MobileListRow,
  MobileMetric,
  MobileMetricGrid,
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';

type RecordValue = Record<string, any>;

const compactMoney = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 });

export default function MobileStandingsScreen({
  data,
}: {
  data: { standings: RecordValue[]; leagueTotals: RecordValue };
}) {
  const leader = data.standings[0];
  const last = data.standings[data.standings.length - 1];
  const gap = Number(leader?.total_points ?? 0) - Number(last?.total_points ?? 0);

  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader eyebrow="Liga" title="Clasificación" description="Tabla actual y pulso competitivo" />

      <MobileMetricGrid>
        <MobileMetric label="Líder" value={leader?.name ?? '—'} detail={`${leader?.total_points ?? 0} puntos`} tone="accent" />
        <MobileMetric label="Brecha" value={gap.toLocaleString('es-ES')} detail="primero a último" />
        <MobileMetric label="Jornadas" value={data.leagueTotals?.total_rounds ?? 0} />
        <MobileMetric label="Valor liga" value={`${compactMoney.format(Number(data.leagueTotals?.total_league_value ?? 0))}€`} tone="positive" />
      </MobileMetricGrid>

      <MobileSectionHeading>Tabla actual</MobileSectionHeading>
      <div className="mobile-ranking-list">
        {data.standings.map((manager) => {
          const distance = Number(leader?.total_points ?? 0) - Number(manager.total_points ?? 0);
          return (
            <MobileListRow
              key={String(manager.user_id)}
              href={`/user/${manager.user_id}`}
              leading={<span className={`mobile-rank mobile-rank-${manager.position}`}>{manager.position}</span>}
              title={manager.name}
              subtitle={distance ? `A ${distance} puntos del líder` : 'Líder actual'}
              trailing={<strong>{Number(manager.total_points).toLocaleString('es-ES')}</strong>}
            />
          );
        })}
      </div>

      <MobileSectionHeading>Explorar la liga</MobileSectionHeading>
      <div>
        <MobileSectionLink href="/standings/progression" title="Evolución" description="Puntos y posiciones jornada a jornada" icon={ChartSpline} accent="blue" />
        <MobileSectionLink href="/standings/rounds" title="Dominio de jornadas" description="Ganadores, rachas y heatmap" icon={Crown} />
        <MobileSectionLink href="/standings/draft" title="Draft inicial" description="Qué dejó el reparto de plantillas" icon={DraftingCompass} accent="violet" />
        <MobileSectionLink href="/standings/form" title="Estado de forma" description="Quién acelera y quién se frena" icon={Flame} accent="red" />
        <MobileSectionLink href="/standings/performance" title="Rendimiento" description="Regularidad, suelo y techo" icon={Gauge} accent="green" />
        <MobileSectionLink href="/standings/alternatives" title="Clasificaciones alternativas" description="Otras formas de medir la liga" icon={Activity} accent="blue" />
        <MobileSectionLink href="/standings/curiosities" title="Curiosidades" description="Mala suerte, récords y anomalías" icon={Sparkles} accent="violet" />
        <MobileSectionLink href="/standings/captains" title="Capitanes" description="Impacto de las decisiones de capitán" icon={Award} />
      </div>
    </MobileScreen>
  );
}
