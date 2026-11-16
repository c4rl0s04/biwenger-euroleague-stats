import type { Key, ReactNode } from 'react';
import { EmptyState } from '@/components/ui/foundation';
import { PlayerIdentity, type PlayerIdentityValue } from './PlayerIdentity';

/** Ranked player entries; badges and sporting metrics remain owned by their feature. */
export function PlayerStatList<T>({
  items,
  getKey,
  getPlayer,
  renderBadge,
  renderMetric,
  emptyMessage = 'No hay datos',
}: {
  items: readonly T[];
  getKey: (item: T) => Key;
  getPlayer: (item: T) => PlayerIdentityValue;
  renderBadge: (item: T, index: number) => ReactNode;
  renderMetric: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
}) {
  if (!items.length) return <EmptyState>{emptyMessage}</EmptyState>;
  return (
    <ol className="m-0 list-none divide-y divide-border/50 p-0" data-stat-list="player-ranking">
      {items.map((item, index) => (
        <li key={getKey(item)} className="flex min-w-0 items-center gap-3 py-3">
          <div className="shrink-0">{renderBadge(item, index)}</div>
          <PlayerIdentity player={getPlayer(item)} />
          <div className="ml-auto shrink-0 text-right tabular-nums">
            {renderMetric(item, index)}
          </div>
        </li>
      ))}
    </ol>
  );
}
