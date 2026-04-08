'use client';

import { TrendingDown } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function WorstRevaluationCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const formatShortEuro = (val) => {
    const absVal = Math.abs(val);
    if (absVal >= 1000000) return (absVal / 1000000).toFixed(1) + 'M';
    if (absVal >= 1000) return (absVal / 1000).toFixed(0) + 'k';
    return absVal?.toLocaleString('es-ES');
  };

  return (
    <MarketPodiumCard
      data={data}
      title="El Depreciado"
      icon={TrendingDown}
      color="pink"
      info={
        <>
          <TooltipHeader>El Depreciado</TooltipHeader>
          <p>
            Muestra los jugadores que más valor han perdido desde que fueron fichados. Representa el
            &quot;coste de oportunidad&quot; y la pérdida potencial de los managers que mantienen a
            estos jugadores.
          </p>
        </>
      }
      winnerLabel="EL DEPRECIADO"
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-rose-400">
          -{formatShortEuro(item.devaluation)}€
        </span>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            { label: 'Compra', value: formatShortEuro(item.purchase_price), suffix: '€' },
            { label: 'Valor', value: formatShortEuro(item.current_price), suffix: '€' },
          ]}
        />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <span className="text-sm font-black text-rose-400">
          -{formatShortEuro(item.devaluation)}€
        </span>
      )}
      renderRunnerUpMeta={(item) => (
        <ManagerName user={item} className="text-[10px] opacity-80 hover:opacity-100" />
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-rose-400/80">
          -{formatShortEuro(item.devaluation)}€
        </span>
      )}
      renderListItemMeta={(item) => (
        <ManagerName
          user={item}
          className="text-[9px] font-black uppercase tracking-wider opacity-60 hover:opacity-100 ml-2"
        />
      )}
    />
  );
}
