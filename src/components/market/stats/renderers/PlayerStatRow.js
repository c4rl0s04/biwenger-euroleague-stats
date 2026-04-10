'use client';

import React from 'react';
import BaseRow from './BaseRow';
import { resolveIdentity } from './utils';
import { formatEuro } from '@/lib/utils/currency';

export default function PlayerStatRow({ item, idx, statType }) {
  const identity = resolveIdentity(item, statType);
  const rank = idx + 1;
  const isTop3 = rank <= 3;

  let valueLabel = '';
  let valueText = '';
  let valueSub = '';

  if (item.transfer_count !== undefined || item.distinct_owners_count !== undefined) {
    const isTransfer = item.transfer_count !== undefined;
    valueLabel = isTransfer ? 'Total Fichajes' : 'Propietarios';
    valueText = isTransfer ? item.transfer_count : item.distinct_owners_count;

    if (item.avg_price) {
      valueSub = `Desembolso Medio: ${formatEuro(item.avg_price)}€`;
    } else if (item.team_name && item.team_logo) {
      valueSub = (
        <div className="flex items-center gap-1.5 overflow-hidden">
          <img
            src={item.team_logo}
            alt={item.team_name}
            className="w-3.5 h-3.5 object-contain shrink-0"
          />
          <span className="truncate">{item.team_name}</span>
        </div>
      );
    }
  } else if (item.inflation !== undefined) {
    valueLabel = 'Sobreprecio';
    valueText = `+${formatEuro(item.inflation)}€`;
    valueSub = `P: ${formatEuro(item.purchase_price)}€ · M: ${formatEuro(item.market_price)}€`;
  } else if (item.missed_rounds !== undefined) {
    valueLabel = 'Ausencias';
    valueText = `${item.missed_rounds}`;
    const attendanceRate = item.available_rounds
      ? Math.round((item.played_rounds / item.available_rounds) * 100)
      : 0;
    valueSub = `Asistencia: ${attendanceRate}% (${item.played_rounds}/${item.available_rounds})`;
  } else if (item.revaluation !== undefined || item.devaluation !== undefined || item.percentage_gain !== undefined) {
    if (item.percentage_gain !== undefined) {
      valueLabel = 'Rentabilidad';
      valueText = `+${item.percentage_gain.toFixed(0)}%`;
    } else {
      const change = item.revaluation !== undefined ? item.revaluation : item.devaluation;
      valueLabel = change >= 0 ? 'Revalorización' : 'Depreciación';
      valueText = `${formatEuro(Math.abs(change))}€`;
    }
    valueSub = `C: ${formatEuro(item.purchase_price || 0)}€ · A: ${formatEuro(item.current_price || item.price || 0)}€`;
  } else if (item.missed_profit !== undefined) {
    valueLabel = 'Beneficio Perdido';
    valueText = `${formatEuro(item.missed_profit)}€`;
    valueSub = `V: ${formatEuro(item.sale_price || 0)}€ · A: ${formatEuro(item.current_price || 0)}€`;
  } else if (item.points_per_million !== undefined) {
    valueLabel = 'Puntos / Millón';
    valueText = item.points_per_million.toFixed(2);
    valueSub = `${item.total_points} puntos totales`;
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
