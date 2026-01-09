'use client';

import { Flame } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function StreaksCard() {
  const { data = [], loading } = useApiData('/api/standings/streaks');

  return (
    <Card
      title="Rachas > 175 Pts"
      icon={Flame}
      color="orange"
      loading={loading}
      className="h-full flex flex-col" // 1. Set full height
    >
      {!loading &&
        (data.length > 0 ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Fixed height header for alignment */}
            <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
              <p className="text-xs text-slate-400 italic px-2">
                Número de jornadas consecutivas en las que el usuario ha superado los 175 puntos.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {data.map((user, index) => {
                const { user_id, name, color_index, longest_streak } = user;
                const colors = getColorForUser(user_id, name, color_index);

                return (
                  <div key={user.user_id} className="relative group rounded-lg">
                    {/* Hover background only - NO BORDERS */}
                    <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-center justify-between py-2 px-1">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold w-4 text-slate-500`}>{index + 1}</span>

                        {/* Avatar Circle */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
                          style={{ backgroundColor: colors.stroke }}
                        >
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>

                        <Link
                          href={`/user/${user.user_id}`}
                          className={`${colors.text} block font-medium text-sm transition-transform group-hover:scale-105 origin-left`}
                        >
                          {user.name}
                        </Link>
                      </div>

                      <div className="flex flex-col items-end pl-2">
                        <div className="flex items-center gap-1">
                          <Flame size={14} className="text-orange-500 animate-pulse" />
                          <span className="font-black text-xl text-slate-200">
                            {user.longest_streak}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">
                          Jornadas
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">Sin rachas activas</div>
        ))}
    </Card>
  );
}
