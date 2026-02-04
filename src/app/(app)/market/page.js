import MarketPageClient from '@/components/market/MarketPageClient';
import { PageHeader } from '@/components/ui';

/**
 * Market Page
 *
 * Current market status and transfer history.
 *
 * See PAGE_ARCHITECTURE.md section 8 for full layout specification.
 */

export default function MarketPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full relative z-10">
        <PageHeader title="Mercado" description="Análisis de fichajes y oportunidades de mercado" />

        <MarketPageClient />
      </main>
    </div>
  );
}
