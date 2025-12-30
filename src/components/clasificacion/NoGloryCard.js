'use client';

import { CloudRain } from 'lucide-react';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function NoGloryCard() {
  const { data = [], loading } = useApiData('/api/standings/no-glory');

  return (
    <Card title="Puntos sin Gloria" icon={CloudRain} color="slate" loading={loading}>
      {!loading &&
        (data.length > 0 ? (
          <div className="space-y-4 pr-2 mt-2">
            <p className="text-xs text-slate-400 italic px-2">
              Total de puntos acumulados en jornadas donde no conseguiste ganar.
            </p>
            {data.map((user, index) => {
              const colors = getColorForUser(user.user_id, user.name);

              return (
                <div key={user.user_id} className="relative group">
                  <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-4 text-slate-500`}>{index + 1}</span>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white"
                        style={{ backgroundColor: colors.stroke }}
                      >
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <p className="font-medium text-slate-200">{user.name}</p>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <span className="font-black text-2xl text-slate-200">
                          {user.total_points_no_glory}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">
                        Puntos
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">Todos han ganado algo</div>
        ))}
    </Card>
  );
}
