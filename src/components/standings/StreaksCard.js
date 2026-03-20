'use client';

import { Flame } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import StatsList from '@/components/ui/StatsList';

export default function StreaksCard() {
  const { data = [], loading } = useApiData('/api/standings/streaks');

  return (
    <Card
      title="Rachas > 175 Pts"
      icon={Flame}
      color="orange"
      loading={loading}
      className="h-full flex flex-col"
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

            <StatsList
              items={data.map((user) => ({
                ...user,
                user_id: user.user_id, // Ensure consistency
              }))}
              renderRight={(user) => (
                <div className="flex flex-col items-end pl-2">
                  <div className="flex items-center gap-1">
                    <Flame size={14} className="text-orange-500 animate-pulse" />
                    <span className="font-black text-xl text-slate-200">{user.longest_streak}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Jornadas
                  </span>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">Sin rachas activas</div>
        ))}
    </Card>
  );
}
