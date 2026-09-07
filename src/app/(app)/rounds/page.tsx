import { auth } from '@/auth';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { MobileRoundsScreen, RoundsScreen } from '@/features/rounds/public';
import { getRoundOverviewData } from '@/features/rounds/server';

export default async function RoundsPage({
  searchParams,
}: {
  searchParams: Promise<{ roundId?: string }>;
}) {
  if (await isPhonePresentation()) {
    const session = await auth();
    const params = await searchParams;
    return (
      <MobileRoundsScreen data={await getRoundOverviewData(session?.user?.id, params?.roundId)} />
    );
  }
  return <RoundsScreen />;
}
