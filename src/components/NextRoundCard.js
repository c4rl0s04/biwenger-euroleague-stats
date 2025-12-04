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
    <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-600/50 transition-all">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Calendar className="w-32 h-32 text-orange-500" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-slate-400 font-medium mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Próxima Jornada
          </h2>
          {nextRound ? (
            <>
              <div className="text-3xl font-bold text-white mb-2">{nextRound.round_name}</div>
              <div className="text-orange-500 font-mono text-lg">
                {new Date(nextRound.start_date).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </>
          ) : (
            <div className="text-2xl font-bold text-white">Temporada Finalizada</div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top Players by Form */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Top Forma
            </h3>
            <div className="space-y-2">
              {topPlayersForm && topPlayersForm.length > 0 ? (
                topPlayersForm.slice(0, 3).map((player, idx) => (
                  <div key={player.player_id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-slate-500 font-mono w-4">{idx + 1}.</span>
                      <span className="text-white truncate">{player.name}</span>
                    </div>
                    <span className="text-green-400 font-bold ml-2">{player.avg_points}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs">No hay datos disponibles</div>
              )}
            </div>
          </div>

          {/* Captain Recommendations */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Capitán Sugerido
            </h3>
            <div className="space-y-2">
              {captainRecommendations && captainRecommendations.length > 0 ? (
                captainRecommendations.slice(0, 3).map((player, idx) => (
                  <div key={player.player_id} className="text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium truncate">{player.name}</span>
                      <span className="text-yellow-400 font-bold ml-2">{player.avg_recent_points}</span>
                    </div>
                    <div className="text-slate-500 text-[10px] mt-0.5">{player.form_label}</div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs">Selecciona un usuario</div>
              )}
            </div>
          </div>

          {/* Market Opportunities */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              Oportunidades
            </h3>
            <div className="space-y-2">
              {marketOpportunities && marketOpportunities.length > 0 ? (
                marketOpportunities.slice(0, 3).map((player) => (
                  <div key={player.player_id} className="text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium truncate">{player.name}</span>
                      <span className="text-blue-400 font-mono text-[10px] ml-2">
                        {(player.price / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-0.5">
                      <span className="text-slate-500">{player.team}</span>
                      <span className="text-green-400">{player.avg_recent_points} pts</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs">No hay chollos ahora</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-4 pt-4 border-t border-slate-800/50">
          <Link 
            href="/matches" 
            className="text-sm text-slate-300 hover:text-white flex items-center gap-2 transition-colors group/link"
          >
            Ver calendario completo 
            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
