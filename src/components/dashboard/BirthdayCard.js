'use client';

import { Cake, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Card, StatsList } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { getColorForUser } from '@/lib/constants/colors';

export default function BirthdayCard() {
  const { data: birthdays = [], loading } = useApiData('/api/dashboard/birthdays');

  return (
    <Card title="Cumpleaños Hoy" icon={Cake} color="pink" loading={loading}>
      <div className="flex flex-col flex-1 pb-1">
        <StatsList
          items={!loading && birthdays && birthdays.length > 0 ? birthdays : []}
          emptyMessage="No hay cumpleaños hoy"
          renderLeft={(player) => (
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <Sparkles size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/player/${player.id}`}
                  className="font-bold text-foreground text-sm truncate hover:text-pink-400 transition-colors block"
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
                        const color = getColorForUser(
                          player.owner_id,
                          player.owner_name,
                          player.owner_color_index
                        );
                        return <span className={color.text}>👤 {player.owner_name}</span>;
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          renderRight={(player) => (
            <div className="flex flex-col items-end whitespace-nowrap">
              <div className="font-bold text-lg text-pink-400">
                {player.birth_date
                  ? new Date().getFullYear() - new Date(player.birth_date).getFullYear()
                  : '?'}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Años</div>
            </div>
          )}
        />
      </div>
    </Card>
  );
}
