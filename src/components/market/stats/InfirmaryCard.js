'use client';

import { Stethoscope } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { ManagerPill, ManagerName, HeroStatGroup } from './StatUIComponents';

export default function InfirmaryCard({ data, onViewAll }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const calculateRate = (played, available) => {
    if (!available) return 0;
    return Math.round((played / available) * 100);
  };

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={data}
      title="La Enfermería"
      icon={Stethoscope}
      color="rose"
      info={
        <>
          <TooltipHeader>La Enfermería</TooltipHeader>
          <p>
            Identifica a los jugadores más propensos a faltar (ausencia de registro en el acta)
            desde que fueron fichados. Solo considera jugadores con un coste superior a 2M€ y al
            menos 3 jornadas en el equipo.
          </p>
        </>
      }
      winnerLabel="EL MÁS AUSENTE"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-rose-500">{item.missed_rounds}</span>
          <span className="text-[11px] uppercase font-black tracking-widest text-zinc-500 mt-2">
            AUSENCIAS
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            {
              label: 'Asistencia',
              value: calculateRate(item.played_rounds, item.available_rounds),
              suffix: '%',
            },
            { label: 'Compra', value: formatEuro(item.purchase_price, true), suffix: '€' },
          ]}
        />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-lg font-black text-rose-500">{item.missed_rounds}</span>
          <span className="text-[8px] text-zinc-500 font-bold -mt-1 uppercase tracking-tighter">
            ABS
          </span>
        </div>
      )}
      renderRunnerUpMeta={(item) => <ManagerName user={item} className="text-xs" />}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-rose-400">
          {item.missed_rounds} <span className="text-[10px] opacity-60 ml-0.5">abs</span>
        </span>
      )}
      renderListItemMeta={(item) => <ManagerName user={item} className="text-[10px] ml-2" />}
    />
  );
}
