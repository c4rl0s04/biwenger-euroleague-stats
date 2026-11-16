import type { Key, ReactNode } from 'react';
import { EmptyState } from '@/components/ui/foundation';
import { ManagerIdentity, type ManagerIdentityValue } from './ManagerIdentity';

export interface ManagerStatListProps<T> {
  items: readonly T[];
  getKey: (item: T) => Key;
  getIdentity: (item: T) => ManagerIdentityValue;
  renderMetric: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
}

/** Compact manager rankings; callers retain ordering, tie policy and metric meaning. */
export function ManagerStatList<T>({
  items,
  getKey,
  getIdentity,
  renderMetric,
  emptyMessage = 'No hay datos',
}: ManagerStatListProps<T>) {
  if (!items.length) return <EmptyState>{emptyMessage}</EmptyState>;
  return (
    <ol className="m-0 list-none divide-y divide-border/50 p-0" data-stat-list="manager">
      {items.map((item, index) => (
        <li key={getKey(item)} className="flex min-h-12 min-w-0 items-center gap-3 py-3">
          <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          <ManagerIdentity manager={getIdentity(item)} />
          <div className="ml-auto flex shrink-0 items-center justify-end gap-2 text-right tabular-nums">
            {renderMetric(item, index)}
          </div>
        </li>
      ))}
    </ol>
  );
}
