'use client';

import { Telescope } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function BestRevaluationCard({ data, onViewAll }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const formatShortEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={data}
      title="El Visionario"
      icon={Telescope}
      color="purple"
      info={
        <>
          <TooltipHeader>El Visionario</TooltipHeader>
          <p>
            Muestra el mayor incremento de valor de un jugador desde que fue fichado hasta el día de
            hoy. Es el beneficio potencial acumulado por mantener a un crack en la plantilla.
          </p>
        </>
      }
      winnerLabel="EL VISIONARIO"
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-purple-400">
          +{formatShortEuro(item.revaluation)}€
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
        <span className="text-sm font-black text-purple-400">
          +{formatShortEuro(item.revaluation)}€
        </span>
      )}
      renderRunnerUpMeta={(item) => <ManagerName user={item} className="text-xs" />}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-purple-400">
          +{formatShortEuro(item.revaluation)}€
        </span>
      )}
      renderListItemMeta={(item) => <ManagerName user={item} className="text-xs" />}
    />
  );
}
