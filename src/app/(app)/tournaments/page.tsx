import { getTournamentCatalogueScreen } from '@/features/tournaments/server';
import { DesktopTournamentsScreen, MobileTournamentsScreen } from '@/features/tournaments/public';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export default async function TournamentsPage() {
  const model = await getTournamentCatalogueScreen(isPhonePresentation);
  return model.screen === 'phone' ? (
    <MobileTournamentsScreen {...model.props} />
  ) : (
    <DesktopTournamentsScreen {...model.props} />
  );
}
