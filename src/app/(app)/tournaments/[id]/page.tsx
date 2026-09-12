import { notFound } from 'next/navigation';
import {
  getTournamentDetails,
  getStandings,
  getFixtures,
  getTournamentInitialRoundId,
} from '@/features/tournaments/server';
import {
  DesktopTournamentDetailScreen,
  MobileTournamentDetailScreen,
} from '@/features/tournaments/public';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export const dynamic = 'force-dynamic';

export default async function TournamentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tournament, phone] = await Promise.all([getTournamentDetails(id), isPhonePresentation()]);
  if (!tournament) notFound();
  const [standings, fixtures] = await Promise.all([getStandings(id), getFixtures(id)]);
  if (phone) {
    return (
      <MobileTournamentDetailScreen
        tournament={tournament}
        standings={standings}
        fixtures={fixtures}
      />
    );
  }
  const initialRoundId = await getTournamentInitialRoundId(tournament, fixtures);
  return (
    <DesktopTournamentDetailScreen
      tournament={tournament}
      standings={standings}
      fixtures={fixtures}
      initialRoundId={initialRoundId}
    />
  );
}
