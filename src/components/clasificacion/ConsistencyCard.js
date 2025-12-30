'use client';

import { Activity } from 'lucide-react';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function ConsistencyCard() {
  const { data = [], loading } = useApiData('/api/standings/volatility');

  return (
    <Card title="Consistencia (Volatilidad)" icon={Activity} color="green" loading={loading}>
      {!loading &&
        (data.length > 0 ? (
          <div className="space-y-4 pr-2">
            <div className="flex justify-between text-xs text-slate-400 px-2 mb-2">
              <span>Usuario</span>
              <div className="flex gap-4">
                <span className="w-16 text-right">Promedio</span>
                <span className="w-16 text-right">Desv. Est.</span>
              </div>
            </div>
            {data.map((user, index) => {
              const colors = getColorForUser(user.user_id, user.name);

              // Calculate a simple "consistency score" for visual bar width inverted
              // Lower std dev is better. Let's say max reasonable std dev is 50.
              const percentage = Math.max(0, Math.min(100, (1 - user.std_dev / 50) * 100));

              return (
                <div key={user.user_id} className="relative group">
                  <div className="absolute inset-0 bg-slate-800/50 rounded-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between p-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-bold w-4 ${index < 3 ? 'text-yellow-400' : 'text-slate-500'}`}
                      >
                        {index + 1}
                      </span>
                      <div
                        className="w-1 h-8 rounded-full"
                        style={{ backgroundColor: colors.stroke }}
                      />
                      <div>
                        <p className="font-medium text-slate-200">{user.name}</p>
                        <div className="w-24 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
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

                    <div className="flex gap-4 text-sm">
                      <span className="w-16 text-right text-slate-400 font-mono">
                        {user.avg_points}
                      </span>
                      <span className="w-16 text-right font-bold text-white font-mono">
                        {user.std_dev}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">No hay datos de consistencia</div>
        ))}
    </Card>
  );
}
