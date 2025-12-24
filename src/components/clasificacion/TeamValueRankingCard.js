'use client';

import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';
import { useApiData } from '@/lib/hooks/useApiData';

export default function TeamValueRankingCard() {
  const { data: ranking = [], loading } = useApiData('/api/standings/value-ranking');

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M€';
    }
    return new Intl.NumberFormat('es-ES').format(price) + '€';
  };

  const getPositionStyle = (position) => {
    if (position === 1) return 'bg-yellow-500 text-slate-900';
    if (position === 2) return 'bg-slate-300 text-slate-900';
    if (position === 3) return 'bg-orange-600 text-white';
    return 'bg-slate-700 text-slate-300';
  };

  return (
    <PremiumCard
      title="Ranking por Valor"
      icon={Wallet}
      color="emerald"
      loading={loading}
    >
      {!loading && (
        <div className="space-y-2">
          {ranking.length > 0 ? (
            ranking.map((user) => (
              <div 
                key={user.user_id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  user.value_position === 1 
                    ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/30' 
                    : 'bg-slate-800/40 border border-slate-700/30 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getPositionStyle(user.value_position)}`}>
                    {user.value_position}
                  </span>
                  {user.icon ? (
                    <img src={user.icon} alt={user.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">{user.name.charAt(0)}</div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-white block">{user.name}</span>
                    <span className="text-xs text-slate-500">{user.squad_size} jugadores</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${user.value_position === 1 ? 'text-emerald-400' : 'text-blue-400'}`}>
                    {formatPrice(user.team_value)}
                  </div>
                  {user.price_trend !== 0 && (
                    <div className={`flex items-center justify-end gap-1 text-xs ${user.price_trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {user.price_trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {user.price_trend > 0 ? '+' : ''}{formatPrice(user.price_trend)}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">No hay datos de valor</div>
          )}
        </div>
      )}
    </PremiumCard>
  );
}
