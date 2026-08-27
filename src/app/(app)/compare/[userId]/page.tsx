import { auth } from '@/auth';
import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileMetric, MobileMetricGrid, MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getCompareDataLite } from '@/lib/services';

type PageProps = { params: Promise<{ userId: string }> };
type RecordValue = Record<string, any>;

export default async function CompareOpponentPage({ params }: PageProps) {
  const { userId } = await params;
  const route = await requireMobileRoute(`/compare/${userId}`);
  const [data, session] = await Promise.all([getCompareDataLite(), auth()]);
  const currentId = session?.user?.id ?? data.users[0]?.id;
  const current = data.users.find((user) => String(user.id) === String(currentId));
  const opponent = data.users.find((user) => String(user.id) === String(userId));
  if (!current || !opponent) return null;
  const currentStanding = data.standings.find((row: RecordValue) => String(row.user_id) === String(current.id));
  const opponentStanding = data.standings.find((row: RecordValue) => String(row.user_id) === String(opponent.id));
  const currentHistory = data.history.find((entry: RecordValue) => String(entry.userId) === String(current.id));
  const opponentHistory = data.history.find((entry: RecordValue) => String(entry.userId) === String(opponent.id));

  return (
    <MobileDetailScaffold title={route.definition.title} context={`${current.name} vs ${opponent.name}`} backHref="/compare">
      <div className="mobile-versus-header"><strong>{current.name}</strong><span>VS</span><strong>{opponent.name}</strong></div>
      <MobileMetricGrid>
        <MobileMetric label={`${current.name} puntos`} value={currentStanding?.total_points ?? 0} tone="accent" />
        <MobileMetric label={`${opponent.name} puntos`} value={opponentStanding?.total_points ?? 0} />
        <MobileMetric label={`${current.name} posición`} value={`#${currentStanding?.position ?? '—'}`} />
        <MobileMetric label={`${opponent.name} posición`} value={`#${opponentStanding?.position ?? '—'}`} />
      </MobileMetricGrid>
      <MobileSectionHeading>Últimas jornadas</MobileSectionHeading>
      <MobileRecordList data={[...(currentHistory?.history ?? []).slice(-5), ...(opponentHistory?.history ?? []).slice(-5)]} />
    </MobileDetailScaffold>
  );
}
