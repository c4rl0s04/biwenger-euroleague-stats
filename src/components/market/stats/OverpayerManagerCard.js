'use client';

import { Coins } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { formatEuro } from '@/lib/utils/currency';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function OverpayerManagerCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <MarketPodiumCard
      data={data}
      title="El Sobrepagador"
      icon={Coins}
      color="amber"
      info={
        <>
          <TooltipHeader>El Sobrepagador</TooltipHeader>
          <p>
            El manager que más dinero extra ha puesto para ganar subastas disputadas. Se calcula
            sumando la diferencia entre su puja ganadora y la segunda mejor puja en cada fichaje.
          </p>
        </>
      }
      winnerLabel="MÁS SOBREPAGO"
      useTeamColors={false}
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-amber-400">
            +{formatEuro(item.total_overpay)}€
          </span>
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
            Dinero Extra
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            { label: 'Victorias', value: item.contested_wins },
            { label: 'Media', value: `+${formatEuro(item.avg_overpay)}`, suffix: '€' },
          ]}
        />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-amber-400">
            +{formatEuro(item.total_overpay)}€
          </span>
          <span className="text-[9px] text-zinc-500 font-bold">
            {item.contested_wins} victorias
          </span>
        </div>
      )}
      renderRunnerUpMeta={(item) => (
        <ManagerName user={item} className="text-[10px] opacity-80 hover:opacity-100" />
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-amber-400/80">
          +{formatEuro(item.total_overpay)}€
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
