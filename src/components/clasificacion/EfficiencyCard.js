'use client';

import { Coins, CircleDollarSign } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function EfficiencyCard() {
  const { data = [], loading } = useApiData('/api/clasificacion/efficiency');

  return (
    <PremiumCard
      title="Eficiencia (ROI)"
      icon={Coins}
      color="yellow"
      loading={loading}
    >
      {!loading && data.length > 0 && (
        <div className="space-y-4 pr-2 mt-2">
            <p className="text-xs text-slate-400 italic px-2">
              Relación entre puntos totales y valor de mercado. Indica el retorno de inversión (ROI).
            </p>
          {data.map((user, index) => {
             const colors = getColorForUser(user.user_id, user.name);
             const maxValue = Math.max(...data.map(d => d.points_per_million));
             const percentage = (user.points_per_million / maxValue) * 100;

             return (
              <div key={user.user_id} className="relative group">
                <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-4 text-slate-500`}>
                      {index + 1}
                    </span>
                    <div 
                      className="w-1 h-10 rounded-full" 
                      style={{ backgroundColor: colors.stroke }}
                    />
                    <div>
                      <p className="font-medium text-slate-200">{user.name}</p>
                      <div className="w-24 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: colors.stroke 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="font-black text-2xl text-yellow-400 flex items-center gap-1">
                      <CircleDollarSign size={16} />
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
      )}
    </PremiumCard>
  );
}
