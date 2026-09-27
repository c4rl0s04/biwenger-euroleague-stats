import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getMobileMarketSection } from '@/features/market/server';
import { MarketSectionRows, MarketSectionScreen } from '@/features/market/public';

type PageProps = { params: Promise<{ section: string }> };

export default async function MarketSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = await requireMobileRoute(`/market/${section}`);
  const model = await getMobileMarketSection(
    section === 'transfers' || section === 'trends' || section === 'bids' ? section : 'investments'
  );
  return (
    <MarketSectionScreen title={route.definition.title} section={section}>
      <MarketSectionRows {...model} />
    </MarketSectionScreen>
  );
}
