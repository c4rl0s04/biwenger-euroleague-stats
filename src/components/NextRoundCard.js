'use client';

import { useUser } from '@/contexts/UserContext';
import { Calendar, TrendingUp, Star, ShoppingCart, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function NextRoundCard() {
  const { currentUser } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = currentUser?.id || '';
    
    fetch(`/api/next-round-data?userId=${userId}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching next round data:', err);
        setLoading(false);
      });
  }, [currentUser]);

  if (loading) {
    return (
      <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-700/50 rounded"></div>
          <div className="h-4 bg-slate-700/50 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const { nextRound, topPlayersForm, captainRecommendations, marketOpportunities } = data || {};

  return (
    <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 relative overflow-hidden group hover:border-slate-600/50 transition-all">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Calendar className="w-32 h-32 text-orange-500" />
      </div>

      <div className="relative">
        {/* Header - Compact */}
        <div className="mb-3">
          <h2 className="text-slate-400 font-medium mb-1 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-orange-500" />
            Próxima Jornada
          </h2>
          {nextRound ? (
            <div className="flex items-baseline gap-3">
              <div className="text-2xl font-bold text-white">{nextRound.round_name}</div>
              <div className="text-orange-500 font-mono text-xs">
                {new Date(nextRound.start_date).toLocaleDateString('es-ES', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-white">Temporada Finalizada</div>
          )}
        </div>

        {/* Content Grid - Tighter spacing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Top Players by Form - Top 5 */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3.5 border border-slate-700/30">
            <h3 className="text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Top Forma
            </h3>
            <div className="space-y-2">
              {topPlayersForm && topPlayersForm.length > 0 ? (
                topPlayersForm.slice(0, 5).map((player, idx) => (
                  <div key={player.player_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-slate-500 font-mono text-xs w-4">{idx + 1}.</span>
                      <span className="text-white truncate text-sm">{player.name}</span>
                    </div>
                    <span className="text-green-400 font-bold ml-2 text-sm">{Number(player.avg_points).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-sm">No hay datos disponibles</div>
              )}
            </div>
          </div>

          {/* Captain Recommendations - Top 5 */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3.5 border border-slate-700/30">
            <h3 className="text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Capitán Sugerido
            </h3>
            <div className="space-y-2">
              {captainRecommendations && captainRecommendations.length > 0 ? (
                captainRecommendations.slice(0, 5).map((player, idx) => (
                  <div key={player.player_id}>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium truncate text-sm">{player.name}</span>
                      <span className="text-yellow-400 font-bold ml-2 text-sm">{Number(player.avg_recent_points).toFixed(2)}</span>
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">{player.form_label}</div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-sm">Selecciona un usuario</div>
              )}
            </div>
          </div>

          {/* Market Opportunities - Top 5 */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3.5 border border-slate-700/30">
            <h3 className="text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              Oportunidades
            </h3>
            <div className="space-y-2">
              {marketOpportunities && marketOpportunities.length > 0 ? (
                marketOpportunities.slice(0, 5).map((player) => (
                  <div key={player.player_id}>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium truncate text-sm">{player.name}</span>
                      <span className="text-blue-400 font-mono text-xs ml-2">
                        {(player.price / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-0.5">
                      <span className="text-slate-500">{player.team}</span>
                      <span className="text-green-400">{Number(player.avg_recent_points).toFixed(2)} pts</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-sm">No hay chollos ahora</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Link - Minimal spacing */}
        <div className="mt-2.5">
          <Link 
            href="/matches" 
            className="text-xs text-slate-300 hover:text-white flex items-center gap-2 transition-colors group/link"
          >
            Ver calendario completo 
            <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
