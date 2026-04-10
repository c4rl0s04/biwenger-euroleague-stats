'use client';

import { Gavel } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function RecordBidCard({ data, onViewAll }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <MarketPodiumCard
      onViewAll={onViewAll}
      data={data}
      title="Récord Pujas"
      icon={Gavel}
      color="purple"
      info={
        <>
          <TooltipHeader>Récord de Pujas</TooltipHeader>
          <p>
            Los fichajes con mayor competencia en la subasta, ordenados por el número total de pujas
            recibidas. Refleja las peleas más intensas por un jugador.
          </p>
        </>
      }
      winnerLabel="MÁS PUJAS"
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-purple-400">{item.bid_count}</span>
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
            Pujas
          </span>
        </div>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            {
              label: 'Ganador',
              value: (
                <ManagerName
                  user={{
                    user_id: item.buyer_id,
                    user_name: item.comprador,
                    user_color_index: item.buyer_color,
                  }}
                  className="text-base font-mono tracking-tighter"
                />
              ),
            },
            {
              label: 'Precio',
              value: formatEuro(item.precio),
              suffix: '€',
            },
          ]}
        />
      )}
      renderHeroMeta={() => null}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-purple-400">{item.bid_count}</span>
          <span className="text-[10px] text-zinc-500 font-bold">pujas</span>
        </div>
      )}
      renderRunnerUpMeta={(item) => (
        <ManagerName
          user={{
            user_id: item.buyer_id,
            user_name: item.comprador,
            user_color_index: item.buyer_color,
          }}
          className="text-xs"
        />
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-purple-400">{item.bid_count} pujas</span>
      )}
      renderListItemMeta={(item) => (
        <ManagerName
          user={{
            user_id: item.buyer_id,
            user_name: item.comprador,
            user_color_index: item.buyer_color,
          }}
          className="text-[10px] ml-2"
        />
      )}
    />
  );
}
