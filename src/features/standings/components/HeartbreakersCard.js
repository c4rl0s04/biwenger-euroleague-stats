'use client';

import { HeartCrack } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { ManagerStatList } from '@/lib/competition/ui';
import { getColorForUser } from '@/lib/competition/public';
import { useApiData } from '@/lib/hooks/useApiData';

export default function HeartbreakersCard() {
  const { data = [], loading } = useApiData('/api/standings/heartbreakers');

  return (
    <Card
      title="Casi, Casi (Heartbreakers)"
      icon={HeartCrack}
      color="rose"
      loading={loading}
      className="h-full flex flex-col"
    >
      {!loading &&
        (data.length > 0 ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
              <p className="text-xs text-muted-foreground font-medium italic px-2">
                Suma de puntos por los que te has quedado{' '}
                <span className="text-[color-mix(in_srgb,var(--color-rose-400)_55%,hsl(var(--content-primary)))] font-bold not-italic">
                  sin ganar
                </span>{' '}
                (siendo{' '}
                <span className="text-[color-mix(in_srgb,var(--color-rose-400)_55%,hsl(var(--content-primary)))] font-bold not-italic">
                  2º
                </span>
                ).
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
                    <HeartCrack
                      size={14}
                      className="text-[color-mix(in_srgb,var(--color-rose-500)_55%,hsl(var(--content-primary)))]"
                    />
                    <span className="font-black text-xl text-foreground">{user.total_diff}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Perdidos
                  </span>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">Sin dolor... todavía</div>
        ))}
    </Card>
  );
}
