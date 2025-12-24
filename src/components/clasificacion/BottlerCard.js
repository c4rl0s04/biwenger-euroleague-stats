'use client';

import { Wine, AlertTriangle } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function BottlerCard() {
  const { data = [], loading } = useApiData('/api/clasificacion/bottlers');

  return (
    <PremiumCard
      title="The Bottlers (Casi ganan)"
      icon={Wine}
      color="pink"
      loading={loading}
    >
      {!loading && data.length > 0 && (
        <div className="space-y-4 pr-2 mt-2">
            <p className="text-xs text-slate-400 italic px-2">
              Puntos por: 2º puesto (3pts), 3er puesto (1pt). Se resta por ganar (-2pts).
            </p>
          {data.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-sm">Nadie ha "boteado" todavía</p>
          ) : (
            data.map((user, index) => {
              const colors = getColorForUser(user.user_id, user.name);
              
              return (
                <div key={user.user_id} className="relative group">
                  <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10" />
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs border-2" 
                            style={{ 
                                backgroundColor: colors.stroke, 
                                borderColor: colors.fill 
                            }}
                        >
                            {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        {index === 0 && (
                            <div className="absolute -top-2 -right-2 bg-pink-500 text-white p-1 rounded-full shadow-lg">
                                <Wine size={12} />
                            </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{user.name}</p>
                        <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                {user.seconds}x 2º
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-700"></span>
                                {user.thirds}x 3º
                            </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="font-black text-2xl text-slate-200">
                        {user.bottler_score}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">
                        Bottler Score
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
