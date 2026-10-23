'use client';

import { Frown, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { ManagerStatList } from '@/lib/competition/ui';

export default function InitialSquadRegretCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const regretRanking = data?.regretRanking ?? [];

  return (
    <Card title="El Arrepentimiento" icon={Frown} color="red" loading={loading}>
      {!loading && (
        <div className="flex flex-col h-full overflow-hidden">
          <p className="text-xs text-muted-foreground font-medium italic px-2 mb-4 flex-shrink-0">
            Puntos generados por tus jugadores iniciales en las jornadas que ya NO te pertenecían
            (fueron vendidos al mercado o a otro mánager).
          </p>

          {error ? (
            <p className="text-[color-mix(in_srgb,var(--color-red-400)_55%,hsl(var(--content-primary)))] text-center py-4 text-sm">
              {error}
            </p>
          ) : regretRanking.length === 0 ? (
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
              items={regretRanking.map((user) => ({
                ...user,
                name: user.user_name,
                color_index: user.user_color_index,
                // user_id and icon are now provided by the updated API
                subtitle: (
                  <span className="flex items-center gap-1">
                    <span className="text-[color-mix(in_srgb,var(--color-red-400)_55%,hsl(var(--content-primary)))] italic">
                      Top &quot;Pain&quot;:
                    </span>
                    {user.top_regret_player}
                  </span>
                ),
              }))}
              renderMetric={(user, index) => (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <AlertTriangle
                        size={14}
                        className="text-[color-mix(in_srgb,var(--color-red-500)_55%,hsl(var(--content-primary)))]"
                      />
                    )}
                    <span className="font-black text-2xl text-[color-mix(in_srgb,var(--color-red-400)_55%,hsl(var(--content-primary)))] leading-none">
                      {(user.points_lost ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">
                    pts perdidos
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
