'use client';

import React from 'react';
import BaseRow from './BaseRow';
import { resolveIdentity } from './utils';
import { formatEuro } from '@/lib/utils/currency';
import { getMetricConfig } from './registry';

export default function UserStatRow({ item, idx, statType }) {
  const identity = resolveIdentity(item, statType);
  const rank = idx + 1;
  const isTop3 = rank <= 3;

  // Resolve metric configuration from registry
  const config = getMetricConfig(item, 'USER');

  if (!config) {
    return (
      <BaseRow
        idx={idx}
        rank={rank}
        isTop3={isTop3}
        {...identity}
        valueLabel="Actividad"
        valueText={item.trade_count || 0}
        valueSub="Operaciones realizadas"
      />
    );
  }

  const label = typeof config.label === 'function' ? config.label(item) : config.label;
  const value = typeof config.value === 'function' ? config.value(item) : config.value;
  const sub = typeof config.sub === 'function' ? config.sub(item) : config.sub;

  return (
    <BaseRow
      idx={idx}
      rank={rank}
      isTop3={isTop3}
      {...identity}
      valueLabel={label}
      valueText={value}
      valueSub={sub}
    />
  );
}
