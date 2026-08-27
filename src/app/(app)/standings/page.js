import DesktopStandingsScreen from '@/components/standings/DesktopStandingsScreen';
import MobileStandingsScreen from '@/components/mobile/screens/MobileStandingsScreen';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { getFullStandings, getLeagueOverview } from '@/lib/services/app/standingsService';

export const dynamic = 'force-dynamic';

export default async function StandingsPage() {
  if (!(await isPhonePresentation())) return <DesktopStandingsScreen />;

  const [standings, leagueTotals] = await Promise.all([getFullStandings(), getLeagueOverview()]);
  return <MobileStandingsScreen data={{ standings, leagueTotals }} />;
}
