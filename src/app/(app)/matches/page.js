import { getMatchesGroupedByRound } from '@/lib/db/queries/matches';
import MatchesClient from '@/components/matches/MatchesClient';
import { PageHeader } from '@/components/ui';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function MatchesPage() {
  const { rounds, currentRoundId } = await getMatchesGroupedByRound();

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <PageHeader
        title="Partidos"
        description="Calendario y resultados de la temporada"
        className="pb-10"
      />

      {/* Matches - Full width for section backgrounds */}
      <MatchesClient rounds={rounds} defaultRoundId={currentRoundId} />
    </div>
  );
}
