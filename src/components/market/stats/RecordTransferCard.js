'use client';

import { TrendingUp } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import MarketStatCard from './MarketStatCard';
import { formatEuro } from '@/lib/utils/currency';

export default function RecordTransferCard({ record }) {
  if (!record || !Array.isArray(record) || record.length === 0) return null;

  const renderWinnerMeta = (winner, winnerColor) => (
    <p className="text-[10px] text-zinc-500 font-bold">
      Comprador: <span className={winnerColor.text}>{winner.buyer_name || winner.comprador}</span>
    </p>
  );

  const renderListItemValue = (item) => {
    const buyerColor = getColorForUser(item.buyer_id, item.buyer_name, item.buyer_color);
    return (
      <div className="flex items-center gap-2">
        <span className="text-zinc-600 flex-shrink-0">→</span>
        <span className={`${buyerColor.text} truncate text-[10px]`}>
          {item.buyer_name || item.comprador}
        </span>
        <span className="text-zinc-400 font-semibold ml-1">{formatEuro(item.precio)}€</span>
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
      renderWinnerMeta={renderWinnerMeta}
      renderListItemValue={renderListItemValue}
    />
  );
}
