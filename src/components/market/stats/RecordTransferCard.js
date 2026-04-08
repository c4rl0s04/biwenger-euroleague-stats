'use client';

import { TrendingUp } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import MarketPodiumCard from './MarketPodiumCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';
import { HeroStatGroup, ManagerPill, ManagerName } from './StatUIComponents';

export default function RecordTransferCard({ record, onViewAll }) {
  if (!record || !Array.isArray(record) || record.length === 0) return null;

  return (
    <MarketPodiumCard
      data={record}
      onViewAll={onViewAll}
      title="Récord Histórico"
      icon={TrendingUp}
      color="rose"
      winnerLabel="TRASPASO MÁS CARO"
      info={
        <>
          <TooltipHeader>Récord de Traspasos</TooltipHeader>
          <p>
            Muestra los traspasos más caros entre managers en la historia de la liga. Son las
            operaciones que han marcado un antes y un después en el mercado.
          </p>
        </>
      }
      renderHeroValue={(item) => (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-rose-400">{formatEuro(item.precio)}€</span>
        </div>
      )}
      renderHeroStats={(item) => (
        <HeroStatGroup
          stats={[
            {
              label: 'Comprador',
              value: item.buyer_name || item.comprador,
              className: 'text-zinc-300',
            },
          ]}
        />
      )}
      renderHeroMeta={(item) => (
        <ManagerPill
          user={{
            user_id: item.buyer_id,
            user_name: item.buyer_name || item.comprador,
            user_color_index: item.buyer_color,
          }}
        />
      )}
      renderRunnerUpValue={(item) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-rose-400">{formatEuro(item.precio)}€</span>
        </div>
      )}
      renderRunnerUpMeta={(item) => (
        <ManagerName
          user={{
            user_id: item.buyer_id,
            user_name: item.buyer_name || item.comprador,
            user_color_index: item.buyer_color,
          }}
          className="text-xs opacity-80 hover:opacity-100"
        />
      )}
      renderListItemValue={(item) => (
        <span className="text-xs font-bold text-rose-400/80">{formatEuro(item.precio)}€</span>
      )}
      renderListItemMeta={(item) => (
        <ManagerName
          user={{
            user_id: item.buyer_id,
            user_name: item.buyer_name || item.comprador,
            user_color_index: item.buyer_color,
          }}
          className="text-[10px] font-black uppercase tracking-wider opacity-60 hover:opacity-100 ml-2"
        />
      )}
    />
  );
}
