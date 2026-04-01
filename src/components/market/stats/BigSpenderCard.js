'use client';

import { Gem } from 'lucide-react';
import MarketStatCard from './MarketStatCard';

export default function BigSpenderCard({ spender }) {
  if (!spender || !Array.isArray(spender) || spender.length === 0) return null;

  const renderWinnerMeta = (winner) => (
    <p className="text-sm text-white font-bold uppercase tracking-tight opacity-100">
      {winner.purchases_count} operaciones
    </p>
  );

  return (
    <MarketStatCard
      data={spender}
      title="El Jeque"
      icon={Gem}
      color="cyan"
      winnerLabel="MAYOR INVERSOR"
      type="user"
      fields={{
        id: 'id',
        name: 'name',
        value: 'total_spent',
        colorIndex: 'color_index',
      }}
      renderWinnerMeta={renderWinnerMeta}
    />
  );
}
