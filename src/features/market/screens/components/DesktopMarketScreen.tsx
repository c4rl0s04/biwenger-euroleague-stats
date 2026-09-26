import { PageHeader } from '@/components/ui';
import MarketPageClient from './MarketPageClient';

/** Keep desktop analytics in its existing independently loaded browser flow. */
export default function DesktopMarketScreen() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full relative z-10">
        <PageHeader title="Mercado" description="Análisis de fichajes y oportunidades de mercado" />

        <MarketPageClient />
      </main>
    </div>
  );
}
