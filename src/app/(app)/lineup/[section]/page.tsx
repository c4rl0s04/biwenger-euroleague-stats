import { auth } from '@/auth';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getLineupSectionData } from '@/features/lineup/server';
import { LineupSectionScreen } from '@/features/lineup/public';

type PageProps = { params: Promise<{ section: string }> };
export default async function LineupSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = await requireMobileRoute(`/lineup/${section}`);
  const session = await auth();
  const model = await getLineupSectionData(session?.user?.id);
  return <LineupSectionScreen section={section} title={route.definition.title} model={model} />;
}
