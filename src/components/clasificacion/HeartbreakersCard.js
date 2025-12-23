'use client';

import { HeartCrack } from 'lucide-react';
import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import { getColorForUser } from '@/lib/constants/colors';

export default function HeartbreakersCard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clasificacion/performance')
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data.heartbreakers) {
          setData(result.data.heartbreakers);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching heartbreaker stats:', err);
        setLoading(false);
      });
  }, []);

  return (
    <PremiumCard
      title="Casi, Casi (Heartbreakers)"
      icon={HeartCrack}
      color="rose"
      loading={loading}
    >
      {!loading && (
        <div className="space-y-4 pr-2 mt-2">
            <p className="text-xs text-slate-400 italic px-2">
              Suma de puntos por los que te has quedado sin ganar (siendo 2º).
            </p>
          {data.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">Sin dolor... todavía</p>
          ) : (
            data.map((user, index) => {
              const colors = getColorForUser(user.user_id, user.name);
              
              return (
                <div key={user.user_id} className="relative group">
                  <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-4 text-slate-500`}>
                        {index + 1}
                      </span>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white" 
                        style={{ backgroundColor: colors.stroke }}
                      >
                         {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <p className="font-medium text-slate-200">{user.name}</p>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <HeartCrack size={16} className="text-rose-500" />
                        <span className="font-black text-2xl text-slate-200">
                          {user.total_diff}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">
                        Perdidos
                      </span>
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
