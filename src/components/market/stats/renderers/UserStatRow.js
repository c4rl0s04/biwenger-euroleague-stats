'use client';

import React from 'react';
import BaseRow from './BaseRow';
import { resolveIdentity } from './utils';
import { formatEuro } from '@/lib/utils/currency';
import { getMetricConfig } from './registry';

export default function UserStatRow({ item, localIdx, globalIdx, statType }) {
  const rank = globalIdx + 1;
  const isTop3 = rank <= 3;
  const identity = resolveIdentity(item, statType);

  // Resolve metric configuration from registry
  const config = getMetricConfig(item, 'USER');

  if (!config) {
    return (
      <BaseRow
        idx={localIdx}
        rank={rank}
        isTop3={isTop3}
        {...identity}
        valueLabel="Total"
        valueText="-"
      />
    );
  }

  const valueLabel = typeof config.label === 'function' ? config.label(item) : config.label;
  const valueText = typeof config.value === 'function' ? config.value(item) : config.value;
  const sub = typeof config.sub === 'function' ? config.sub(item) : config.sub;

  return (
    <BaseRow
      idx={localIdx}
      rank={rank}
      isTop3={isTop3}
      {...identity}
      valueLabel={valueLabel}
      valueText={valueText}
      valueSub={sub}
    />
  );
}
