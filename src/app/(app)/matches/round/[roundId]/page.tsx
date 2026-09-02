import { MatchRoundScreen } from '@/features/matches/public';
import { getMatchRoundScreenData } from '@/features/matches/server';
import { requireMobileRoute } from '@/lib/mobile/route-server';

type PageProps = { params: Promise<{ roundId: string }> };

export default async function MatchRoundPage({ params }: PageProps) {
  const { roundId } = await params;
  const [route, model] = await Promise.all([
    requireMobileRoute(`/matches/round/${roundId}`),
    getMatchRoundScreenData(roundId),
  ]);
  return <MatchRoundScreen model={model} fallbackTitle={route.definition.title} />;
}
