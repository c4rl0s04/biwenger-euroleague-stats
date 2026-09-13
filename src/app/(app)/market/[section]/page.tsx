import MobileRecordList from '@/components/mobile/MobileRecordList';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { fetchMarketStats, getMobileMarketSection } from '@/features/market/server';
import { MarketSectionRows, MarketSectionScreen } from '@/features/market/public';

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
    <MarketSectionScreen title={route.definition.title} section={section}>
      {model ? <MarketSectionRows {...model} /> : <MobileRecordList data={data} />}
    </MarketSectionScreen>
  );
}
