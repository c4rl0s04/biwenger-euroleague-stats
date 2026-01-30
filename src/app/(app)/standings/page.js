'use client';

import { Section } from '@/components/layout';
import dynamic from 'next/dynamic';
import { CardSkeleton, PageHeader } from '@/components/ui';
import {
  FullStandingsCard,
  LeagueStatsCard,
  RoundWinnersCard,
  ReliabilityCard,
  EfficiencyCard,
  StreaksCard,
  BottlerCard,
  HeartbreakersCard,
  NoGloryCard,
  JinxCard,
  InitialSquadAnalysisCard,
  // New Stats
  HeatCheckCard,
  TheHunterCard,
  RollingAverageCard,
  FloorCeilingCard,
  VolatilityCard,
  PointDistributionCard,
  AllPlayAllCard,
  DominanceCard,
  TheoreticalGapCard,
  PositionEvolutionCard,
  RivalryMatrixCard,
} from '@/components/standings';

import RoundHeatmapCard from '@/components/standings/RoundHeatmapCard';

// Dynamic imports for chart components - ssr: false excludes recharts from server bundle
const PointsProgressionCard = dynamic(
  () => import('@/components/standings/PointsProgressionCard'),
  { loading: () => <CardSkeleton className="h-[550px]" />, ssr: false }
);

const RoundPointsProgressionCard = dynamic(
  () => import('@/components/standings/RoundPointsProgressionCard'),
  { loading: () => <CardSkeleton className="h-[550px]" />, ssr: false }
);

const PlacementStatsCard = dynamic(() => import('@/components/standings/PlacementStatsCard'), {
  loading: () => <CardSkeleton />,
  ssr: false,
});

const LeaguePerformanceCard = dynamic(
  () => import('@/components/standings/LeaguePerformanceCard'),
  { loading: () => <CardSkeleton />, ssr: false }
);

export default function ClasificacionPage() {
  return (
    <div>
      {/* Header Section */}
      <PageHeader
        title="Clasificación"
        description="Análisis detallado de la clasificación, tendencias y estadísticas de rendimiento."
      />
      {/* Section: Overview and Standings */}
      <Section
        title="Clasificación General"
        id="general-standings"
        delay={0}
        background="section-base"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FullStandingsCard />
          <LeagueStatsCard />
        </div>
      </Section>

      {/* Section: Round Winners */}
      <Section
        title="Ganadores de Jornada"
        id="round-winners"
        delay={100}
        background="section-raised"
      >
        <div className="space-y-6">
          <RoundWinnersCard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div id="dominance-card">
              <DominanceCard />
            </div>
            <RoundHeatmapCard />
          </div>
        </div>
      </Section>

      {/* Section: Trends & Momentum */}
      <Section
        title="Tendencias y Momento (Trends)"
        id="trends"
        delay={150}
        background="section-base"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div id="heat-check-card">
              <HeatCheckCard />
            </div>
            <div id="hunter-card">
              <TheHunterCard />
            </div>
            <div id="streaks-card">
              <StreaksCard />
            </div>
          </div>
          <PositionEvolutionCard />
          <RollingAverageCard />
        </div>
      </Section>

      {/* Section: Progression */}
      <Section title="Progresión de Puntos" delay={200} background="section-raised">
        <div className="space-y-6">
          <PointsProgressionCard />
          <RoundPointsProgressionCard />
        </div>
      </Section>

      {/* Section: Performance Analysis */}
      <Section
        title="Análisis de Rendimiento"
        id="performance"
        delay={250}
        background="section-base"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <div id="floor-ceiling-card">
            <FloorCeilingCard />
          </div>
          <div id="volatility-card">
            <VolatilityCard />
          </div>
          <PointDistributionCard />
          <div id="league-perf-card">
            <LeaguePerformanceCard />
          </div>
        </div>
      </Section>

      {/* Section: Efficiency & Consistency */}
      <Section
        title="Eficiencia y Consistencia"
        id="efficiency"
        delay={300}
        background="section-raised"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div id="gap-card">
            <TheoreticalGapCard />
          </div>
          <div id="reliability-card">
            <ReliabilityCard />
          </div>
          <EfficiencyCard />
        </div>
      </Section>

      {/* Section: League Stats */}
      <Section title="Estadísticas de Liga" id="league-stats" delay={350} background="section-base">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <PlacementStatsCard />
          <AllPlayAllCard />
          <div id="rivalry-matrix-card" className="md:col-span-2 lg:col-span-2">
            <RivalryMatrixCard />
          </div>
        </div>
      </Section>

      {/* Section: Bad Luck */}
      <Section
        title="Mala Suerte y Curiosidades"
        id="bad-luck"
        delay={400}
        background="section-raised"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div id="heartbreaker-card">
            <HeartbreakersCard />
          </div>
          <div id="no-glory-card">
            <NoGloryCard />
          </div>
          <div id="jinx-card">
            <JinxCard />
          </div>
          <div id="bottler-card">
            <BottlerCard />
          </div>
        </div>
      </Section>
    </div>
  );
}
