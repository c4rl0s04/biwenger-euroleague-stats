'use client';

import React from 'react';
import BaseRow from './BaseRow';
import { resolveIdentity } from './utils';
import { formatEuro } from '@/lib/utils/currency';
import { Timer, Hourglass } from 'lucide-react';

export default function TemporalStatRow({ item, idx, statType }) {
  const identity = resolveIdentity(item, statType);
  const rank = idx + 1;
  const isTop3 = rank <= 3;

  let valueLabel = '';
  let valueText = '';
  let valueSub = '';

  if (item.hours_held !== undefined) {
    const formatTime = (hours) => {
      if (hours < 1) return `${Math.round(hours * 60)}m`;
      if (hours < 24) return `${hours.toFixed(1)}h`;
      return `${(hours / 24).toFixed(1)}d`;
    };
    valueLabel = 'Beneficio Quickflip';
    valueText = `+${formatEuro(item.profit || 0)}€`;
    valueSub = (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-orange-400 font-bold">
          <Timer className="w-3.5 h-3.5" />
          {formatTime(item.hours_held)} de posesión
        </div>
        <div className="flex items-center gap-2 opacity-70 text-[10px]">
          C: {formatEuro(item.purchase_price || 0)}€ · V: {formatEuro(item.sale_price || 0)}€
        </div>
      </div>
    );
  } else if (item.days_held !== undefined) {
    valueLabel = 'Beneficio Realizado';
    valueText = `+${formatEuro(item.profit || 0)}€`;
    valueSub = (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-teal-400 font-bold">
          <Hourglass className="w-3.5 h-3.5" />
          {Math.floor(item.days_held)} días en plantilla
        </div>
        <div className="flex items-center gap-2 opacity-70 text-[10px]">
          C: {formatEuro(item.purchase_price || 0)}€ · V: {formatEuro(item.sale_price || 0)}€
        </div>
      </div>
    );
  } else if (item.purchase_price !== undefined && item.sale_price !== undefined) {
    // Standard Flip without specific time data
    const profit = (item.profit !== undefined) ? item.profit : (item.sale_price - item.purchase_price);
    valueLabel = profit >= 0 ? 'Beneficio' : 'Pérdida';
    valueText = `${formatEuro(Math.abs(profit))}€`;
    valueSub = `C: ${formatEuro(item.purchase_price)}€ · V: ${formatEuro(item.sale_price)}€`;
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
