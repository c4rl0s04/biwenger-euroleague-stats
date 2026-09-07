import { DesktopStandingsScreen, MobileStandingsScreen } from '@/features/standings/public';

import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { getFullStandings, getLeagueOverview } from '@/features/standings/server';

export const dynamic = 'force-dynamic';

export default async function StandingsPage() {
  if (!(await isPhonePresentation())) return <DesktopStandingsScreen />;

  const [standings, leagueTotals] = await Promise.all([getFullStandings(), getLeagueOverview()]);
  return <MobileStandingsScreen data={{ standings, leagueTotals }} />;
}
