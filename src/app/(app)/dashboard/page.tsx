import { auth } from '@/auth';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import {
  DesktopDashboardScreen,
  MobileDashboardScreen,
  toMobileDashboardViewModel,
} from '@/features/dashboard/public';
import {
  getLeagueDashboardData,
  getNextRoundData,
  getUserDashboardData,
} from '@/features/dashboard/server';
// Compose News directly through its server contract; no internal HTTP hop.
import { fetchNewsFeed } from '@/features/news/server';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  if (!(await isPhonePresentation())) return <DesktopDashboardScreen />;

  const session = await auth();
  const userId = session?.user?.id;
  const [userDashboard, leagueDashboard, nextRoundData, news] = await Promise.all([
    userId ? getUserDashboardData(userId) : Promise.resolve({}),
    getLeagueDashboardData(),
    getNextRoundData(userId ?? null),
    fetchNewsFeed(),
  ]);

  return (
    <MobileDashboardScreen
      data={toMobileDashboardViewModel({
        userDashboard,
        leagueDashboard,
        nextRoundData,
        news,
      })}
    />
  );
}
