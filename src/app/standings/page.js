import FullStandingsCard from '@/components/clasificacion/FullStandingsCard';
import LeagueStatsCard from '@/components/clasificacion/LeagueStatsCard';
import RoundWinnersCard from '@/components/clasificacion/RoundWinnersCard';
import PointsProgressionCard from '@/components/clasificacion/PointsProgressionCard';
import RoundPointsProgressionCard from '@/components/clasificacion/RoundPointsProgressionCard';
import TeamValueRankingCard from '@/components/clasificacion/TeamValueRankingCard';
import FadeIn from '@/components/ui/FadeIn';

import ConsistencyCard from '@/components/clasificacion/ConsistencyCard';
import PlacementStatsCard from '@/components/clasificacion/PlacementStatsCard';
import LeaguePerformanceCard from '@/components/clasificacion/LeaguePerformanceCard';
import EfficiencyCard from '@/components/clasificacion/EfficiencyCard';
import StreaksCard from '@/components/clasificacion/StreaksCard';
import BottlerCard from '@/components/clasificacion/BottlerCard';

export const dynamic = 'force-dynamic';

export default function ClasificacionPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn delay={0}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Clasificación</h1>
          <p className="text-slate-400">Estadísticas completas de la liga y evolución de los participantes</p>
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

      {/* Team Value Ranking */}
      <FadeIn delay={750}>
        <div className="pt-4">
           <TeamValueRankingCard />
        </div>
      </FadeIn>
    </div>
  );
}
