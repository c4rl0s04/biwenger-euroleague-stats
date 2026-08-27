import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import {
  fetchAllTransfers,
  fetchMarketStats,
  fetchMarketTrendsAnalysis,
} from '@/lib/services';

type PageProps = { params: Promise<{ section: string }> };
type RecordValue = Record<string, any>;

async function loadSection(section: string): Promise<unknown> {
  if (section === 'transfers') return fetchAllTransfers();
  if (section === 'trends') return fetchMarketTrendsAnalysis(30);

  const stats = (await fetchMarketStats()) as RecordValue;
  if (section === 'bids') {
    return [
      ...(stats.recordBid ?? []),
      ...(stats.biddingDuels ?? []),
      ...(stats.overpayerManager ?? []),
    ];
  }
  return [
    ...(stats.bestFlip ?? []),
    ...(stats.bestRevaluation ?? []),
    ...(stats.worstFlip ?? []),
    ...(stats.missedOpportunity ?? []),
  ];
}

const descriptions: Record<string, string> = {
  transfers: 'Todas las compras y ventas de la liga en una cronología legible.',
  investments: 'Operaciones que generaron valor y decisiones que lo destruyeron.',
  bids: 'Competencia real por los jugadores: pujas, rivales y sobreprecios.',
  trends: 'Cómo evolucionan el volumen y el precio de las operaciones.',
};

export default async function MarketSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = await requireMobileRoute(`/market/${section}`);
  const data = await loadSection(section);

  return (
    <MobileDetailScaffold
      title={route.definition.title}
      context="Mercado"
      backHref="/market"
      description={descriptions[section]}
    >
      <MobileSectionHeading>Detalle</MobileSectionHeading>
      <MobileRecordList data={data} linkPrefix={section === 'transfers' ? '/player' : undefined} />
    </MobileDetailScaffold>
  );
}
