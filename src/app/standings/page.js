import FullStandingsCard from '@/components/clasificacion/FullStandingsCard';
import LeagueStatsCard from '@/components/clasificacion/LeagueStatsCard';
import RoundWinnersCard from '@/components/clasificacion/RoundWinnersCard';
import PointsProgressionCard from '@/components/clasificacion/PointsProgressionCard';
import TeamValueRankingCard from '@/components/clasificacion/TeamValueRankingCard';
import FadeIn from '@/components/ui/FadeIn';

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

      {/* Points Progression + Value Ranking */}
      <FadeIn delay={300}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PointsProgressionCard />
          <TeamValueRankingCard />
        </div>
      </FadeIn>
    </div>
  );
}
