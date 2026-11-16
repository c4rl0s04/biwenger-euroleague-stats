'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Flame, Snowflake } from 'lucide-react';
import { ManagerStatList } from '@/lib/competition/ui';

export default function HeatCheckCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=heat-check');

  return (
    <Card
      title="Racha de Fuego (Heat Check)"
      icon={Flame}
      color="orange"
      loading={loading}
      tooltip="Diferencia entre la media de las últimas 5 jornadas y la media de la temporada."
    >
      {!loading && data.length > 0 ? (
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
            subtitle: `L5: ${user.last5_avg.toFixed(1)} | Season: ${user.season_avg.toFixed(1)}`,
          }))}
          renderMetric={(user) => (
            <>
              <div
                className={`flex items-center gap-1 font-black text-sm ${user.diff > 0 ? 'text-[color-mix(in_srgb,var(--color-emerald-400)_55%,hsl(var(--content-primary)))]' : 'text-[color-mix(in_srgb,var(--color-rose-400)_55%,hsl(var(--content-primary)))]'}`}
              >
                {user.diff > 0 ? '+' : ''}
                {user.diff.toFixed(1)}
              </div>
              <div className="w-6 flex justify-center">
                {user.status === 'fire' && (
                  <Flame
                    size={16}
                    className="text-[color-mix(in_srgb,var(--color-orange-500)_55%,hsl(var(--content-primary)))] animate-pulse fill-orange-500/20"
                  />
                )}
                {user.status === 'ice' && (
                  <Snowflake
                    size={16}
                    className="text-[color-mix(in_srgb,var(--color-blue-300)_55%,hsl(var(--content-primary)))]"
                  />
                )}
                {user.status === 'neutral' && <div className="w-[16px]" />}
              </div>
            </>
          )}
        />
      ) : (
        !loading && (
          <div className="text-center text-muted-foreground py-4">No hay datos suficientes</div>
        )
      )}
    </Card>
  );
}
