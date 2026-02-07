'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Star } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { Section } from '@/components/layout';
import MarketKPIs from './stats/MarketKPIs';
import TopTransferredCard from './stats/TopTransferredCard';
import RecordTransferCard from './stats/RecordTransferCard';
import BigSpenderCard from './stats/BigSpenderCard';
import RecordBidCard from './stats/RecordBidCard';
import BestSellerCard from './stats/BestSellerCard';
import BestRevaluationCard from './stats/BestRevaluationCard';
import BestValueCard from './stats/BestValueCard';
import WorstValueCard from './stats/WorstValueCard';
import MostOwnersCard from './stats/MostOwnersCard';
import BestFlipCard from './stats/BestFlipCard';
import BestPercentageCard from './stats/BestPercentageCard';
import TheThiefCard from './stats/TheThiefCard';
import BiggestStealCard from './stats/BiggestStealCard';
import TheVictimCard from './stats/TheVictimCard';
import MarketTrendsChart from './stats/MarketTrendsChart';
import PositionAnalysisGrid from './stats/PositionAnalysisGrid';
import LiveMarketTable from './LiveMarketTable';
import ManagerFinancesTable from './stats/ManagerFinancesTable';

export default function MarketPageClient() {
  const { data: statsData, loading } = useApiData('/api/market/stats');
  const marketStats = statsData || {};

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse mt-10">
        {/* Section 1 Skeleton */}
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-8 w-48 bg-zinc-800 rounded mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 h-32 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Section 2 Skeleton */}
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-8 w-48 bg-zinc-800 rounded mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 h-48 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Section 3 Skeleton */}
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-8 w-48 bg-zinc-800 rounded mb-6" />
          <div className="h-80 bg-zinc-900 border border-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 1. KPIs Section */}
      <Section title="Resumen de Mercado" delay={0} background="section-base">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MarketKPIs kpis={marketStats.kpis} />
        </div>
      </Section>

      {/* Section: Transacciones */}
      <Section title="Transacciones Destacadas" delay={100} background="section-raised">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RecordTransferCard record={marketStats.recordTransfer} />
          <BigSpenderCard spender={marketStats.bigSpender} />
          <BestSellerCard seller={marketStats.bestSeller} />
        </div>
      </Section>

      {/* Section: Inversiones */}
      <Section title="Inversiones y Plusvalías" delay={150} background="section-base">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BestValueCard player={marketStats.bestValue} />
          <BestFlipCard flip={marketStats.bestFlip} />
          <BestRevaluationCard data={marketStats.bestRevaluation} />
          <BestPercentageCard data={marketStats.bestPercentage} />
        </div>
      </Section>

      {/* Section: Pujas */}
      <Section title="Pujas y Subastas" delay={200} background="section-raised">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TheThiefCard data={marketStats.theThief} />
          <BiggestStealCard data={marketStats.biggestSteal} />
          <RecordBidCard record={marketStats.recordBid} />
          <TheVictimCard data={marketStats.theVictim} />
          <MostOwnersCard player={marketStats.mostOwners} />
          <TopTransferredCard player={marketStats.topPlayer} />
        </div>
      </Section>

      {/* 2d. The Flop Section (Optional or End) */}
      {marketStats.worstValue && (
        <Section delay={220}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-start-2">
              <WorstValueCard player={marketStats.worstValue} />
            </div>
          </div>
        </Section>
      )}

      {/* 3. Charts Section */}
      <Section title="Tendencias y Análisis" delay={200} background="section-base">
        <div className="space-y-6">
          <MarketTrendsChart trends={marketStats.trends} />
          <PositionAnalysisGrid positionStats={marketStats.positionStats} />
        </div>
      </Section>

      {/* 4. Live Market & Finances Section */}
      <Section title="Mercado y Fichajes" delay={300} background="section-raised">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Finances Column */}
          <div className="xl:col-span-1">
            <ManagerFinancesTable stats={marketStats.managerStats} />
          </div>

          {/* Live Market Column */}
          <div className="xl:col-span-2">
            <LiveMarketTable />
          </div>
        </div>
      </Section>
    </div>
  );
}
