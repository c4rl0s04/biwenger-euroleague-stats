'use client';

import { Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import StatsList from '@/components/ui/StatsList';

export default function InitialSquadAnalysisCard() {
  const { data = [], loading, error } = useApiData('/api/standings/analytics');

  const getROIColor = (roi) => {
    if (roi >= 80) return 'text-emerald-400';
    if (roi >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <Card title="Initial Squad ROI" icon={Target} color="cyan" loading={loading}>
      {!loading && (
        <div className="flex flex-col h-full overflow-hidden">
          <p className="text-xs text-slate-400 italic px-2 mb-4 flex-shrink-0">
            Compara el rendimiento real de tu plantilla inicial vs su potencial máximo
          </p>

          {error ? (
            <p className="text-red-400 text-center py-4 text-sm">{error}</p>
          ) : data.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">
              No hay datos de plantillas iniciales
            </p>
          ) : (
            <StatsList
              items={data.map((user) => ({
                ...user,
                name: user.user_name,
                color_index: user.user_color_index,
                // user_id and icon are now provided by the updated API
                subtitle: (
                  <span className="flex gap-3">
                    <span>
                      Real:{' '}
                      <span className="text-slate-300">
                        {(user.actual_points ?? 0).toLocaleString()}
                      </span>
                    </span>
                    <span>
                      Max:{' '}
                      <span className="text-slate-300">
                        {(user.potential_points ?? 0).toLocaleString()}
                      </span>
                    </span>
                  </span>
                ),
              }))}
              renderRight={(user, index) => (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    {index === 0 && <TrendingUp size={14} className="text-cyan-500" />}
                    <span
                      className={`font-black text-2xl ${getROIColor(user.roi_percentage)} leading-none`}
                    >
                      {user.roi_percentage}%
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">
                    ROI
                  </span>
                </div>
              )}
            />
          )}
        </div>
      )}
    </Card>
  );
}
