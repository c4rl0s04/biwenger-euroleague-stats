'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Flame, Snowflake } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getColorForUser } from '@/lib/constants/colors';

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
        <div className="divide-y divide-slate-800/50 -mx-1 flex-1 flex flex-col">
          {data.map((user, index) => {
            const userColor = getColorForUser(user.user_id, user.name, user.color_index);
            return (
              <div
                key={user.user_id}
                className="group flex flex-1 items-center justify-between py-1.5 px-2 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-slate-500 font-mono text-xs w-5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <Link
                    href={`/user/${user.user_id}`}
                    className="relative w-8 h-8 shrink-0 transition-transform hover:scale-110 active:scale-95 z-10"
                  >
                    {user.icon ? (
                      <Image
                        src={user.icon}
                        alt={user.name}
                        fill
                        className="rounded-full object-cover ring-2 ring-white/10"
                        sizes="32px"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white/10"
                        style={{ backgroundColor: userColor.stroke }}
                      >
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/user/${user.user_id}`}
                      className={`font-bold text-sm ${userColor.text} truncate block transition-transform group-hover:translate-x-1 origin-left`}
                    >
                      {user.name}
                    </Link>
                    <div className="text-[11px] text-slate-500 font-medium">
                      L5: {user.last5_avg.toFixed(1)} <span className="mx-1 opacity-30">|</span>{' '}
                      Season: {user.season_avg.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <div
                    className={`flex items-center gap-1 font-black text-sm ${user.diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                  >
                    {user.diff > 0 ? '+' : ''}
                    {user.diff.toFixed(1)}
                  </div>
                  <div className="w-6 flex justify-center">
                    {user.status === 'fire' && (
                      <Flame
                        size={16}
                        className="text-orange-500 animate-pulse fill-orange-500/20"
                      />
                    )}
                    {user.status === 'ice' && <Snowflake size={16} className="text-blue-300" />}
                    {user.status === 'neutral' && <div className="w-[16px]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !loading && <div className="text-center text-slate-500 py-4">No hay datos suficientes</div>
      )}
    </Card>
  );
}
