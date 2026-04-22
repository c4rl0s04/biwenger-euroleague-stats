import { getPlayoffLeaderboard, getTeams } from '@/lib/services/features/playoffService';
import PlayoffClient from '@/components/playoffs/PlayoffClient';
import { PageHeader } from '@/components/ui';

export const metadata = {
  title: 'Playoff Predictions - BiwengerStats',
  description: 'Clasificación y predicciones de los playoffs y play-in de la Euroleague.',
};

// Revalidate every 10 minutes
export const revalidate = 600;

export default async function PlayoffPage() {
  const leaderboard = await getPlayoffLeaderboard();
  const teams = await getTeams();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Playoffs & Play-in"
        description="Seguimiento de las predicciones de los playoffs de la Euroleague. Compara tus resultados con tus amigos."
      />

      <PlayoffClient leaderboard={leaderboard} teams={teams} />
    </div>
  );
}
