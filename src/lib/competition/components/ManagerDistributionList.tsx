import type { Key, ReactNode } from 'react';
import { EmptyState } from '@/components/ui/foundation';
import { ManagerIdentity, type ManagerIdentityValue } from './ManagerIdentity';

/** Analytical rows give each feature's visualization its own full-width reading line. */
export function ManagerDistributionList<T>({
  items,
  getKey,
  getIdentity,
  renderVisualization,
  emptyMessage = 'No hay datos',
}: {
  items: readonly T[];
  getKey: (item: T) => Key;
  getIdentity: (item: T) => ManagerIdentityValue;
  renderVisualization: (item: T) => ReactNode;
  emptyMessage?: string;
}) {
  if (!items.length) return <EmptyState>{emptyMessage}</EmptyState>;
  return (
    <ol className="m-0 list-none divide-y divide-border/50 p-0" data-stat-list="distribution">
      {items.map((item, index) => (
        <li key={getKey(item)} className="min-w-0 space-y-3 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <ManagerIdentity manager={getIdentity(item)} />
          </div>
          <div className="min-w-0 tabular-nums">{renderVisualization(item)}</div>
        </li>
      ))}
    </ol>
  );
}
