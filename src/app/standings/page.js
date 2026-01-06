'use client';

import { Section } from '@/components/layout';
import dynamic from 'next/dynamic';
import { CardSkeleton } from '@/components/ui';
import {
  FullStandingsCard,
  LeagueStatsCard,
  RoundWinnersCard,
  ConsistencyCard,
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
      {/* Section: Overview and Standings */}
      <Section title="Clasificación General" delay={0} background="section-base">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FullStandingsCard />
          <LeagueStatsCard />
        </div>
      </Section>

      {/* Section: Round Winners */}
      <Section title="Ganadores de Jornada" delay={100} background="section-raised">
        <div className="space-y-6">
          <RoundWinnersCard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DominanceCard />
            <RoundHeatmapCard />
          </div>
        </div>
      </Section>

      {/* Section: Trends & Momentum */}
      <Section title="Tendencias y Momento (Trends)" delay={150} background="section-base">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HeatCheckCard />
            <TheHunterCard />
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
      <Section title="Análisis de Rendimiento" delay={250} background="section-base">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FloorCeilingCard />
          <VolatilityCard />
          <PointDistributionCard />
        </div>
      </Section>

      {/* Section: Efficiency & Consistency */}
      <Section title="Eficiencia y Consistencia" delay={300} background="section-raised">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <AllPlayAllCard />
          <TheoreticalGapCard />
          <ConsistencyCard />
          <EfficiencyCard />
        </div>
      </Section>

      {/* Section: League Stats */}
      <Section title="Estadísticas de Liga" delay={350} background="section-base">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PlacementStatsCard />
          <LeaguePerformanceCard />
          <StreaksCard />
        </div>
      </Section>

      {/* Section: Bad Luck */}
      <Section title="Mala Suerte y Curiosidades" delay={400} background="section-raised">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <HeartbreakersCard />
          <NoGloryCard />
          <JinxCard />
          <BottlerCard />
        </div>
      </Section>
    </div>
  );
}
