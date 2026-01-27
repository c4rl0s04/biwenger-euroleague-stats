import { getMatchesGroupedByRound } from '@/lib/db/queries/matches';
import MatchesClient from '@/components/matches/MatchesClient';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function MatchesPage() {
  const { rounds, currentRoundId } = await getMatchesGroupedByRound();

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-12 pb-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-display mb-4 flex items-center gap-4">
            <span className="w-1.5 h-12 bg-gradient-to-b from-primary to-orange-400 rounded-full"></span>
            <span className="text-gradient">Partidos</span>
          </h1>
          <p className="text-muted-foreground text-lg w-full border-b border-border/50 pb-6">
            Calendario y resultados de la temporada
          </p>
        </div>
      </div>

      {/* Matches - Full width for section backgrounds */}
      <MatchesClient rounds={rounds} defaultRoundId={currentRoundId} />
    </div>
  );
}
