import { getAllTournaments, getGlobalTournamentStats } from '@/features/tournaments/server';
import { DesktopTournamentsScreen, MobileTournamentsScreen } from '@/features/tournaments/public';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export default async function TournamentsPage() {
  const [tournamentsData, phone] = await Promise.all([getAllTournaments(), isPhonePresentation()]);
  const { active, finished } = tournamentsData;
  if (phone) return <MobileTournamentsScreen active={active} finished={finished} />;
  const statistics = await getGlobalTournamentStats();
  return <DesktopTournamentsScreen active={active} finished={finished} statistics={statistics} />;
}
