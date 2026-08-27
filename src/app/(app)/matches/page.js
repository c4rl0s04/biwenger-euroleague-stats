import { fetchMatchesGrouped } from '@/lib/services';
import MatchesClient from '@/components/matches/MatchesClient';
import { PageHeader } from '@/components/ui';
import MobileMatchesScreen from '@/components/mobile/screens/MobileMatchesScreen';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function MatchesPage({ searchParams }) {
  const { rounds, currentRoundId } = await fetchMatchesGrouped();
  const params = await searchParams;
  const selectedRoundId = params?.roundId ?? currentRoundId ?? rounds[0]?.round_id;

  if (await isPhonePresentation()) {
    return <MobileMatchesScreen rounds={rounds} activeRoundId={selectedRoundId} />;
  }

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
