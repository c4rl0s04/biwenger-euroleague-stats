'use client';

import Link from 'next/link';
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Box 1: Participants */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-slate-400 text-xs uppercase tracking-wider">
                  Participantes
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.total_users}</div>
              <div className="text-xs text-slate-500">{stats.total_rounds} jornadas</div>
            </div>

            {/* Box 2: Total Points */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <span className="text-slate-400 text-xs uppercase tracking-wider">
                  Total Puntos
                </span>
              </div>
              <div className="text-2xl font-bold text-orange-400">{stats.total_points}</div>
              <div className="text-xs text-slate-500">Media: {stats.avg_round_points}/jornada</div>
            </div>

            {/* Box 3: League Value */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span className="text-slate-400 text-xs uppercase tracking-wider">Valor Liga</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {formatPrice(stats.total_league_value)}
              </div>
              <div className="flex flex-col text-xs text-slate-500 mt-1">
                <span>Min: {formatPrice(stats.min_team_value)}</span>
                <span>Max: {formatPrice(stats.max_team_value)}</span>
              </div>
            </div>

            {/* Box 4: MVP Team (Clickable) */}
            {stats.most_valuable_user && (
              <Link
                href={`/user/${stats.most_valuable_user.id || stats.most_valuable_user.user_id}`}
                className="block group"
              >
                <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl p-4 border border-yellow-500/20 group-hover:border-yellow-500/50 transition-all h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <span className="text-slate-400 text-xs uppercase tracking-wider">
                      Más Valiosa
                    </span>
                  </div>
                  <div className="text-xl font-bold text-yellow-400 truncate">
                    {formatPrice(stats.most_valuable_user.team_value)}
                  </div>
                  <div className="mt-1">
                    <span className="text-xs text-muted-foreground truncate transition-colors group-hover:text-yellow-400">
                      {stats.most_valuable_user.name}
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Box 5: Round Record (Clickable) */}
            {stats.round_record && (
              <Link href={`/user/${stats.round_record.user_id}`} className="block group">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20 group-hover:border-purple-500/50 transition-all h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <span className="text-slate-400 text-xs uppercase tracking-wider">Récord</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-400">
                    {stats.round_record.points} pts
                  </div>
                  <div className="text-xs text-slate-500 truncate transition-colors group-hover:text-purple-400">
                    {stats.round_record.name}
                  </div>
                </div>
              </Link>
            )}

            {/* Box 6: Streak */}
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-slate-400 text-xs uppercase tracking-wider">Racha Líder</span>
              </div>
              <div className="text-2xl font-bold text-orange-400">{stats.leader_streak || 0}</div>
              <div className="text-xs text-slate-500">Consecutivas</div>
            </div>
          </div>

          {/* Season Progress Bar */}
          {(() => {
            const TOTAL_ROUNDS = Number(stats.total_season_rounds) || 34;
            const playedRounds = Number(stats.total_rounds) || 0;
            const remainingRounds = Math.max(0, TOTAL_ROUNDS - playedRounds);
            const progressPct = Math.min(100, Math.max(0, (playedRounds / TOTAL_ROUNDS) * 100));

            return (
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs uppercase tracking-wider">
                    Progreso Temporada
                  </span>
                  <span className="text-slate-300 text-sm font-medium">
                    {playedRounds} / {TOTAL_ROUNDS}
                  </span>
                </div>
                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full accent-gradient rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
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
