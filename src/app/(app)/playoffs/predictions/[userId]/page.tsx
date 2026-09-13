import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getPlayoffDetail } from '@/features/playoffs/server';
import { PlayoffDetailScreen } from '@/features/playoffs/public';
type PageProps = { params: Promise<{ userId: string }> };
export default async function PlayoffPredictionPage({ params }: PageProps) {
  const { userId } = await params;
  const route = await requireMobileRoute(`/playoffs/predictions/${userId}`);
  const model = await getPlayoffDetail(userId);
  if (!model) return null;
  return <PlayoffDetailScreen model={model} title={route.definition.title} />;
}
