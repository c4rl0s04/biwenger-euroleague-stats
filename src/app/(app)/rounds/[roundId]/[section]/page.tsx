import { auth } from '@/auth';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { RoundSectionScreen } from '@/features/rounds/public';
import { getRoundSectionData } from '@/features/rounds/server';

type PageProps = { params: Promise<{ roundId: string; section: string }> };

export default async function RoundSectionPage({ params }: PageProps) {
  const { roundId, section } = await params;
  const route = await requireMobileRoute(`/rounds/${roundId}/${section}`);
  const session = await auth();
  const data = await getRoundSectionData(roundId, section, session?.user?.id);
  return (
    <RoundSectionScreen
      title={route.definition.title}
      roundId={roundId}
      section={section}
      data={data}
    />
  );
}
