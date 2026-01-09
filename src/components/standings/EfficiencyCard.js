'use client';

import { Coins } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function EfficiencyCard() {
  const { data = [], loading } = useApiData('/api/standings/efficiency');

  // Calculate max for relative bar width
  const maxValue =
    !loading && data.length > 0 ? Math.max(...data.map((d) => d.points_per_million)) : 100;

  return (
    <Card
      title="Eficiencia (ROI)"
      icon={Coins}
      color="yellow"
      loading={loading}
      className="h-full flex flex-col"
    >
      {!loading && data.length > 0 ? (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
            <p className="text-xs text-slate-400 italic px-2">
              Relación entre puntos totales y valor de mercado (ROI).
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {data.map((user, index) => {
              const { user_id, name, color_index } = user;
              const colors = getColorForUser(user_id, name, color_index);
              const percentage = (user.points_per_million / maxValue) * 100;

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

                      {/* Color Pill */}
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
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: colors.stroke,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0 pl-2">
                      <span className="font-black text-xl text-yellow-400 flex items-center gap-1">
                        {user.points_per_million}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">
                        {(user.team_value / 1000000).toFixed(1)}M Valor
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
          <div className="text-center text-slate-500 py-8">No hay datos de eficiencia</div>
        )
      )}
    </Card>
  );
}
