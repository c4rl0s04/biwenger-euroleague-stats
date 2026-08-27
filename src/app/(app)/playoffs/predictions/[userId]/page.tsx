import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileMetric, MobileMetricGrid, MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getPlayoffLeaderboard } from '@/lib/services/features/playoffService';

type PageProps = { params: Promise<{ userId: string }> };

export default async function PlayoffPredictionPage({ params }: PageProps) {
  const { userId } = await params;
  const route = await requireMobileRoute(`/playoffs/predictions/${userId}`);
  const leaderboard = await getPlayoffLeaderboard();
  const user = leaderboard.find((entry) => String(entry.userId) === String(userId));
  if (!user) return null;

  return (
    <MobileDetailScaffold title={route.definition.title} context={user.userName} backHref="/playoffs">
      <MobileMetricGrid>
        <MobileMetric label="Puntos" value={user.points} tone="accent" />
        <MobileMetric label="Aciertos" value={`${user.correctCount}/${user.totalCount}`} />
        <MobileMetric label="Precisión" value={`${user.accuracy.toFixed(0)}%`} tone="positive" />
        <MobileMetric label="Predicciones" value={user.predictions.length} />
      </MobileMetricGrid>
      <MobileSectionHeading>Cuadro</MobileSectionHeading>
      <MobileRecordList data={user.predictions} />
    </MobileDetailScaffold>
  );
}
