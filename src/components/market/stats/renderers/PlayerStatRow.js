'use client';

import React from 'react';
import BaseRow from './BaseRow';
import { resolveIdentity } from './utils';
import { formatEuro } from '@/lib/utils/currency';
import { getMetricConfig } from './registry';

export default function PlayerStatRow({ item, idx, statType }) {
  const identity = resolveIdentity(item, statType);
  const rank = idx + 1;
  const isTop3 = rank <= 3;

  // Resolve metric configuration from registry
  const config = getMetricConfig(item, 'PLAYER');

  if (!config) {
    // Fallback for unexpected data
    return (
      <BaseRow
        idx={idx}
        rank={rank}
        isTop3={isTop3}
        {...identity}
        valueLabel="Valor"
        valueText={`${formatEuro(item.price || item.current_price || 0)}€`}
        valueSub={item.player_team || item.team || item.team_name || ''}
      />
    );
  }

  // Execute configuration
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
