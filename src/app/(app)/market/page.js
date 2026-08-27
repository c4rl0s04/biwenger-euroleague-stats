import MarketPageClient from '@/components/market/MarketPageClient';
import { PageHeader } from '@/components/ui';
import MobileMarketScreen from '@/components/mobile/screens/MobileMarketScreen';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { fetchCurrentMarketListings, fetchMarketKPIs, fetchRecentTransfers } from '@/lib/services';

/**
 * Market Page
 *
 * Current market status and transfer history.
 *
 * See PAGE_ARCHITECTURE.md section 8 for full layout specification.
 */

export default async function MarketPage() {
  if (await isPhonePresentation()) {
    const [listings, kpis, recentTransfers] = await Promise.all([
      fetchCurrentMarketListings(),
      fetchMarketKPIs(),
      fetchRecentTransfers(4),
    ]);
    return <MobileMarketScreen listings={listings} kpis={kpis} recentTransfers={recentTransfers} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full relative z-10">
        <PageHeader title="Mercado" description="Análisis de fichajes y oportunidades de mercado" />

        <MarketPageClient />
      </main>
    </div>
  );
}
