import RoundsPageClient from '@/components/rounds/RoundsPageClient';
import { PageHeader } from '@/components/ui';
import { auth } from '@/auth';
import MobileRoundsScreen from '@/components/mobile/screens/MobileRoundsScreen';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { fetchRoundCompleteData, fetchRoundsList } from '@/lib/services';

/**
 * Lineups Page
 *
 * Squad management and lineup analysis.
 *
 * See PAGE_ARCHITECTURE.md section 7 for full layout specification.
 */

export default async function LineupsPage({ searchParams }) {
  if (await isPhonePresentation()) {
    const session = await auth();
    const userId = session?.user?.id;
    const params = await searchParams;
    const lists = await fetchRoundsList();
    const activeRoundId = params?.roundId ?? lists.defaultRoundId ?? lists.rounds[0]?.round_id;
    const roundData = userId && activeRoundId ? await fetchRoundCompleteData(activeRoundId, userId) : null;
    return <MobileRoundsScreen rounds={lists.rounds} activeRoundId={activeRoundId} roundData={roundData} userId={userId} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full relative z-10">
        {/* Header Section */}
        <PageHeader
          title="Jornadas"
          description="Análisis de alineaciones, puntuaciones y clasificación jornada a jornada."
        />

        <RoundsPageClient />
      </main>
    </div>
  );
}
