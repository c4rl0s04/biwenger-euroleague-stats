'use client';

import { CloudRain } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { ManagerStatList } from '@/lib/competition/ui';
import { getColorForUser } from '@/lib/competition/public';
import { useApiData } from '@/lib/hooks/useApiData';

export default function NoGloryCard() {
  const { data = [], loading } = useApiData('/api/standings/no-glory');

  return (
    <Card
      title="Puntos sin Gloria"
      icon={CloudRain}
      color="slate"
      loading={loading}
      className="h-full flex flex-col"
    >
      {!loading &&
        (data.length > 0 ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
              <p className="text-xs text-muted-foreground font-medium italic px-2">
                Total de puntos acumulados en jornadas donde{' '}
                <span className="text-[color-mix(in_srgb,var(--color-orange-400)_55%,hsl(var(--content-primary)))] font-bold not-italic">
                  no conseguiste ganar
                </span>
                .
              </p>
            </div>

            <ManagerStatList
              getKey={(user) => user.user_id}
              getIdentity={(user) => ({
                id: user.user_id ?? null,
                name: user.name,
                icon: user.icon,
                colorIndex: user.color_index,
                subtitle: user.subtitle,
              })}
              items={data}
              renderMetric={(user) => (
                <div className="flex flex-col items-end pl-2">
                  <span className="font-black text-xl text-foreground">
                    {user.total_points_no_glory}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Puntos
                  </span>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">Todos han ganado algo</div>
        ))}
    </Card>
  );
}
