'use client';

import { BadgePercent } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup } from './StatUIComponents';

export default function InflatedPlayerCard({ data }) {
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
      title="El Inflado"
      icon={BadgePercent}
      color="rose"
      info={
        <>
          <TooltipHeader>El Inflado</TooltipHeader>
          <p>
            Identifica a los jugadores por los que los managers han pagado más dinero por encima de
            su valor de mercado. Refleja las mayores apuestas (o sobrepagos) de la temporada.
          </p>
        </>
      }
      winnerLabel="MÁS SOBREVALORADO"
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-rose-400">
          +{formatShortEuro(item.total_inflation)}€
        </span>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            { label: 'Compras', value: item.trade_count },
            { label: 'Sobreprecio', value: `+${formatShortEuro(item.avg_inflation)}`, suffix: '€' },
          ]}
        />
      )}
      renderRunnerUpValue={(item) => (
        <span className="text-sm font-black text-rose-400">
          +{formatShortEuro(item.total_inflation)}€
        </span>
      )}
      renderRunnerUpMeta={(item) => (
        <div className="text-xs text-zinc-500 truncate mt-0.5">
          {item.trade_count} compras sobre mercado
        </div>
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-rose-400/80">
          +{formatShortEuro(item.total_inflation)}€
        </span>
      )}
      renderListItemMeta={(item) => (
        <div className="text-[10px] text-zinc-600 truncate ml-2 font-medium">
          {item.trade_count} pases/mercado
        </div>
      )}
    />
  );
}
