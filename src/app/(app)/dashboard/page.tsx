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
// News remains unchanged until Task 08; this page is its explicit temporary consumer.
import { fetchNewsFeed } from '@/lib/services/app/news-landing-legacy';

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
