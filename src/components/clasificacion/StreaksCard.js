'use client';

import { Flame } from 'lucide-react';
import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import { getColorForUser } from '@/lib/constants/colors';

export default function StreaksCard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clasificacion/performance')
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data.streaks) {
          setData(result.data.streaks);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching streak stats:', err);
        setLoading(false);
      });
  }, []);

  return (
    <PremiumCard
      title="Rachas > 50 Pts"
      icon={Flame}
      color="orange"
      loading={loading}
    >
      {!loading && (
        <div className="space-y-3 pr-2 mt-2">
          {data.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">Sin rachas activas</p>
          ) : (
            data.map((user, index) => {
              const colors = getColorForUser(user.user_id, user.name);
              
              return (
                <div key={user.user_id} className="relative group">
                  <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between p-2 rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-4 text-slate-500`}>
                        {index + 1}
                      </span>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white" 
                        style={{ backgroundColor: colors.stroke }}
                      >
                         {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <p className="font-medium text-slate-200">{user.name}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-orange-500 animate-pulse" />
                      <span className="font-bold text-white text-lg">
                        {user.longest_streak}
                      </span>
                      <span className="text-xs text-slate-400">jornadas</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </PremiumCard>
  );
}
