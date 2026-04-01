'use client';

import { Briefcase } from 'lucide-react';
import MarketStatCard from './MarketStatCard';
import { formatProfit } from '@/lib/utils/currency';

export default function BestSellerCard({ seller }) {
  if (!seller || !Array.isArray(seller) || seller.length === 0) return null;

  const renderWinnerMeta = (winner) => (
    <p className="text-sm text-white font-bold uppercase tracking-tight opacity-100">
      {winner.sales_count} ventas
    </p>
  );

  const renderValue = (val) => (
    <span className={val >= 0 ? 'text-white' : 'text-red-400'}>{formatProfit(val)}</span>
  );

  const renderListItemValue = (item) => (
    <span className={`font-semibold ${item.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {formatProfit(item.net_profit)}
    </span>
  );

  return (
    <MarketStatCard
      data={seller}
      title="El Negociador"
      icon={Briefcase}
      color="emerald"
      winnerLabel="MAYOR BENEFICIO"
      type="user"
      fields={{
        id: 'id',
        name: 'name',
        value: 'net_profit',
        colorIndex: 'color_index',
      }}
      info="Beneficio real obtenido. Suma de (Precio Venta - Precio Compra) de todos los jugadores que has comprado y vendido."
      renderWinnerMeta={renderWinnerMeta}
      renderValue={renderValue}
      renderListItemValue={renderListItemValue}
    />
  );
}
