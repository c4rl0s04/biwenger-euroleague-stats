'use client';

import { Search, Trophy, XCircle } from 'lucide-react';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function BiggestStealCard({ data, onViewAll }) {
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
      title="Mayor Robo"
      icon={Search}
      color="cyan"
      info={
        <>
          <TooltipHeader>Mayor Robo</TooltipHeader>
          <p>
            Muestra los fichajes ganados por la mínima diferencia respecto a la segunda puja más
            alta. Representa la máxima eficiencia al pujar.
          </p>
        </>
      }
      winnerLabel="MÍNIMA DIFERENCIA"
      renderHeroValue={(item) => (
        <span className="text-3xl font-black text-cyan-400">
          +{formatShortEuro(item.price_diff)}€
        </span>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            {
              label: 'Ganador',
              value: (
                <ManagerName
                  user={{
                    user_id: item.winner_id,
                    user_name: item.winner,
                    user_color_index: item.winner_color,
                  }}
                  className="text-[11px]"
                />
              ),
            },
            {
              label: '2º Lugar',
              value: (
                <ManagerName
                  user={{
                    user_id: item.second_bidder_id,
                    user_name: item.second_bidder_name,
                    user_color_index: item.second_bidder_color,
                  }}
                  className="text-[11px]"
                />
              ),
            },
          ]}
        />
      )}
      renderHeroMeta={() => null}
      renderRunnerUpValue={(item) => (
        <span className="text-sm font-black text-cyan-400">
          +{formatShortEuro(item.price_diff)}€
        </span>
      )}
      renderRunnerUpMeta={(item) => (
        <div className="flex flex-col gap-1 mt-1">
          <ManagerName
            user={{
              user_id: item.winner_id,
              user_name: item.winner,
              user_color_index: item.winner_color,
            }}
            className="text-xs"
          />
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">
              vs
            </span>
            <ManagerName
              user={{
                user_id: item.second_bidder_id,
                user_name: item.second_bidder_name,
                user_color_index: item.second_bidder_color,
              }}
              className="text-[10px]"
            />
          </div>
        </div>
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-cyan-400">
          +{formatShortEuro(item.price_diff)}€
        </span>
      )}
      renderListItemMeta={(item) => (
        <div className="flex items-center gap-1.5 ml-2">
          <ManagerName
            user={{
              user_id: item.winner_id,
              user_name: item.winner,
              user_color_index: item.winner_color,
            }}
            className="text-[10px]"
          />
          <span className="text-[9px] text-zinc-700 font-black uppercase">vs</span>
          <ManagerName
            user={{
              user_id: item.second_bidder_id,
              user_name: item.second_bidder_name,
              user_color_index: item.second_bidder_color,
            }}
            className="text-[10px]"
          />
        </div>
      )}
    />
  );
}
