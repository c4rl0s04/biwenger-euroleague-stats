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
        <div className="space-y-3">
          {data.map((user, index) => {
            const userColor = getColorForUser(user.user_id, user.name, user.color_index);
            return (
              <div
                key={user.user_id}
                className="group flex items-center justify-between p-2 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-mono text-sm w-4">{index + 1}</span>
                  <div>
                    <Link
                      href={`/user/${user.user_id}`}
                      className={`font-semibold text-sm ${userColor.text} transition-transform group-hover:scale-105 origin-left inline-block`}
                    >
                      {user.name}
                    </Link>
                    <div className="text-xs text-slate-400">
                      L5: {user.last5_avg.toFixed(1)} | Season: {user.season_avg.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1 font-bold ${user.diff > 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {user.diff > 0 ? '+' : ''}
                  {user.diff.toFixed(1)}
                  {user.status === 'fire' && (
                    <Flame size={14} className="text-orange-500 animate-pulse" />
                  )}
                  {user.status === 'ice' && <Snowflake size={14} className="text-blue-300" />}
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
