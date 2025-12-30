'use client';

import { BarChart3, Users, TrendingUp, Crown, Zap, Flame } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function LeagueStatsCard() {
  const { data: stats = null, loading } = useApiData('/api/standings/league-totals');

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M€';
    }
    return new Intl.NumberFormat('es-ES').format(price) + '€';
  };

  return (
    <Card title="Estadísticas de Liga" icon={BarChart3} color="cyan" loading={loading}>
      {!loading && stats && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400 text-[10px] uppercase tracking-wider">
                  Participantes
                </span>
              </div>
              <div className="text-xl font-bold text-white">{stats.total_users}</div>
              <div className="text-[10px] text-slate-500">{stats.total_rounds} jornadas</div>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span className="text-slate-400 text-[10px] uppercase tracking-wider">
                  Total Puntos
                </span>
              </div>
              <div className="text-xl font-bold text-orange-400">{stats.total_points}</div>
              <div className="text-[10px] text-slate-500">
                Media: {stats.avg_round_points}/jornada
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-[10px] uppercase tracking-wider">
                Valor Total Liga
              </span>
            </div>
            <div className="text-xl font-bold text-blue-400">
              {formatPrice(stats.total_league_value)}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Min: {formatPrice(stats.min_team_value)}</span>
              <span>Max: {formatPrice(stats.max_team_value)}</span>
            </div>
          </div>

          {/* Round Record & Leader Streak Row */}
          <div className="grid grid-cols-2 gap-3">
            {stats.round_record && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-3 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider">
                    Récord Jornada
                  </span>
                </div>
                <div className="text-xl font-bold text-purple-400">
                  {stats.round_record.points} pts
                </div>
                <div className="text-[10px] text-slate-500">
                  {stats.round_record.name} · {stats.round_record.round_name}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-3 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-slate-400 text-[10px] uppercase tracking-wider">
                  Racha Líder
                </span>
              </div>
              <div className="text-xl font-bold text-orange-400">{stats.leader_streak || 0}</div>
              <div className="text-[10px] text-slate-500">Victorias consecutivas</div>
            </div>
          </div>

          {stats.most_valuable_user && (
            <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl p-3 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-400 text-[10px] uppercase tracking-wider">
                  Plantilla Más Valiosa
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {stats.most_valuable_user.icon ? (
                    <img
                      src={stats.most_valuable_user.icon}
                      alt={stats.most_valuable_user.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium">
                      {stats.most_valuable_user.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium text-white text-sm">
                    {stats.most_valuable_user.name}
                  </span>
                </div>
                <span className="text-yellow-400 font-bold text-sm">
                  {formatPrice(stats.most_valuable_user.team_value)}
                </span>
              </div>
            </div>
          )}

          {/* Season Progress Bar */}
          {(() => {
            const TOTAL_ROUNDS = stats.total_season_rounds || 34;
            const playedRounds = stats.total_rounds || 0;
            const remainingRounds = TOTAL_ROUNDS - playedRounds;
            const progressPct = (playedRounds / TOTAL_ROUNDS) * 100;

            return (
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider">
                    Progreso Temporada
                  </span>
                  <span className="text-slate-300 text-xs font-medium">
                    {playedRounds} / {TOTAL_ROUNDS}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>{Math.round(progressPct)}% completado</span>
                  <span>{remainingRounds} jornadas restantes</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </Card>
  );
}
