import type { SimulationAnalysisArtifact } from '@/lib/season-review/simulation-types';
import type { SeasonReviewOverviewV2 } from '@/lib/season-review/types';

import MobileDetailScaffold from '../MobileDetailScaffold';
import { MobileListRow, MobileMetric, MobileMetricGrid, MobileSectionHeading } from '../MobileScreen';

type ReviewSection = 'real' | 'limits' | 'simulations' | 'configurations' | 'methodology';

const money = new Intl.NumberFormat('es-ES', { notation: 'compact', style: 'currency', currency: 'EUR', maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 });

function RealEvolution({ overview }: { overview: SeasonReviewOverviewV2 }) {
  const finalPoint = overview.timeline.at(-1);
  const users = [...(finalPoint?.users ?? [])].sort((left, right) => right.totalResources - left.totalResources);
  return (
    <>
      <MobileMetricGrid>
        <MobileMetric label="Primera brecha de 10 M€" value={overview.autopsy.firstTenMillionGapDay ? new Date(overview.autopsy.firstTenMillionGapDay).toLocaleDateString('es-ES') : 'No ocurrió'} />
        <MobileMetric label="Brecha final" value={money.format(overview.autopsy.closing.resourceGap)} detail="recursos estimados" tone="negative" />
      </MobileMetricGrid>
      <MobileSectionHeading>Recursos al cierre</MobileSectionHeading>
      <div>{users.map((user, index) => <MobileListRow key={user.userId} leading={<span className="mobile-record-index">{index + 1}</span>} title={user.name} subtitle={`${user.rosterSize} jugadores · ${user.cumulativePoints.toLocaleString('es-ES')} pts`} trailing={money.format(user.totalResources)} href={`/user/${user.userId}`} />)}</div>
      <p className="mobile-method-note">Recursos = saldo reconstruido + valor de plantilla. No es un snapshot bancario real.</p>
    </>
  );
}

function Limits({ overview }: { overview: SeasonReviewOverviewV2 }) {
  return (
    <>
      <MobileSectionHeading>Presión observada</MobileSectionHeading>
      <div>{overview.capDiagnostics.map((diagnostic) => <MobileListRow key={diagnostic.cap} leading={<span className="mobile-record-index">{diagnostic.cap}</span>} title={`Límite de ${diagnostic.cap}`} subtitle={`${diagnostic.affectedUsers} usuarios · exceso máximo ${diagnostic.maxExcess}`} trailing={percent.format(diagnostic.breachRate)} />)}</div>
      <p className="mobile-method-note">La tasa describe incumplimientos históricos; no predice las decisiones que se habrían tomado con otra regla.</p>
    </>
  );
}

function Simulations({ analysis }: { analysis: SimulationAnalysisArtifact }) {
  const best = analysis.ranking?.profiles.find((profile) => profile.profileId === 'balanced')?.entries[0];
  const aggregate = analysis.configurations.find((entry) => entry.config.configId === best?.configId) ?? analysis.configurations[0];
  if (!aggregate) return <p className="mobile-record-empty">El agregado aún no está disponible.</p>;
  return (
    <>
      <MobileMetricGrid>
        <MobileMetric label="Temporadas" value={aggregate.sampleSize.toLocaleString('es-ES')} detail="mismas semillas" />
        <MobileMetric label="Gini final" value={aggregate.metrics.finalResourceGini.mean.toFixed(3)} detail={`P5 ${aggregate.metrics.finalResourceGini.quantiles.p05.toFixed(3)} · P95 ${aggregate.metrics.finalResourceGini.quantiles.p95.toFixed(3)}`} />
        <MobileMetric label="Brecha media" value={money.format(aggregate.metrics.finalResourceGap.mean)} detail="recursos finales" />
        <MobileMetric label="Recuperación" value={percent.format(aggregate.probabilities.absoluteRecovery.value)} detail="caídas naturales" tone="positive" />
      </MobileMetricGrid>
      <p className="mobile-method-note">Las bandas P5–P95 muestran la dispersión entre temporadas completas, no solo un caso medio.</p>
    </>
  );
}

function Configurations({ analysis }: { analysis: SimulationAnalysisArtifact }) {
  const profile = analysis.ranking?.profiles.find((entry) => entry.profileId === 'balanced') ?? analysis.ranking?.profiles[0];
  return (
    <>
      <MobileSectionHeading>{profile?.label ?? 'Ranking global'}</MobileSectionHeading>
      <div>{(profile?.entries ?? []).slice(0, 12).map((entry) => <MobileListRow key={entry.configId} leading={<span className="mobile-record-index">{entry.rank}</span>} title={`${entry.config.rosterCap} jugadores · ${entry.config.eurosPerPoint.toLocaleString('es-ES')} €/punto`} subtitle={`${entry.isParetoOptimal ? 'Pareto · ' : ''}${entry.config.marketSlots} jugadores de mercado`} trailing={entry.score.toFixed(1)} />)}</div>
    </>
  );
}

function Methodology({ overview, analysis }: { overview: SeasonReviewOverviewV2; analysis: SimulationAnalysisArtifact }) {
  const facts = [
    ['Punto inicial', '40 M€ exactos por usuario'],
    ['Modelo', analysis.modelVersion],
    ['Jornadas simuladas', String(analysis.dataset?.rounds ?? '—')],
    ['Fichajes observados', overview.quality.transfers.toLocaleString('es-ES')],
    ['Pujas observadas', overview.quality.bids.toLocaleString('es-ES')],
    ['Snapshots de saldo', 'No disponibles'],
    ['Histórico de salarios', 'No disponible'],
  ];
  return (
    <>
      <MobileSectionHeading>Contrato del análisis</MobileSectionHeading>
      <dl className="mobile-method-list">{facts.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
      <MobileSectionHeading>Advertencias</MobileSectionHeading>
      <ul className="mobile-warning-list">{overview.quality.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
    </>
  );
}

const titles: Record<ReviewSection, string> = { real: 'Evolución real', limits: 'Límites de plantilla', simulations: 'Simulaciones', configurations: 'Configuraciones', methodology: 'Metodología' };

export default function MobileSeasonReviewDetail({ section, overview, analysis }: { section: ReviewSection; overview: SeasonReviewOverviewV2; analysis: SimulationAnalysisArtifact }) {
  return (
    <MobileDetailScaffold title={titles[section]} context="Análisis 25/26" backHref="/season-review">
      {section === 'real' && <RealEvolution overview={overview} />}
      {section === 'limits' && <Limits overview={overview} />}
      {section === 'simulations' && <Simulations analysis={analysis} />}
      {section === 'configurations' && <Configurations analysis={analysis} />}
      {section === 'methodology' && <Methodology overview={overview} analysis={analysis} />}
    </MobileDetailScaffold>
  );
}
