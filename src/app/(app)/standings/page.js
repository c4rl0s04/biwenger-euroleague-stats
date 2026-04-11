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
  HeatCheckCard,
  TheHunterCard,
  RollingAverageCard,
  FloorCeilingCard,
  VolatilityCard,
  PointDistributionCard,
  AllPlayAllCard,
  DominanceCard,
  TheoreticalGapCard,
  RivalryMatrixCard,
  InitialSquadAnalysisCard,
  BestDraftPlayerCard,
  DraftFidelityCard,
  CaptainStandingsCard,
} from '@/components/standings';

import InitialSquadRegretCard from '@/components/standings/InitialSquadRegretCard';
import InitialSquadLoyaltyCard from '@/components/standings/InitialSquadLoyaltyCard';
import InitialSquadPotentialCard from '@/components/standings/InitialSquadPotentialCard';
import InitialSquadListCard from '@/components/standings/InitialSquadListCard';

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

const PositionEvolutionCard = dynamic(
  () => import('@/components/standings/PositionEvolutionCard'),
  { loading: () => <CardSkeleton className="h-[550px]" />, ssr: false }
);

export default function ClasificacionPage() {
  return (
    <div>
      {/* Header Section */}
      <PageHeader
        title="Clasificación"
        description="Análisis detallado de la clasificación, tendencias y estadísticas de rendimiento."
      />

      {/* 1. Clasificación General */}
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

      {/* 2. Progresión y Evolución */}
      <Section
        title="Progresión y Evolución"
        id="progression"
        delay={100}
        background="section-raised"
      >
        <div className="space-y-6">
          <PointsProgressionCard />
          <PositionEvolutionCard />
          <RoundPointsProgressionCard />
          <RollingAverageCard />
        </div>
      </Section>

      {/* 3. Dominio de Jornada */}
      <Section title="Dominio de Jornada" id="round-winners" delay={150} background="section-base">
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

      {/* 4. Análisis del Reparto Inicial (El Draft) */}
      <Section
        title="Análisis del Reparto Inicial (El Draft)"
        id="initial-squad"
        delay={200}
        background="section-raised"
      >
        <div className="space-y-6">
          <InitialSquadListCard />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InitialSquadAnalysisCard />
            <BestDraftPlayerCard />
            <DraftFidelityCard />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InitialSquadRegretCard />
            <InitialSquadLoyaltyCard />
            <InitialSquadPotentialCard />
          </div>
        </div>
      </Section>

      {/* 5. Tendencias y Momento */}
      <Section
        title="Tendencias y Momento (Trends)"
        id="trends"
        delay={250}
        background="section-base"
      >
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
      </Section>

      {/* 6. Consistencia y Rendimiento */}
      <Section
        title="Consistencia y Rendimiento"
        id="performance"
        delay={300}
        background="section-raised"
      >
        <div className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div id="reliability-card">
              <ReliabilityCard />
            </div>
            <EfficiencyCard />
          </div>
        </div>
      </Section>

      {/* 7. El Multiverso Biwenger (Clasificaciones Alternativas) */}
      <Section
        title="El Multiverso Biwenger"
        id="alternative-standings"
        delay={350}
        background="section-base"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <AllPlayAllCard />
          <PlacementStatsCard />
          <div id="gap-card" className="md:col-span-2 lg:col-span-2">
            <TheoreticalGapCard />
          </div>
          <div id="rivalry-matrix-card" className="md:col-span-2 lg:col-span-2">
            <RivalryMatrixCard />
          </div>
        </div>
      </Section>

      {/* 8. Mala Suerte y Curiosidades */}
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
      {/* 9. Rendimiento de Capitanes */}
      <Section title="Rendimiento de Capitanes" id="captains" delay={450} background="section-base">
        <div className="grid grid-cols-1 gap-6">
          <CaptainStandingsCard />
        </div>
      </Section>
    </div>
  );
}
