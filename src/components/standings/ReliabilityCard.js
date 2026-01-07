'use client';

import { Activity } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function ReliabilityCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=reliability');

  return (
    <Card
      title="Fiabilidad (> Media)"
      icon={Activity}
      color="green"
      loading={loading}
      tooltip="Porcentaje de jornadas en las que el usuario ha superado la media de puntos de esa jornada."
      className="h-full flex flex-col"
    >
      {!loading && data.length > 0 ? (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
            <p className="text-xs text-slate-400 italic px-2">
              Frecuencia con la que superas la{' '}
              <span className="text-green-400 font-bold not-italic">media</span>. &quot;Ganar el
              par&quot;.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {data.map((user, index) => {
              const colors = getColorForUser(user.user_id, user.name);
              const percentage = user.pct;

              return (
                <div key={user.user_id} className="relative group rounded-lg">
                  {/* Hover background for the row */}
                  <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-center justify-between py-2 px-1">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Rank */}
                      <span
                        className={`text-sm font-bold w-4 ${index < 3 ? 'text-yellow-400' : 'text-slate-500'}`}
                      >
                        {index + 1}
                      </span>

                      {/* Color Pill - Always uses user color now */}
                      <div
                        className="w-1 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colors.stroke }}
                      />

                      {/* Name & Bar */}
                      <div className="flex-1 min-w-0 pr-3">
                        <Link
                          href={`/user/${user.user_id}`}
                          // Removed hover:underline, added transition and group-hover zoom
                          className={`${colors.text} block font-medium text-sm truncate transition-transform group-hover:scale-105 origin-left`}
                        >
                          {user.name}
                        </Link>

                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                          {/* Progress Bar - Always uses user color now */}
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: colors.stroke,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0 pl-2">
                      <span
                        className={`font-black text-xl ${percentage >= 50 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {percentage.toFixed(0)}%
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">
                        Reliability
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center text-slate-500 py-8">No hay datos de fiabilidad</div>
        )
      )}
    </Card>
  );
}
