'use client';

import { Flame } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { ManagerStatList } from '@/lib/competition/ui';

export default function StreaksCard() {
  const { data = [], loading } = useApiData('/api/standings/streaks');

  return (
    <Card
      title="Rachas > 175 Pts"
      icon={Flame}
      color="orange"
      loading={loading}
      className="h-full flex flex-col"
    >
      {!loading &&
        (data.length > 0 ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Fixed height header for alignment */}
            <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
              <p className="text-xs text-muted-foreground font-medium italic px-2">
                Número de jornadas consecutivas en las que el usuario ha superado los 175 puntos.
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
              items={data.map((user) => ({
                ...user,
                user_id: user.user_id, // Ensure consistency
              }))}
              renderMetric={(user) => (
                <div className="flex flex-col items-end pl-2">
                  <div className="flex items-center gap-1">
                    <Flame
                      size={14}
                      className="text-[color-mix(in_srgb,var(--color-orange-500)_55%,hsl(var(--content-primary)))] animate-pulse"
                    />
                    <span className="font-black text-xl text-foreground">
                      {user.longest_streak}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Jornadas
                  </span>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">Sin rachas activas</div>
        ))}
    </Card>
  );
}
