import { Activity, ChartNoAxesCombined, FlaskConical, Gauge, ListChecks } from 'lucide-react';

import type { SimulationAnalysisArtifact } from '@/lib/season-review/simulation-types';
import type { SeasonReviewOverviewV2 } from '@/lib/season-review/types';

import {
  MobileMetric,
  MobileMetricGrid,
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';

const money = new Intl.NumberFormat('es-ES', { notation: 'compact', style: 'currency', currency: 'EUR', maximumFractionDigits: 1 });

export default function MobileSeasonReviewScreen({
  overview,
  simulationAnalysis,
}: {
  overview: SeasonReviewOverviewV2;
  simulationAnalysis: SimulationAnalysisArtifact;
}) {
  const recommendation = simulationAnalysis.ranking?.profiles.find((profile) => profile.profileId === 'balanced')?.entries[0];
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader eyebrow="Temporada 2025/26" title="Análisis" description="De 40 M€ iguales a una liga con brechas" />
      <MobileMetricGrid>
        <MobileMetric label="Punto de partida" value="40 M€" detail="por usuario" tone="accent" />
        <MobileMetric label="Brecha a mitad" value={money.format(overview.autopsy.midpoint.resourceGap)} detail="líder · último" />
        <MobileMetric label="Simulaciones" value={simulationAnalysis.pairCount.toLocaleString('es-ES')} detail={`${simulationAnalysis.configurationCount} configuraciones`} />
        <MobileMetric label="Mejor equilibrio" value={recommendation ? `${recommendation.config.rosterCap} jug.` : 'Pendiente'} detail={recommendation ? `${recommendation.config.eurosPerPoint.toLocaleString('es-ES')} €/punto` : undefined} tone="positive" />
      </MobileMetricGrid>

      <MobileSectionHeading>Explorar el estudio</MobileSectionHeading>
      <div className="mobile-section-list">
        <MobileSectionLink href="/season-review/real" title="Evolución real" description="Cómo y cuándo se abrió la brecha" icon={Activity} />
        <MobileSectionLink href="/season-review/limits" title="Límites de plantilla" description="Presión histórica de cada límite" icon={Gauge} accent="blue" />
        <MobileSectionLink href="/season-review/simulations" title="Simulaciones" description="Resultados medios y dispersión" icon={FlaskConical} accent="violet" />
        <MobileSectionLink href="/season-review/configurations" title="Configuraciones" description="Ranking y frontera de Pareto" icon={ChartNoAxesCombined} accent="green" />
        <MobileSectionLink href="/season-review/methodology" title="Metodología" description="Supuestos, cobertura y límites" icon={ListChecks} accent="red" />
      </div>
    </MobileScreen>
  );
}
