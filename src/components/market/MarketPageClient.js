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
import InfirmaryCard from './stats/InfirmaryCard';
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
import StatDetailDrawer from './stats/StatDetailDrawer';
import {
  Trophy,
  TrendingUp,
  Euro,
  Users,
  ShoppingCart,
  Activity,
  AlertTriangle,
  Clock,
  Flame,
  GanttChartSquare,
  Coins,
  Swords,
  ShieldAlert,
  Crown,
  Zap,
  Hourglass,
  Search,
  Stethoscope,
  Gem,
  Repeat,
} from 'lucide-react';

export default function MarketPageClient() {
  const [selectedDuel, setSelectedDuel] = useState(null);
  const [drawerData, setDrawerData] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    data: [],
    icon: Trophy,
    statType: 'player',
    color: 'blue',
  });

  const { data: statsData, loading } = useApiData('/api/market/stats');
  const marketStats = statsData || {};

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse mt-10">
        {/* Section 1 Skeleton */}
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-8 w-48 bg-white/10 rounded-lg mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card/40 border border-white/5 h-32 rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Section 2 Skeleton */}
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-8 w-48 bg-white/10 rounded-lg mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card/40 border border-white/5 h-48 rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Section 3 Skeleton */}
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-8 w-48 bg-white/10 rounded-lg mb-6" />
          <div className="h-80 bg-card/40 border border-white/5 rounded-2xl" />
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

  const handleOpenDrawer = (config) => {
    setDrawerData({
      ...config,
      isOpen: true,
    });
  };

  const handleCloseDrawer = () => {
    setDrawerData((prev) => ({ ...prev, isOpen: false }));
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          <RecordTransferCard
            data={marketStats.recordTransfer}
            onViewAll={() =>
              handleOpenDrawer({
                title: 'Récord de Traspasos',
                subtitle: 'Traspasos históricos entre managers',
                data: marketStats.recordTransfer,
                icon: Euro,
                statType: 'transaction',
                color: 'rose',
              })
            }
          />
          <BigSpenderCard
            data={marketStats.bigSpender}
            onViewAll={() =>
              handleOpenDrawer({
                title: 'Los Grandes Gastadores',
                subtitle: 'Managers con mayor inversión total',
                data: marketStats.bigSpender,
                icon: Gem,
                statType: 'user',
                color: 'cyan',
              })
            }
          />
          <BestSellerCard
            data={marketStats.bestSeller}
            onViewAll={() =>
              handleOpenDrawer({
                title: 'Los Mejores Vendedores',
                subtitle: 'Managers con mayores beneficios obtenidos',
                data: marketStats.bestSeller,
                icon: Coins,
                statType: 'user',
                color: 'emerald',
              })
            }
          />
          <TopTraderCard
            data={marketStats.topTrader}
            onViewAll={() =>
              handleOpenDrawer({
                title: 'El Especulador',
                subtitle: 'Managers con mayor volumen de operaciones (compra-venta)',
                data: marketStats.topTrader,
                icon: Repeat,
                statType: 'user',
                color: 'indigo',
              })
            }
          />
        </div>
      </Section>

      {/* Section: Inversiones */}
      <Section title="Inversiones y Plusvalías" delay={150} background="section-base">
        {/* Sub-section: Ganancias */}
        <div className="mb-8">
          <Subheading title="Ganancias" subtitle="Las mejores operaciones y plusvalías" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <BestFlipCard
              data={marketStats.bestFlip}
              onViewAll={() =>
                handleOpenDrawer({
                  title: 'El Pelotazo',
                  subtitle: 'Mayores plusvalías en una sola operación',
                  data: marketStats.bestFlip,
                  icon: TrendingUp,
                  statType: 'transaction',
                  color: 'emerald',
                })
              }
            />
            <BestRevaluationCard
              data={marketStats.bestRevaluation}
              onViewAll={() =>
                handleOpenDrawer({
                  title: 'El Diamante en Bruto',
                  subtitle: 'Mayores revalorizaciones (no realizadas)',
                  data: marketStats.bestRevaluation,
                  icon: Activity,
                  statType: 'player',
                  color: 'purple',
                })
              }
            />
            <BestPercentageCard
              data={marketStats.bestPercentage}
              onViewAll={() =>
                handleOpenDrawer({
                  title: 'Rentabilidad Relativa',
                  subtitle: 'Mayor % de beneficio sobre compra',
                  data: marketStats.bestPercentage,
                  icon: Activity,
                  statType: 'player',
                  color: 'cyan',
                })
              }
            />
            <BestValueCard
              data={marketStats.bestValue}
              onViewAll={() =>
                handleOpenDrawer({
                  title: 'Relación Calidad/Precio',
                  subtitle: 'Mejores puntos por millón invertido',
                  data: marketStats.bestValue,
                  icon: Star,
                  statType: 'player',
                  color: 'amber',
                })
              }
            />
          </div>
        </div>

        {/* Sub-section: Pérdidas */}
        <div className="mb-8">
          <Subheading title="Pérdidas" subtitle="Las peores operaciones y oportunidades perdidas" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <WorstFlipCard
              data={marketStats.worstFlip}
              onViewAll={() =>
                handleOpenDrawer({
                  title: 'El Fiasco',
                  subtitle: 'Mayores pérdidas en una sola operación',
                  data: marketStats.worstFlip,
                  icon: AlertTriangle,
                  statType: 'transaction',
                  color: 'red',
                })
              }
            />
            <WorstRevaluationCard
              data={marketStats.worstRevaluation}
              onViewAll={() =>
                handleOpenDrawer({
                  title: 'El Depreciado',
                  subtitle: 'Mayores depreciaciones en cartera',
                  data: marketStats.worstRevaluation,
                  icon: ShieldAlert,
                  statType: 'player',
                  color: 'pink',
                })
              }
            />
            <MissedOpportunityCard
              data={marketStats.missedOpportunity}
              onViewAll={() =>
                handleOpenDrawer({
                  title: 'El Impaciente',
                  subtitle: 'Jugadores vendidos que luego explotaron',
                  data: marketStats.missedOpportunity,
                  icon: Clock,
                  statType: 'player',
                  color: 'amber',
                })
              }
            />
          </div>
        </div>

        {/* Sub-section: Tiempos */}
        <div>
          <Subheading title="Tiempos" subtitle="Velocidad y paciencia en las operaciones" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <QuickflipCard
              data={marketStats.quickestFlip}
              onViewAll={() =>
                handleOpenDrawer({
                  title: 'El Quickflip',
                  subtitle: 'Operaciones de compraventa más veloces con beneficio',
                  data: marketStats.quickestFlip,
                  icon: Zap,
                  statType: 'transaction',
                  color: 'orange',
                })
              }
            />
            <LongestHoldCard
              data={marketStats.longestHold}
              onViewAll={() =>
                handleOpenDrawer({
                  title: 'El Hold',
                  subtitle: 'Inversiones más pacientes con beneficio final',
                  data: marketStats.longestHold,
                  icon: Hourglass,
                  statType: 'transaction',
                  color: 'teal',
                })
              }
            />
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
              <TheThiefCard
                data={marketStats.theThief}
                onViewAll={() =>
                  handleOpenDrawer({
                    title: 'El Ladrón',
                    subtitle: 'Especialistas en robar pujas disputadas',
                    data: marketStats.theThief,
                    icon: Flame,
                    statType: 'user',
                    color: 'red',
                  })
                }
              />
              <TheVictimCard
                data={marketStats.theVictim}
                onViewAll={() =>
                  handleOpenDrawer({
                    title: 'La Víctima',
                    subtitle: 'Managers que más finales de subasta pierden',
                    data: marketStats.theVictim,
                    icon: Swords,
                    statType: 'user',
                    color: 'pink',
                  })
                }
              />
              <OverpayerManagerCard
                data={marketStats.overpayerManager}
                onViewAll={() =>
                  handleOpenDrawer({
                    title: 'El Sobrepagador',
                    subtitle: 'Managers que pagan más de lo necesario por ganar',
                    data: marketStats.overpayerManager,
                    icon: GanttChartSquare,
                    statType: 'user',
                    color: 'amber',
                  })
                }
              />
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
              <RecordBidCard
                data={marketStats.recordBid}
                onViewAll={() =>
                  handleOpenDrawer({
                    title: 'La Puja Récord',
                    subtitle: 'Las pujas más altas registradas',
                    data: marketStats.recordBid,
                    icon: TrendingUp,
                    statType: 'transaction',
                    color: 'purple',
                  })
                }
              />
              <BiggestStealCard
                data={marketStats.biggestSteal}
                onViewAll={() =>
                  handleOpenDrawer({
                    title: 'Mayores Robos',
                    subtitle: 'Fichajes ganados por el margen más estrecho',
                    data: marketStats.biggestSteal,
                    icon: Search,
                    statType: 'transaction',
                    color: 'cyan',
                  })
                }
              />
              <TopTransferredCard
                data={marketStats.topPlayer}
                onViewAll={() =>
                  handleOpenDrawer({
                    title: 'El Más Deseado',
                    subtitle: 'Jugadores con mayor volumen de traspasos',
                    data: marketStats.topPlayer,
                    icon: Users,
                    statType: 'player',
                    color: 'orange',
                    showFilters: false,
                  })
                }
              />
              <MostOwnersCard
                data={marketStats.mostOwners}
                onViewAll={() =>
                  handleOpenDrawer({
                    title: 'El Inquieto',
                    subtitle: 'Jugadores que han pasado por más manos',
                    data: marketStats.mostOwners,
                    icon: Clock,
                    statType: 'player',
                    color: 'purple',
                    showFilters: false,
                  })
                }
              />
              <InflatedPlayerCard
                data={marketStats.inflatedPlayer}
                onViewAll={() =>
                  handleOpenDrawer({
                    title: 'El Inflado',
                    subtitle: 'Jugadores con mayor sobreprecio sobre valor inicial',
                    data: marketStats.inflatedPlayer,
                    icon: Flame,
                    statType: 'player',
                    color: 'rose',
                  })
                }
              />
              {marketStats.infirmary && (
                <InfirmaryCard
                  data={marketStats.infirmary}
                  onViewAll={() =>
                    handleOpenDrawer({
                      title: 'La Enfermería',
                      subtitle: 'Jugadores con mayor tasa de ausencias',
                      data: marketStats.infirmary,
                      icon: Stethoscope,
                      statType: 'player',
                      color: 'rose',
                    })
                  }
                />
              )}
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
        <div className="flex flex-col gap-8">
          {/* Finanzas Managers arriba */}
          <ManagerFinancesTable data={marketStats.managerStats} />
          {/* Mercado en Vivo debajo */}
          <LiveMarketTable />
        </div>
      </Section>

      {/* Global Ranking Sidebar */}
      <StatDetailDrawer
        isOpen={drawerData.isOpen}
        onClose={handleCloseDrawer}
        title={drawerData.title}
        subtitle={drawerData.subtitle}
        data={drawerData.data}
        icon={drawerData.icon}
        statType={drawerData.statType}
        color={drawerData.color}
        allUsers={marketStats.allUsers}
        showFilters={drawerData.showFilters}
      />
    </div>
  );
}
