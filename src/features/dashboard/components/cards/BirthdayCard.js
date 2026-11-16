'use client';

import { Cake, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { EmptyState } from '@/components/ui/foundation';
import { useApiData } from '@/lib/hooks/useApiData';
import { getManagerTextColor } from '@/lib/competition/public';

export default function BirthdayCard() {
  const { data: birthdays = [], loading } = useApiData('/api/dashboard/birthdays');

  const listItems = !loading && birthdays && birthdays.length > 0 ? birthdays : [];

  return (
    <Card title="Cumpleaños Hoy" icon={Cake} color="pink" loading={loading}>
      <div className="flex flex-col flex-1 pb-1">
        {listItems.length ? (
          <ul className="m-0 list-none divide-y divide-border/50 p-0" data-stat-list="birthday">
            {listItems.map((player, index) => {
              return (
                <li key={player.id} className="flex min-w-0 items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center bg-pink-500/10 text-[color-mix(in_srgb,var(--color-pink-400)_55%,hsl(var(--content-primary)))] border border-pink-500/20">
                        <Sparkles size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/player/${player.id}`}
                          className="font-bold text-foreground text-sm truncate hover:text-[color-mix(in_srgb,var(--color-pink-400)_55%,hsl(var(--content-primary)))] transition-colors block"
                          title={player.name}
                        >
                          {player.name}
                        </Link>
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <span>{player.team}</span>
                          {player.owner_name && (
                            <>
                              <span>·</span>
                              {(() => {
                                return (
                                  <span
                                    style={{
                                      color: getManagerTextColor(
                                        player.owner_id,
                                        player.owner_name,
                                        player.owner_color_index
                                      ),
                                    }}
                                  >
                                    👤 {player.owner_name}
                                  </span>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <div className="flex flex-col items-end whitespace-nowrap">
                      <div className="font-bold text-lg text-[color-mix(in_srgb,var(--color-pink-400)_55%,hsl(var(--content-primary)))]">
                        {player.birth_date
                          ? new Date().getFullYear() - new Date(player.birth_date).getFullYear()
                          : '?'}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Años
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState>{'No hay cumpleaños hoy'}</EmptyState>
        )}
      </div>
    </Card>
  );
}
