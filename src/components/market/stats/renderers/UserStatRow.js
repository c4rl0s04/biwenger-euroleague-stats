'use client';

import React from 'react';
import BaseRow from './BaseRow';
import { resolveIdentity } from './utils';
import { formatEuro } from '@/lib/utils/currency';

export default function UserStatRow({ item, idx, statType }) {
  const identity = resolveIdentity(item, statType);
  const rank = idx + 1;
  const isTop3 = rank <= 3;

  let valueLabel = '';
  let valueText = '';
  let valueSub = '';

  if (item.total_spent !== undefined) {
    valueLabel = 'Inversión Total';
    valueText = `${formatEuro(item.total_spent)}€`;
    valueSub = `${item.purchases_count || 0} fichajes realizados`;
  } else if (item.stolen_count !== undefined) {
    valueLabel = 'Jugadores Robados';
    valueText = item.stolen_count;
    valueSub = `${item.total_spent ? formatEuro(item.total_spent) + '€ invertidos' : 'Al acecho'}`;
  } else if (item.failed_bids_count !== undefined) {
    valueLabel = 'Jugadores Perdidos';
    valueText = item.failed_bids_count;
    valueSub = 'Víctima de pujas ajustadas';
  } else if (item.total_overpay !== undefined) {
    valueLabel = 'Sobrepago Total';
    valueText = `${formatEuro(item.total_overpay)}€`;
    valueSub = `${item.contested_wins || 0} victorias en subasta`;
  } else if (item.net_profit !== undefined || item.total_profit !== undefined) {
    const profit = item.net_profit || item.total_profit || 0;
    valueLabel = 'Plusvalías Totales';
    valueText = `${formatEuro(profit)}€`;
    valueSub = item.total_sales
      ? `${formatEuro(item.total_sales)}€ en ventas (${item.sales_count} ops)`
      : `${item.trade_count || item.sales_count || 0} operaciones`;
  } else if (item.trade_count !== undefined) {
    valueLabel = 'Operaciones';
    valueText = item.trade_count;
    valueSub = 'Volumen total de actividad';
  }

  return (
    <BaseRow
      idx={idx}
      rank={rank}
      isTop3={isTop3}
      {...identity}
      valueLabel={valueLabel}
      valueText={valueText}
      valueSub={valueSub}
    />
  );
}
