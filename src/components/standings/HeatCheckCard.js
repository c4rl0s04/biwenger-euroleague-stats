'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Flame, Snowflake } from 'lucide-react';
import Link from 'next/link';
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
        <div className="divide-y divide-slate-800/50 -mx-1">
          {data.map((user, index) => {
            const userColor = getColorForUser(user.user_id, user.name, user.color_index);
            return (
              <div
                key={user.user_id}
                className="group flex items-center justify-between py-2.5 px-2 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-slate-500 font-mono text-[10px] w-4 flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/user/${user.user_id}`}
                      className={`font-bold text-xs ${userColor.text} truncate block transition-transform group-hover:translate-x-0.5 origin-left`}
                    >
                      {user.name}
                    </Link>
                    <div className="text-[10px] text-slate-500 font-medium">
                      L5: {user.last5_avg.toFixed(1)} <span className="mx-1 opacity-30">|</span>{' '}
                      Season: {user.season_avg.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <div
                    className={`flex items-center gap-1 font-black text-xs ${user.diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                  >
                    {user.diff > 0 ? '+' : ''}
                    {user.diff.toFixed(1)}
                  </div>
                  <div className="w-5 flex justify-center">
                    {user.status === 'fire' && (
                      <Flame
                        size={14}
                        className="text-orange-500 animate-pulse fill-orange-500/20"
                      />
                    )}
                    {user.status === 'ice' && <Snowflake size={14} className="text-blue-300" />}
                    {user.status === 'neutral' && <div className="w-[14px]" />}
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
