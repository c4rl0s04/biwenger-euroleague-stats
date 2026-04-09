'use client';

import { Gem } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function BestPercentageCard({ data, onViewAll }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={data}
      title="Diamante en Bruto"
      icon={Gem}
      color="cyan"
      info={
        <>
          <TooltipHeader>Diamante en Bruto</TooltipHeader>
          <p>
            Muestra los jugadores que más han multiplicado su valor inicial en términos
            porcentuales. Premia a los managers con ojo clínico para detectar talentos
            infravalorados antes de su explosión.
          </p>
        </>
      }
      winnerLabel="DIAMANTE EN BRUTO"
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-cyan-400">
          +{item.percentage_gain?.toFixed(0)}%
        </span>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            { label: 'Compra', value: formatEuro(item.purchase_price), suffix: '€' },
            { label: 'Valor', value: formatEuro(item.current_price), suffix: '€' },
          ]}
        />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <span className="text-lg font-black text-cyan-400">
          +{item.percentage_gain?.toFixed(0)}%
        </span>
      )}
      renderRunnerUpMeta={(item) => <ManagerName user={item} className="text-xs" />}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-cyan-400">
          +{item.percentage_gain?.toFixed(0)}%
        </span>
      )}
      renderListItemMeta={(item) => <ManagerName user={item} className="text-[10px] ml-2" />}
    />
  );
}
