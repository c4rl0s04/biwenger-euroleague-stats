'use client';

import React from 'react';
import BaseRow from './BaseRow';
import { resolveIdentity } from './utils';
import { formatEuro } from '@/lib/utils/currency';
import { ArrowRight } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';

export default function TransactionStatRow({ item, idx, statType }) {
  const identity = resolveIdentity(item, statType);
  const rank = idx + 1;
  const isTop3 = rank <= 3;

  let valueLabel = '';
  let valueText = '';
  let valueSub = '';
  let customInfo = null;

  if (item.price_diff !== undefined) {
    valueLabel = 'Margen de Victoria';
    valueText = `+${formatEuro(item.price_diff)}€`;
    valueSub = 'Ganador de la puja ajustada';
    
    customInfo = (
      <div className="flex items-center gap-1.5 flex-wrap mt-1">
        <span className={`text-[10px] font-black uppercase tracking-tight ${getColorForUser(item.winner_id, item.winner, item.winner_color).text}`}>
          {item.winner}
        </span>
        <span className="text-[9px] text-zinc-400 font-bold uppercase shrink-0">le robó a</span>
        <span className={`text-[10px] font-black uppercase tracking-tight ${getColorForUser(item.second_bidder_id, item.second_bidder_name, item.second_bidder_color).text}`}>
          {item.second_bidder_name || 'otro manager'}
        </span>
      </div>
    );
  } else if (item.bid_count !== undefined) {
    valueLabel = 'Pujas';
    valueText = item.bid_count;
    valueSub = `Precio Traspaso: ${formatEuro(item.precio)}€`;
  } else if (item.vendedor && item.comprador) {
    // Normal transfer record
    valueLabel = 'Precio Traspaso';
    valueText = `${formatEuro(item.precio || item.price || 0)}€`;
    valueSub = item.player_team || item.team || '';
    
    customInfo = (
      <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
        <span className={`text-[10px] font-black uppercase tracking-widest truncate ${
          item.vendedor === 'Mercado' || item.vendedor === 'Biwenger' 
            ? 'text-zinc-500' 
            : getColorForUser(item.vendedor_id || item.seller_id, item.vendedor, item.vendedor_color_index).text
        }`}>
          {item.vendedor}
        </span>
        <ArrowRight size={10} className="text-zinc-700 shrink-0" />
        <span className={`text-[10px] font-black uppercase tracking-widest truncate ${
          item.comprador === 'Mercado' || item.comprador === 'Biwenger' 
            ? 'text-zinc-500' 
            : getColorForUser(item.comprador_id || item.buyer_id, item.comprador, item.comprador_color_index).text
        }`}>
          {item.comprador}
        </span>
      </div>
    );
  } else {
    // Fallback for record transfers or generic auctions
    valueLabel = item.precio ? 'Precio Traspaso' : 'Valor';
    valueText = `${formatEuro(item.precio || item.price || 0)}€`;
    valueSub = item.player_team || item.team || '';
  }

  return (
    <BaseRow
      idx={idx}
      rank={rank}
      isTop3={isTop3}
      {...identity}
      valueLabel={valueLabel}
      valueText={valueText}
      valueSub={
        <div className="flex flex-col gap-1.5">
          {customInfo}
          <div className="mt-0.5">
            {valueSub}
          </div>
        </div>
      }
    />
  );
}
