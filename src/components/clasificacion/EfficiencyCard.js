'use client';

import { Coins, CircleDollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import { getColorForUser } from '@/lib/constants/colors';

export default function EfficiencyCard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clasificacion/performance')
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data.efficiency) {
          setData(result.data.efficiency);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching efficiency stats:', err);
        setLoading(false);
      });
  }, []);

  return (
    <PremiumCard
      title="Eficiencia (ROI)"
      icon={Coins}
      color="yellow"
      loading={loading}
    >
      {!loading && (
        <div className="space-y-4 pr-2">
          <div className="flex justify-between text-xs text-slate-400 px-2 mb-2">
            <span>Usuario</span>
            <div className="flex gap-4">
              <span className="w-20 text-right">Valor</span>
              <span className="w-16 text-right">Pts/M</span>
            </div>
          </div>
          {data.map((user, index) => {
             const colors = getColorForUser(user.user_id, user.name);
             const maxValue = Math.max(...data.map(d => d.points_per_million));
             const percentage = (user.points_per_million / maxValue) * 100;

             return (
              <div key={user.user_id} className="relative group">
                <div className="absolute inset-0 bg-slate-800/50 rounded-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between p-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-4 text-slate-500`}>
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
                            backgroundColor: colors.stroke 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm items-center">
                    <span className="w-20 text-right text-slate-400 font-mono text-xs">
                       {(user.team_value / 1000000).toFixed(1)}M
                    </span>
                    <span className="w-16 text-right font-bold text-yellow-400 font-mono flex items-center justify-end gap-1">
                      <CircleDollarSign size={10} />
                      {user.points_per_million}
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
