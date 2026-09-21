import { auth } from '@/auth';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import {
  MobileDashboardSectionScreen,
  type DashboardSectionContent,
} from '@/features/dashboard/public';
import {
  getLeagueDashboardData,
  getNextRoundData,
  getUserDashboardData,
} from '@/features/dashboard/server';

type PageProps = { params: Promise<{ section: string }> };

export default async function DashboardSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = await requireMobileRoute(`/dashboard/${section}`);
  const session = await auth();
  const userId = session?.user?.id;
  let data: DashboardSectionContent;
  if (section === 'season' || section === 'comparison') {
    data = { kind: section, dashboard: userId ? await getUserDashboardData(userId) : {} };
  } else if (section === 'next-round' || section === 'market') {
    data = { kind: section, round: await getNextRoundData(userId ?? null) };
  } else {
    data = { kind: 'league', league: await getLeagueDashboardData() };
  }
  return <MobileDashboardSectionScreen title={route.definition.title} data={data} />;
}
