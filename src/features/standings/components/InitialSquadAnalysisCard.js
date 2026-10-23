'use client';

import { Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { ManagerStatList } from '@/lib/competition/ui';

export default function InitialSquadAnalysisCard() {
  const { data = [], loading, error } = useApiData('/api/standings/analytics');

  const getROIColor = (roi) => {
    if (roi >= 80)
      return 'text-[color-mix(in_srgb,var(--color-emerald-400)_55%,hsl(var(--content-primary)))]';
    if (roi >= 60)
      return 'text-[color-mix(in_srgb,var(--color-amber-400)_55%,hsl(var(--content-primary)))]';
    return 'text-[color-mix(in_srgb,var(--color-red-400)_55%,hsl(var(--content-primary)))]';
  };

  return (
    <Card title="Initial Squad ROI" icon={Target} color="cyan" loading={loading}>
      {!loading && (
        <div className="flex flex-col h-full overflow-hidden">
          <p className="text-xs text-muted-foreground font-medium italic px-2 mb-4 flex-shrink-0">
            Compara el rendimiento real de tu plantilla inicial vs su potencial máximo
          </p>

          {error ? (
            <p className="text-[color-mix(in_srgb,var(--color-red-400)_55%,hsl(var(--content-primary)))] text-center py-4 text-sm">
              {error}
            </p>
          ) : data.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">
              No hay datos de plantillas iniciales
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
              items={data.map((user) => ({
                ...user,
                name: user.user_name,
                color_index: user.user_color_index,
                // user_id and icon are now provided by the updated API
                subtitle: (
                  <span className="flex gap-3">
                    <span>
                      Real:{' '}
                      <span className="text-muted-foreground">
                        {(user.actual_points ?? 0).toLocaleString()}
                      </span>
                    </span>
                    <span>
                      Max:{' '}
                      <span className="text-muted-foreground">
                        {(user.potential_points ?? 0).toLocaleString()}
                      </span>
                    </span>
                  </span>
                ),
              }))}
              renderMetric={(user, index) => (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <TrendingUp
                        size={14}
                        className="text-[color-mix(in_srgb,var(--color-cyan-500)_55%,hsl(var(--content-primary)))]"
                      />
                    )}
                    <span
                      className={`font-black text-2xl ${getROIColor(user.roi_percentage)} leading-none`}
                    >
                      {user.roi_percentage}%
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">
                    ROI
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
