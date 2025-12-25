'use client';

import dynamic from 'next/dynamic';
import { CardSkeleton, FadeIn } from '@/components/ui';
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
} from '@/components/clasificacion';

// Dynamic imports for chart components - ssr: false excludes recharts from server bundle
const PointsProgressionCard = dynamic(
  () => import('@/components/clasificacion/PointsProgressionCard'),
  { loading: () => <CardSkeleton className="h-[550px]" />, ssr: false }
);

const RoundPointsProgressionCard = dynamic(
  () => import('@/components/clasificacion/RoundPointsProgressionCard'),
  { loading: () => <CardSkeleton className="h-[550px]" />, ssr: false }
);

const PlacementStatsCard = dynamic(() => import('@/components/clasificacion/PlacementStatsCard'), {
  loading: () => <CardSkeleton />,
  ssr: false,
});

const LeaguePerformanceCard = dynamic(
  () => import('@/components/clasificacion/LeaguePerformanceCard'),
  { loading: () => <CardSkeleton />, ssr: false }
);

export default function ClasificacionPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn delay={0}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Clasificación</h1>
          <p className="text-slate-400">
            Estadísticas completas de la liga y evolución de los participantes
          </p>
        </div>
      </FadeIn>

      {/* Main Standings + League Stats Row */}
      <FadeIn delay={100}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FullStandingsCard />
          <LeagueStatsCard />
        </div>
      </FadeIn>

      {/* Round Winners - Full Width Row */}
      <FadeIn delay={200}>
        <RoundWinnersCard />
      </FadeIn>

      {/* Points Progression - Full Width Row */}
      <FadeIn delay={300}>
        <PointsProgressionCard />
      </FadeIn>

      {/* Round Points Progression - Full Width Row */}
      <FadeIn delay={350}>
        <RoundPointsProgressionCard />
      </FadeIn>

      {/* Performance & Consistency Section */}
      <div className="pt-8">
        <FadeIn delay={400}>
          <h2 className="text-2xl font-bold text-white mb-6">Rendimiento y Consistencia</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FadeIn delay={450}>
            <ConsistencyCard />
          </FadeIn>
          <FadeIn delay={500}>
            <PlacementStatsCard />
          </FadeIn>
          <FadeIn delay={550}>
            <LeaguePerformanceCard />
          </FadeIn>
          <FadeIn delay={600}>
            <EfficiencyCard />
          </FadeIn>
          <FadeIn delay={650}>
            <StreaksCard />
          </FadeIn>
          <FadeIn delay={700}>
            <BottlerCard />
          </FadeIn>
        </div>
      </div>

      {/* Bad Luck Section */}
      <div className="pt-8">
        <FadeIn delay={800}>
          <h2 className="text-2xl font-bold text-white mb-6">Mala Suerte</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FadeIn delay={850}>
            <HeartbreakersCard />
          </FadeIn>
          <FadeIn delay={900}>
            <NoGloryCard />
          </FadeIn>
          <FadeIn delay={950}>
            <JinxCard />
          </FadeIn>
        </div>
      </div>

      {/* Team Value Ranking */}
      <FadeIn delay={1000}>
        <div className="pt-4">
          <TeamValueRankingCard />
        </div>
      </FadeIn>
    </div>
  );
}
