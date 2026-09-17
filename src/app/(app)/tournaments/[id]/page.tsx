import { notFound } from 'next/navigation';
import { getTournamentDetailScreen } from '@/features/tournaments/server';
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
  const model = await getTournamentDetailScreen(id, isPhonePresentation);
  if (!model) notFound();
  return model.screen === 'phone' ? (
    <MobileTournamentDetailScreen {...model.props} />
  ) : (
    <DesktopTournamentDetailScreen {...model.props} />
  );
}
