import { ScheduleMapScreen } from '@/features/schedule/public';
import { getScheduleMapData, type ScheduleSearchParams } from '@/features/schedule/server';
import { requireMobileRoute } from '@/lib/mobile/route-server';

export default async function ScheduleMapPage({
  searchParams,
}: {
  searchParams: Promise<ScheduleSearchParams>;
}) {
  await requireMobileRoute('/schedule/map');
  const { roundId } = await searchParams;
  return <ScheduleMapScreen model={await getScheduleMapData(roundId)} />;
}
