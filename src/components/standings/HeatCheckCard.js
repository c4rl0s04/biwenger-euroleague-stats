'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Flame, Snowflake } from 'lucide-react';
import StatsList from '@/components/ui/StatsList';

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
        <StatsList
          items={data.map((user) => ({
            ...user,
            subtitle: `L5: ${user.last5_avg.toFixed(1)} | Season: ${user.season_avg.toFixed(1)}`,
          }))}
          renderRight={(user) => (
            <>
              <div
                className={`flex items-center gap-1 font-black text-sm ${user.diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {user.diff > 0 ? '+' : ''}
                {user.diff.toFixed(1)}
              </div>
              <div className="w-6 flex justify-center">
                {user.status === 'fire' && (
                  <Flame size={16} className="text-orange-500 animate-pulse fill-orange-500/20" />
                )}
                {user.status === 'ice' && <Snowflake size={16} className="text-blue-300" />}
                {user.status === 'neutral' && <div className="w-[16px]" />}
              </div>
            </>
          )}
        />
      ) : (
        !loading && <div className="text-center text-slate-500 py-4">No hay datos suficientes</div>
      )}
    </Card>
  );
}
