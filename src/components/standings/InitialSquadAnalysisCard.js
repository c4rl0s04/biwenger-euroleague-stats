'use client';

import { Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

/**
 * InitialSquadAnalysisCard
 * Shows ROI analysis of users' initial squads vs actual performance
 */
export default function InitialSquadAnalysisCard() {
  const { data = [], loading, error } = useApiData('/api/standings/analytics');

  // Calculate color based on ROI percentage
  const getROIColor = (roi) => {
    if (roi >= 80) return 'text-emerald-400';
    if (roi >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <Card title="Initial Squad ROI" icon={Target} color="cyan" loading={loading}>
      {!loading && (
        <div className="space-y-4 pr-2 mt-2">
          <p className="text-xs text-slate-400 italic px-2">
            Compara el rendimiento real de tu plantilla inicial vs su potencial máximo
          </p>

          {error ? (
            <p className="text-red-400 text-center py-4 text-sm">{error}</p>
          ) : data.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">
              No hay datos de plantillas iniciales
            </p>
          ) : (
            data.map((user, index) => {
              const colors = getColorForUser(null, user.user_name, user.user_color_index);

              return (
                <div key={user.user_name} className="relative group">
                  <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10" />
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs border-2"
                          style={{
                            backgroundColor: colors.stroke,
                            borderColor: colors.fill,
                          }}
                        >
                          {user.user_name.substring(0, 2).toUpperCase()}
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-2 -right-2 bg-cyan-500 text-white p-1 rounded-full shadow-lg">
                            <TrendingUp size={12} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{user.user_name}</p>
                        <div className="flex gap-3 text-[10px] text-slate-400 mt-1">
                          <span>
                            Real:{' '}
                            <span className="text-slate-300 font-medium">
                              {(user.actual_points ?? 0).toLocaleString()}
                            </span>
                          </span>
                          <span>
                            Max:{' '}
                            <span className="text-slate-300 font-medium">
                              {(user.potential_points ?? 0).toLocaleString()}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className={`font-black text-2xl ${getROIColor(user.roi_percentage)}`}>
                        {user.roi_percentage}%
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">
                        ROI
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
}
