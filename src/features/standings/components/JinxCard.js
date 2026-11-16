'use client';

import { Skull } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { ManagerStatList } from '@/lib/competition/ui';
import { getColorForUser } from '@/lib/competition/public';
import { useApiData } from '@/lib/hooks/useApiData';

export default function JinxCard() {
  const { data = [], loading } = useApiData('/api/standings/jinx');

  return (
    <Card
      title="El Pupas (Rondas Malditas)"
      icon={Skull}
      color="purple"
      loading={loading}
      className="h-full flex flex-col"
    >
      {!loading &&
        (data.length > 0 ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
              <p className="text-xs text-muted-foreground font-medium italic px-2">
                Puntuación{' '}
                <span className="text-[color-mix(in_srgb,var(--color-purple-400)_55%,hsl(var(--content-primary)))] font-bold not-italic">
                  superior a la media
                </span>{' '}
                pero acabando en la{' '}
                <span className="text-[color-mix(in_srgb,var(--color-purple-400)_55%,hsl(var(--content-primary)))] font-bold not-italic">
                  mitad inferior
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
                  <div className="flex items-center gap-1">
                    <Skull
                      size={14}
                      className="text-[color-mix(in_srgb,var(--color-purple-500)_55%,hsl(var(--content-primary)))]"
                    />
                    <span className="font-black text-xl text-foreground">{user.jinxed_count}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Jornadas
                  </span>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">Nadie ha sido gafado</div>
        ))}
    </Card>
  );
}
