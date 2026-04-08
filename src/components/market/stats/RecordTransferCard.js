'use client';

import { TrendingUp } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import MarketStatCard from './MarketStatCard';
import { formatEuro } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';

export default function RecordTransferCard({ record }) {
  if (!record || !Array.isArray(record) || record.length === 0) return null;

  const renderWinnerMeta = (winner, winnerColor) => (
    <p className="text-sm text-white font-bold uppercase tracking-tight opacity-100">
      Comprador: <span className={winnerColor.text}>{winner.buyer_name || winner.comprador}</span>
    </p>
  );

  const renderListItemValue = (item) => {
    const buyerColor = getColorForUser(item.buyer_id, item.buyer_name, item.buyer_color);
    return (
      <div className="flex items-center gap-3">
        <span
          className={`${buyerColor.text} truncate font-bold text-xs uppercase tracking-tighter`}
        >
          {item.buyer_name || item.comprador}
        </span>
        <span className="text-zinc-200 font-black text-sm">{formatEuro(item.precio)}€</span>
      </div>
    );
  };

  return (
    <MarketStatCard
      data={record}
      title="Récord Histórico"
      icon={TrendingUp}
      color="rose"
      winnerLabel="TRASPASO MÁS CARO"
      type="player"
      fields={{
        id: 'player_id',
        name: 'player_name',
        value: 'precio',
      }}
      info={
        <>
          <TooltipHeader>Récord de Traspasos</TooltipHeader>
          <p>
            Muestra los traspasos más caros entre managers en la historia de la liga. Son las
            operaciones que han marcado un antes y un después en el mercado.
          </p>
        </>
      }
      renderWinnerMeta={renderWinnerMeta}
      renderListItemValue={renderListItemValue}
    />
  );
}
