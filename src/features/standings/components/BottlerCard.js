'use client';

import { Wine } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { ManagerStatList } from '@/lib/competition/ui';
import { getColorForUser } from '@/lib/competition/public';
import { useApiData } from '@/lib/hooks/useApiData';

export default function BottlerCard() {
  const { data = [], loading } = useApiData('/api/standings/bottlers');

  return (
    <Card
      title="The Bottlers (Casi ganan)"
      icon={Wine}
      color="pink"
      loading={loading}
      className="h-full flex flex-col"
    >
      {!loading &&
        (data.length > 0 ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
              <p className="text-xs text-muted-foreground font-medium italic px-2">
                Suma puntos por{' '}
                <span className="text-[color-mix(in_srgb,var(--color-pink-400)_55%,hsl(var(--content-primary)))] font-bold not-italic">
                  2º
                </span>{' '}
                y{' '}
                <span className="text-[color-mix(in_srgb,var(--color-pink-400)_55%,hsl(var(--content-primary)))] font-bold not-italic">
                  3er
                </span>{' '}
                puesto. Resta por{' '}
                <span className="text-[color-mix(in_srgb,var(--color-pink-400)_55%,hsl(var(--content-primary)))] font-bold not-italic">
                  ganar
                </span>
                .
              </p>
            </div>

            <ManagerStatList
              items={data}
              getKey={(user) => user.user_id}
              getIdentity={(user) => ({
                id: user.user_id ?? null,
                name: user.name,
                icon: user.icon,
                colorIndex: user.color_index,
                subtitle: (
                  <span className="flex flex-wrap gap-2">
                    <span>{user.seconds}x 2º</span>
                    <span>{user.thirds}x 3er</span>
                  </span>
                ),
              })}
              renderMetric={(user) => (
                <div className="flex flex-col items-end pl-2 shrink-0">
                  <span className="font-black text-xl text-foreground">{user.bottler_score}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Score
                  </span>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">Nadie ha boteado todavía</div>
        ))}
    </Card>
  );
}
