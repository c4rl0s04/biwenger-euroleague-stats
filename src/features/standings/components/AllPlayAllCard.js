'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Swords } from 'lucide-react';
import Link from 'next/link';
import { ManagerStatList } from '@/lib/competition/ui';

export default function AllPlayAllCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=all-play-all');

  return (
    <Card
      title="Campeón Virtual (All-Play-All)"
      icon={Swords}
      color="yellow"
      loading={loading}
      tooltip="Clasificación si cada jornada jugaras un 1vs1 contra todos los demás managers."
      className="h-full flex flex-col"
    >
      {!loading && data.length > 0 ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="min-h-[40px] flex items-center mb-4 flex-shrink-0">
            <p className="text-sm text-muted-foreground font-medium italic px-2 leading-tight">
              Si jugaras contra{' '}
              <span className="text-[color-mix(in_srgb,var(--color-yellow-400)_55%,hsl(var(--content-primary)))] font-bold not-italic">
                todos
              </span>{' '}
              los rivales cada jornada. Efectividad{' '}
              <span className="text-[color-mix(in_srgb,var(--color-yellow-400)_55%,hsl(var(--content-primary)))] font-bold not-italic">
                H2H
              </span>{' '}
              real.
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
              // data already has wins, ties, losses, pct from API
            }))}
            renderMetric={(user) => (
              <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0 pr-2">
                {/* Record Group - Removed background and border */}
                <div className="flex items-center gap-2 sm:gap-3 py-1">
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-xl font-black text-[color-mix(in_srgb,var(--color-green-400)_55%,hsl(var(--content-primary)))] font-display leading-none">
                      {user.wins}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-bold text-xs sm:text-sm">-</span>
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-xl font-black text-muted-foreground font-display leading-none">
                      {user.ties}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-bold text-xs sm:text-sm">-</span>
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-xl font-black text-[color-mix(in_srgb,var(--color-red-400)_55%,hsl(var(--content-primary)))] font-display leading-none">
                      {user.losses}
                    </span>
                  </div>
                </div>

                {/* Percentage Group - Even larger & Yellow */}
                <div className="flex items-baseline gap-1.5 min-w-[100px] justify-end leading-none translate-y-0.5">
                  <span className="text-[color-mix(in_srgb,var(--color-yellow-400)_55%,hsl(var(--content-primary)))] font-black text-2xl sm:text-3xl font-display drop-shadow-[0_0_12px_rgba(250,204,21,0.3)]">
                    {user.pct.toFixed(0)}%
                  </span>
                  <span className="text-xs sm:text-base uppercase tracking-tight text-[color-mix(in_srgb,var(--color-yellow-400)_55%,hsl(var(--content-primary)))] font-black font-display">
                    Victorias
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      ) : (
        !loading && (
          <div className="flex h-full items-center justify-center text-muted-foreground text-lg">
            Calculando liga virtual...
          </div>
        )
      )}
    </Card>
  );
}
