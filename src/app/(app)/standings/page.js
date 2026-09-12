import { DesktopStandingsScreen, MobileStandingsScreen } from '@/features/standings/public';

import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { getStandingsOverview } from '@/features/standings/server';

export const dynamic = 'force-dynamic';

export default async function StandingsPage() {
  if (!(await isPhonePresentation())) return <DesktopStandingsScreen />;

  const data = await getStandingsOverview();
  return <MobileStandingsScreen data={data} />;
}
