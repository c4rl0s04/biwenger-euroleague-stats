'use client';

import { Plus, X, Check } from 'lucide-react';
import { Avatar, Button, IconButton, Popover, Surface } from '@/components/ui/foundation';
import type { RoundManagerViewModel } from '../../models/round-read';

export function RoundComparisonControls({
  users,
  selectedIds,
  metrics,
  onToggleMetric,
  onToggleUser,
}: {
  users: RoundManagerViewModel[];
  selectedIds: string[];
  metrics: { actual: boolean; ideal: boolean };
  onToggleMetric: (metric: 'actual' | 'ideal') => void;
  onToggleUser: (id: string) => void;
}) {
  return (
    <Surface variant="subtle" className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div
        role="group"
        aria-label="Métricas del historial"
        className="flex flex-wrap items-center gap-2"
      >
        <span className="text-sm text-muted-foreground">Métricas:</span>
        <Button
          size="sm"
          variant={metrics.actual ? 'secondary' : 'ghost'}
          aria-pressed={metrics.actual}
          onClick={() => onToggleMetric('actual')}
          className={metrics.actual ? 'text-primary' : ''}
        >
          Puntos Reales
        </Button>
        <Button
          size="sm"
          variant={metrics.ideal ? 'secondary' : 'ghost'}
          aria-pressed={metrics.ideal}
          onClick={() => onToggleMetric('ideal')}
          className={metrics.ideal ? 'text-[var(--round-ideal)]' : ''}
        >
          Puntos Ideales
        </Button>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {selectedIds.map((id) => {
          const user = users.find((entry) => entry.id === id);
          return user ? (
            <span
              key={id}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-[hsl(var(--surface-card))] py-1 pl-1 pr-2"
            >
              <Avatar src={user.icon} alt="" size="sm" fallback={user.name?.slice(0, 1)} />
              <span className="truncate text-sm">{user.name}</span>
              {selectedIds.length > 1 && (
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label={`Quitar ${user.name} de la comparación`}
                  onClick={() => onToggleUser(id)}
                >
                  <X size={14} aria-hidden />
                </IconButton>
              )}
            </span>
          ) : null;
        })}
        <Popover
          label="Añadir usuario a comparar"
          trigger={<Plus size={18} aria-hidden />}
          className="inline-flex h-11 w-11 items-center justify-center bg-primary text-[hsl(var(--action-primary-content))]"
        >
          <p className="mb-2 font-semibold">Comparar mánagers</p>
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {users.map((user) => (
              <Button
                key={user.id}
                variant="ghost"
                className="w-full justify-between gap-2"
                aria-pressed={selectedIds.includes(user.id)}
                disabled={selectedIds.length === 1 && selectedIds.includes(user.id)}
                onClick={(event) => {
                  onToggleUser(user.id);
                  (event.currentTarget.closest('[popover]') as HTMLElement | null)?.hidePopover();
                }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar src={user.icon} alt="" fallback={user.name?.slice(0, 1)} size="sm" />
                  <span className="truncate">{user.name}</span>
                </span>
                {selectedIds.includes(user.id) && <Check size={16} aria-hidden />}
              </Button>
            ))}
          </div>
        </Popover>
      </div>
    </Surface>
  );
}
