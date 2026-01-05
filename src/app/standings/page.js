'use client';

import { Section } from '@/components/layout';
import dynamic from 'next/dynamic';
import { CardSkeleton } from '@/components/ui';
import {
  FullStandingsCard,
  LeagueStatsCard,
  RoundWinnersCard,
  TeamValueRankingCard,
  ConsistencyCard,
  EfficiencyCard,
  StreaksCard,
  BottlerCard,
  HeartbreakersCard,
  NoGloryCard,
  JinxCard,
  InitialSquadAnalysisCard,
} from '@/components/standings';

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
        <RoundWinnersCard />
      </Section>

      {/* Section: Progression */}
      <Section title="Evolución de Puntos" delay={200} background="section-base">
        <div className="space-y-6">
          <PointsProgressionCard />
          <RoundPointsProgressionCard />
        </div>
      </Section>

      {/* Section: Performance & Consistency */}
      <Section title="Rendimiento y Consistencia" delay={300} background="section-raised">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ConsistencyCard />
          <PlacementStatsCard />
          <LeaguePerformanceCard />
          <EfficiencyCard />
          <StreaksCard />
          <BottlerCard />
        </div>
      </Section>

      {/* Section: Bad Luck */}
      <Section title="Mala Suerte" delay={400} background="section-base">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <HeartbreakersCard />
          <NoGloryCard />
          <JinxCard />
        </div>
      </Section>

      {/* Section: Team Value */}
      <Section title="Valor de Equipo" delay={500} background="section-raised">
        <TeamValueRankingCard />
      </Section>
    </div>
  );
}
