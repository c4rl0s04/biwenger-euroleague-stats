'use client';

import React from 'react';
import BaseRow from './BaseRow';
import { resolveIdentity } from './utils';
import { formatEuro } from '@/lib/utils/currency';
import { getMetricConfig } from './registry';

export default function TransactionStatRow({ item, localIdx, globalIdx, statType }) {
  const rank = globalIdx + 1;
  const isTop3 = rank <= 3;
  const identity = resolveIdentity(item, statType);

  // Resolve metric configuration from registry
  const config = getMetricConfig(item, 'TRANSACTION');

  if (!config) {
    return (
      <BaseRow
        idx={localIdx}
        rank={rank}
        isTop3={isTop3}
        {...identity}
        valueLabel="Precio Traspaso"
        valueText={`${formatEuro(item.precio || item.price || 0)}€`}
        valueSub={item.player_team || item.team || ''}
      />
    );
  }

  const label = typeof config.label === 'function' ? config.label(item) : config.label;
  const value = typeof config.value === 'function' ? config.value(item) : config.value;
  const sub = typeof config.sub === 'function' ? config.sub(item) : config.sub;
  const info = typeof config.info === 'function' ? config.info(item) : config.info;

  return (
    <BaseRow
      idx={localIdx}
      rank={rank}
      isTop3={isTop3}
      {...identity}
      valueLabel={label}
      valueText={value}
      valueSub={sub}
    >
      {info}
    </BaseRow>
  );
}
