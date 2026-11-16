'use client';

import { Zap, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { ManagerStatList } from '@/lib/competition/ui';

export default function InitialSquadPotentialCard() {
  const { data, loading, error } = useApiData('/api/standings/initial-squad-stats');

  const potentialRanking = data?.potentialRanking ?? [];

  return (
    <Card title="Potencial del Reparto" icon={Zap} color="sky" loading={loading}>
      {!loading && (
        <div className="flex flex-col h-full overflow-hidden">
          <p className="text-xs text-muted-foreground font-medium italic px-2 mb-4 flex-shrink-0">
            Rendimiento total histórico y valor de mercado actual de tus jugadores iniciales (hayan
            sido vendidos o no).
          </p>

          {error ? (
            <p className="text-[color-mix(in_srgb,var(--color-red-400)_55%,hsl(var(--content-primary)))] text-center py-4 text-sm">
              {error}
            </p>
          ) : potentialRanking.length === 0 ? (
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
              items={potentialRanking.map((user) => ({
                ...user,
                name: user.user_name,
                color_index: user.user_color_index,
                // user_id and icon are now provided by the updated API
                subtitle: `Valor: ${(user.total_value / 1000000).toFixed(1)}M €`,
              }))}
              renderMetric={(user, index) => (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <Sparkles
                        size={14}
                        className="text-[color-mix(in_srgb,var(--color-sky-500)_55%,hsl(var(--content-primary)))]"
                      />
                    )}
                    <span className="font-black text-2xl text-[color-mix(in_srgb,var(--color-sky-400)_55%,hsl(var(--content-primary)))] leading-none">
                      {(user.total_points ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">
                    pts totales
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
