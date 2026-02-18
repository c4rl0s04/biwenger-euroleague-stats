'use client';

import { CloudRain } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function NoGloryCard() {
  const { data = [], loading } = useApiData('/api/standings/no-glory');

  return (
    <Card
      title="Puntos sin Gloria"
      icon={CloudRain}
      color="slate"
      loading={loading}
      className="h-full flex flex-col"
    >
      {!loading &&
        (data.length > 0 ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
              <p className="text-xs text-slate-400 italic px-2">
                Total de puntos acumulados en jornadas donde{' '}
                <span className="text-orange-400 font-bold not-italic">no conseguiste ganar</span>.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {data.map((user, index) => {
                const { user_id, name, color_index } = user;
                const colors = getColorForUser(user_id, name, color_index);

                return (
                  <div key={user.user_id} className="relative group rounded-lg">
                    <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-center justify-between py-2 px-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold w-4 text-slate-500">{index + 1}</span>

                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white overflow-hidden border-2"
                          style={{
                            backgroundColor: user.icon ? 'transparent' : colors.stroke,
                            borderColor: colors.fill,
                          }}
                        >
                          {user.icon ? (
                            <img
                              src={user.icon}
                              alt={user.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = user.name
                                  .substring(0, 2)
                                  .toUpperCase();
                              }}
                            />
                          ) : (
                            user.name.substring(0, 2).toUpperCase()
                          )}
                        </div>

                        <Link
                          href={`/user/${user.user_id}`}
                          className={`${colors.text} block font-medium text-sm transition-transform group-hover:scale-105 origin-left`}
                        >
                          {user.name}
                        </Link>
                      </div>

                      <div className="flex flex-col items-end pl-2">
                        <span className="font-black text-xl text-slate-200">
                          {user.total_points_no_glory}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">
                          Puntos
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">Todos han ganado algo</div>
        ))}
    </Card>
  );
}
