'use client';

import { Gem } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function BigSpenderCard({ spender }) {
  if (!spender || !Array.isArray(spender) || spender.length === 0) return null;

  return (
    <MarketPodiumCard
      data={spender}
      title="El Jeque"
      icon={Gem}
      color="cyan"
      winnerLabel="MAYOR INVERSOR"
      useTeamColors={false}
      info={
        <>
          <TooltipHeader>El Jeque</TooltipHeader>
          <p>
            Ranking de los managers que más han invertido en el mercado. Refleja quién tiene la
            billetera más activa y quién está apostando más fuerte por reforzar su plantilla.
          </p>
        </>
      }
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-cyan-400">{formatEuro(item.total_spent)}€</span>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup stats={[{ label: 'Operaciones', value: item.purchases_count }]} />
      )}
      renderHeroMeta={(item) => <ManagerPill user={item} />}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-cyan-400">{formatEuro(item.total_spent)}€</span>
          <span className="text-[9px] text-zinc-500 font-bold">{item.purchases_count} ops.</span>
        </div>
      )}
      renderRunnerUpMeta={(item) => (
        <ManagerName user={item} className="text-[10px] opacity-80 hover:opacity-100" />
      )}
      renderListItemValue={(item) => (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-cyan-400/80">
            {formatEuro(item.total_spent)}€
          </span>
          <span className="text-[9px] text-zinc-500 font-medium">({item.purchases_count} op.)</span>
        </div>
      )}
    />
  );
}
