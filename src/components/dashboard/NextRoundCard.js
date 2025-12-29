'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { Calendar, TrendingUp, Star, ShoppingCart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getScoreColor, getShortTeamName } from '@/lib/utils/format';
import { PremiumCard } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function NextRoundCard() {
  const { currentUser, isReady } = useClientUser();
  const userId = currentUser?.id || '';

  const { data = {}, loading } = useApiData(`/api/dashboard/next-round?userId=${userId}`, {
    dependencies: [userId],
  });

  // Don't render on server to prevent hydration mismatch
  if (!isReady) {
    return <PremiumCard loading={true} className="lg:col-span-2" />;
  }

  const { nextRound, topPlayersForm, captainRecommendations, marketOpportunities } = data || {};

  const headerAction = nextRound ? (
    <div className="text-right">
      <div className="text-lg font-bold text-white">{nextRound.round_name}</div>
      <div className="text-blue-400 font-mono text-xs">
        {new Date(nextRound.start_date).toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  ) : (
    <div className="text-lg font-bold text-white">Temporada Finalizada</div>
  );

  return (
    <PremiumCard
      title="Próxima Jornada"
      icon={Calendar}
      color="blue"
      className="lg:col-span-2"
      actionRight={headerAction}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Top Players by Form */}
        <div className="bg-gradient-to-br from-green-900/10 to-slate-800/40 backdrop-blur-sm rounded-xl p-3.5 border border-green-700/30">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Top Forma
          </h3>
          <div className="space-y-3">
            {topPlayersForm && topPlayersForm.length > 0 ? (
              topPlayersForm.slice(0, 5).map((player, idx) => (
                <div key={player.player_id} className="group/item">
                  {/* Line 1: Name */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-500 font-mono text-xs w-4 shrink-0">
                      {idx + 1}.
                    </span>
                    <Link
                      href={`/player/${player.player_id}`}
                      className="text-white font-medium text-sm truncate hover:text-green-400 transition-colors"
                      title={player.name}
                    >
                      {player.name}
                    </Link>
                  </div>

                  {/* Line 2: Context */}
                  <div className="pl-6 mb-1.5 space-y-0.5">
                    <div className="text-xs text-slate-400 truncate" title={player.team}>
                      {getShortTeamName(player.team)}
                    </div>
                    {player.owner_name && (
                      <div
                        className="text-xs text-blue-400 truncate"
                        title={`Dueño: ${player.owner_name}`}
                      >
                        👤 {player.owner_name}
                      </div>
                    )}
                  </div>

                  {/* Line 3: Scores & Avg */}
                  <div className="flex items-center justify-between pl-6">
                    <div className="flex gap-1">
                      {player.recent_scores &&
                        player.recent_scores.split(',').map((score, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${getScoreColor(score)}`}
                          >
                            {score}
                          </span>
                        ))}
                    </div>
                    <span className="text-green-400 font-bold text-sm">
                      {Number(player.avg_points).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-sm">No hay datos disponibles</div>
            )}
          </div>
        </div>

        {/* Captain Recommendations */}
        <div className="bg-gradient-to-br from-yellow-900/10 to-slate-800/40 backdrop-blur-sm rounded-xl p-3.5 border border-yellow-700/30">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Capitán Sugerido
          </h3>
          <div className="space-y-3">
            {captainRecommendations && captainRecommendations.length > 0 ? (
              captainRecommendations.slice(0, 6).map((player) => (
                <div key={player.player_id} className="group/item">
                  {/* Line 1: Name */}
                  <div className="mb-1">
                    <Link
                      href={`/player/${player.player_id}`}
                      className="text-white font-medium text-sm truncate block hover:text-yellow-400 transition-colors"
                      title={player.name}
                    >
                      {player.name}
                    </Link>
                  </div>

                  {/* Line 2: Context */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                    <span className="truncate" title={player.team}>
                      {getShortTeamName(player.team)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                    <span className="text-yellow-500/80">{player.form_label}</span>
                  </div>

                  {/* Line 3: Scores & Avg */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {player.recent_scores &&
                        player.recent_scores.split(',').map((score, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${getScoreColor(score)}`}
                          >
                            {score}
                          </span>
                        ))}
                    </div>
                    <span className="text-yellow-400 font-bold text-sm">
                      {Number(player.avg_recent_points).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-sm">Selecciona un usuario</div>
            )}
          </div>
        </div>

        {/* Market Opportunities */}
        <div className="bg-gradient-to-br from-blue-900/10 to-slate-800/40 backdrop-blur-sm rounded-xl p-3.5 border border-blue-700/30">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-500" />
            Oportunidades
          </h3>
          <div className="space-y-3">
            {marketOpportunities && marketOpportunities.length > 0 ? (
              marketOpportunities.slice(0, 6).map((player) => (
                <div key={player.player_id} className="group/item">
                  {/* Line 1: Name */}
                  <div className="mb-1">
                    <Link
                      href={`/player/${player.player_id}`}
                      className="text-white font-medium text-sm truncate block hover:text-blue-400 transition-colors"
                      title={player.name}
                    >
                      {player.name}
                    </Link>
                  </div>

                  {/* Line 2: Context */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                    <span className="truncate" title={player.team}>
                      {getShortTeamName(player.team)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                    <span className="text-blue-400 font-mono">
                      {new Intl.NumberFormat('es-ES').format(player.price)}€
                    </span>
                  </div>

                  {/* Line 3: Scores & Avg */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {player.recent_scores &&
                        player.recent_scores.split(',').map((score, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${getScoreColor(score)}`}
                          >
                            {score}
                          </span>
                        ))}
                    </div>
                    <span className="text-green-400 font-bold text-sm">
                      {Number(player.avg_recent_points).toFixed(1)} pts
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-sm">No hay chollos ahora</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-700/30 pt-3">
        <div className="text-xs text-slate-500 italic">
          * Datos calculados en base a las últimas 3 jornadas
        </div>
        <Link
          href="/matches"
          className="text-xs text-slate-300 hover:text-white flex items-center gap-2 transition-colors group/link"
        >
          Ver calendario completo
          <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </PremiumCard>
  );
}
