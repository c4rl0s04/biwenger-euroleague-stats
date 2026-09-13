import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { fetchMarketStats, getMobileMarketSection } from '@/features/market/server';
import { MarketSectionRows } from '@/features/market/public';

type PageProps = { params: Promise<{ section: string }> };
type RecordValue = Record<string, any>;

async function loadLegacyBids(): Promise<unknown> {
  const stats = (await fetchMarketStats()) as RecordValue;
  return [
    ...(stats.recordBid ?? []),
    ...(stats.biddingDuels ?? []),
    ...(stats.overpayerManager ?? []),
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
  // Keep the known non-iterable bids path untouched until its behavior fix is approved.
  const data = section === 'bids' ? await loadLegacyBids() : null;
  const model =
    section !== 'bids'
      ? await getMobileMarketSection(
          section === 'transfers' || section === 'trends' ? section : 'investments'
        )
      : null;

  return (
    <MobileDetailScaffold
      title={route.definition.title}
      context="Mercado"
      backHref="/market"
      description={descriptions[section]}
    >
      <MobileSectionHeading>Detalle</MobileSectionHeading>
      {model ? <MarketSectionRows {...model} /> : <MobileRecordList data={data} />}
    </MobileDetailScaffold>
  );
}
