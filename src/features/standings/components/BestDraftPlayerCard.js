'use client';

import { Star, Trophy } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { ManagerStatList } from '@/lib/competition/ui';

export default function BestDraftPlayerCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const bestDraftPerUser = data?.bestDraftPerUser ?? [];

  return (
    <Card title="Mejor Jugador del Reparto" icon={Star} color="amber" loading={loading}>
      {!loading && (
        <div className="flex flex-col h-full overflow-hidden">
          <p className="text-xs text-muted-foreground font-medium italic px-2 mb-4 flex-shrink-0">
            El mejor jugador del reparto inicial para cada mánager, contando sólo los puntos reales
            que aportó mientras estuvo en su equipo.
          </p>

          {error ? (
            <p className="text-[color-mix(in_srgb,var(--color-red-400)_55%,hsl(var(--content-primary)))] text-center py-4 text-sm">
              {error}
            </p>
          ) : bestDraftPerUser.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">
              No hay datos disponibles
            </p>
          ) : (
            <ManagerStatList
              getKey={(user) => user.user_id}
              getIdentity={(user) => ({
                id: user.user_id ?? null,
                name: user.name,
                icon: user.icon,
                colorIndex: user.color_index,
                subtitle: user.subtitle,
              })}
              items={bestDraftPerUser.map((user) => ({
                ...user,
                name: user.user_name,
                color_index: user.user_color_index,
                // user_id and icon are now provided by the updated API
                subtitle: (
                  <span className="flex items-center gap-1">
                    <Star
                      size={9}
                      className="text-[color-mix(in_srgb,var(--color-amber-400)_55%,hsl(var(--content-primary)))]"
                      fill="currentColor"
                    />
                    {user.player_name}
                  </span>
                ),
              }))}
              renderMetric={(user, index) => (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    {user.index === 0 && (
                      <Trophy
                        size={14}
                        className="text-[color-mix(in_srgb,var(--color-amber-500)_55%,hsl(var(--content-primary)))]"
                      />
                    )}
                    <span className="font-black text-2xl text-[color-mix(in_srgb,var(--color-amber-400)_55%,hsl(var(--content-primary)))] leading-none">
                      {(user.total_fantasy_points ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">
                    pts
                  </span>
                </div>
              )}
            />
          )}
        </div>
      )}
    </Card>
  );
}
