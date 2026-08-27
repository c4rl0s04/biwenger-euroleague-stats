import { auth } from '@/auth';
import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileOffersClient from '@/components/mobile/screens/MobileOffersClient';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileMetric, MobileMetricGrid, MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { fetchUserSquadDetails } from '@/lib/services';

type PageProps = { params: Promise<{ section: string }> };
type RecordValue = Record<string, any>;

export default async function LineupSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = await requireMobileRoute(`/lineup/${section}`);
  const session = await auth();
  const userId = session?.user?.id;
  const squad = userId ? ((await fetchUserSquadDetails(userId)) as RecordValue) : {};

  return (
    <MobileDetailScaffold title={route.definition.title} context="Alineación" backHref="/lineup">
      {section === 'analysis' && (
        <MobileMetricGrid>
          <MobileMetric label="Jugadores" value={squad.player_count ?? squad.players?.length ?? 0} tone="accent" />
          <MobileMetric label="Valor" value={`${Number(squad.total_value ?? 0).toLocaleString('es-ES')}€`} />
          <MobileMetric label="Subiendo" value={squad.top_rising?.length ?? 0} tone="positive" />
          <MobileMetric label="Bajando" value={squad.top_falling?.length ?? 0} tone="negative" />
        </MobileMetricGrid>
      )}
      <MobileSectionHeading>{section === 'offers' ? 'Pendientes' : 'Plantilla'}</MobileSectionHeading>
      {section === 'offers' ? <MobileOffersClient /> : <MobileRecordList data={squad.players ?? squad} linkPrefix="/player" />}
    </MobileDetailScaffold>
  );
}
