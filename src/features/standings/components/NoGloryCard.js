'use client';

import { CloudRain } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import StatsList from '@/components/ui/StatsList';
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
              <p className="text-xs text-slate-300 font-medium italic px-2">
                Total de puntos acumulados en jornadas donde{' '}
                <span className="text-orange-400 font-bold not-italic">no conseguiste ganar</span>.
              </p>
            </div>

            <StatsList
              items={data}
              renderRight={(user) => (
                <div className="flex flex-col items-end pl-2">
                  <span className="font-black text-xl text-slate-200">
                    {user.total_points_no_glory}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    Puntos
                  </span>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="text-center text-slate-400 py-8">Todos han ganado algo</div>
        ))}
    </Card>
  );
}
