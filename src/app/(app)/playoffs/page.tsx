import { getPlayoffOverview } from '@/features/playoffs/server';
import { PlayoffClient, MobilePlayoffsScreen } from '@/features/playoffs/public';
import { PageHeader } from '@/components/ui';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export const metadata = {
  title: 'Playoff Predictions - BiwengerStats',
  description: 'Clasificación y predicciones de los playoffs y play-in de la Euroleague.',
};

// Revalidate every 10 minutes
export const revalidate = 600;

export default async function PlayoffPage() {
  const model = await getPlayoffOverview(isPhonePresentation());

  if (model.presentation === 'phone')
    return <MobilePlayoffsScreen leaderboard={model.leaderboard} />;

  const { leaderboard, teams } = model;

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
