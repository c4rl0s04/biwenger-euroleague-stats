'use client';

import { useState } from 'react';
import { useApiData } from '@/lib/hooks/useApiData';
import { Star } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { Section } from '@/components/layout';
import Subheading from '@/components/ui/Subheading';
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
import WorstFlipCard from './stats/WorstFlipCard';
import MissedOpportunityCard from './stats/MissedOpportunityCard';
import TopTraderCard from './stats/TopTraderCard';
import QuickflipCard from './stats/QuickflipCard';
import LongestHoldCard from './stats/LongestHoldCard';
import WorstRevaluationCard from './stats/WorstRevaluationCard';
import BestPercentageCard from './stats/BestPercentageCard';
import TheThiefCard from './stats/TheThiefCard';
import BiggestStealCard from './stats/BiggestStealCard';
import TheVictimCard from './stats/TheVictimCard';
import OverpayerManagerCard from './stats/OverpayerManagerCard';
import BiddingDuelsMatrixCard from './stats/BiddingDuelsMatrixCard';
import BiddingDuelDetailsCard from './stats/BiddingDuelDetailsCard';
import HottestRivalryCard from './stats/HottestRivalryCard';
import BiggestDominanceCard from './stats/BiggestDominanceCard';
import MarketTrendsChart from './stats/MarketTrendsChart';
import PositionAnalysisGrid from './stats/PositionAnalysisGrid';
import LiveMarketTable from './LiveMarketTable';
import ManagerFinancesTable from './stats/ManagerFinancesTable';
import MarketListingsSection from './MarketListingsSection';
import AnalyticsDemoShowroom from './AnalyticsDemoShowroom';
import InflatedPlayerCard from './stats/InflatedPlayerCard';

export default function MarketPageClient() {
  const [selectedDuel, setSelectedDuel] = useState(null);
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

  const handleSelectDuel = (duelSelection) => {
    setSelectedDuel((currentSelection) => {
      if (
        currentSelection?.user?.id === duelSelection.user.id &&
        currentSelection?.opponent?.id === duelSelection.opponent.id
      ) {
        return null;
      }

      return duelSelection;
    });
  };

  return (
    <div>
      {/* 1. KPIs Section */}
      <Section title="Resumen de Mercado" delay={0} background="section-base">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MarketKPIs kpis={marketStats.kpis} />
        </div>
      </Section>

      {/* NEW: Jugadores en el Mercado (with filters) */}
      <MarketListingsSection listings={marketStats.currentMarketListings} />

      {/* Section: Transacciones */}
      <Section title="Transacciones Destacadas" delay={100} background="section-raised">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <RecordTransferCard record={marketStats.recordTransfer} />
          <BigSpenderCard spender={marketStats.bigSpender} />
          <BestSellerCard seller={marketStats.bestSeller} />
        </div>
      </Section>

      {/* Section: Inversiones */}
      <Section title="Inversiones y Plusvalías" delay={150} background="section-base">
        {/* Sub-section: Ganancias */}
        <div className="mb-8">
          <Subheading title="Ganancias" subtitle="Las mejores operaciones y plusvalías" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <BestFlipCard flip={marketStats.bestFlip} />
            <BestRevaluationCard data={marketStats.bestRevaluation} />
            <BestPercentageCard data={marketStats.bestPercentage} />
            <BestValueCard player={marketStats.bestValue} />
          </div>
        </div>

        {/* Sub-section: Pérdidas */}
        <div className="mb-8">
          <Subheading title="Pérdidas" subtitle="Las peores operaciones y oportunidades perdidas" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <WorstFlipCard flip={marketStats.worstFlip} />
            <WorstRevaluationCard data={marketStats.worstRevaluation} />
            <MissedOpportunityCard data={marketStats.missedOpportunity} />
          </div>
        </div>

        {/* Sub-section: Tiempos */}
        <div>
          <Subheading title="Tiempos" subtitle="Velocidad y paciencia en las operaciones" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <QuickflipCard data={marketStats.quickestFlip} />
            <LongestHoldCard data={marketStats.longestHold} />
          </div>
        </div>
      </Section>

      {/* Section: Pujas + Mercado competitivo */}
      <Section title="Pujas y Pulso del Mercado" delay={200} background="section-raised">
        <div className="space-y-8">
          <div>
            <Subheading
              title="Managers en la Subasta"
              subtitle="Quién roba más operaciones disputadas, quién pierde más finales y quién termina pagando de más por ganar"
            />
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              <TheThiefCard data={marketStats.theThief} />
              <TheVictimCard data={marketStats.theVictim} />
              <OverpayerManagerCard data={marketStats.overpayerManager} />
            </div>

            <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6 xl:items-stretch items-start">
              <div className="xl:col-span-2 h-full">
                <BiddingDuelsMatrixCard
                  data={marketStats.biddingDuels}
                  onSelectDuel={handleSelectDuel}
                  selectedDuel={selectedDuel}
                />
              </div>
              <div className="h-full flex flex-col gap-6">
                <div className="flex-1">
                  <HottestRivalryCard data={marketStats.biddingDuels?.hottestRivalry} />
                </div>
                <div className="flex-1">
                  <BiggestDominanceCard data={marketStats.biddingDuels?.biggestDominance} />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <BiddingDuelDetailsCard
                selectedDuel={selectedDuel}
                onClear={() => setSelectedDuel(null)}
              />
            </div>
          </div>

          <div>
            <Subheading
              title="Jugadores Bajo el Martillo"
              subtitle="Los nombres que concentran pujas, rotación, sobreprecio, robos ajustados y también grandes decepciones"
            />
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              <RecordBidCard record={marketStats.recordBid} />
              <BiggestStealCard data={marketStats.biggestSteal} />
              <TopTransferredCard player={marketStats.topPlayer} />
              <MostOwnersCard player={marketStats.mostOwners} />
              <InflatedPlayerCard data={marketStats.inflatedPlayer} />
              {marketStats.worstValue && <WorstValueCard player={marketStats.worstValue} />}
            </div>
          </div>
        </div>
      </Section>

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
