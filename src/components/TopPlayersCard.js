'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getScoreColor, getShortTeamName } from '@/lib/utils';

export default function TopPlayersCard() {
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch top players from API
    fetch('/api/top-players')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setTopPlayers(result.data || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching top players:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-slate-700/50 rounded"></div>
          <div className="h-16 bg-slate-700/50 rounded"></div>
          <div className="h-16 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" /> Top Jugadores
        </h2>
        <Link href="/players" className="text-sm text-green-400 hover:text-green-300">Ver todos</Link>
      </div>
      <div className="space-y-4">
        {topPlayers.length > 0 ? (
          topPlayers.map((player, index) => {
            const getRankStyles = (idx) => {
              if (idx === 0) return {
                bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
                text: 'text-yellow-400',
                rank: 'bg-yellow-500 text-slate-900 border-yellow-400'
              };
              if (idx === 1) return {
                bg: 'bg-gradient-to-r from-slate-400/20 to-slate-300/20 border-slate-400/30',
                text: 'text-slate-300',
                rank: 'bg-slate-300 text-slate-900 border-slate-200'
              };
              if (idx === 2) return {
                bg: 'bg-gradient-to-r from-orange-700/20 to-amber-800/20 border-orange-700/30',
                text: 'text-orange-400',
                rank: 'bg-orange-600 text-white border-orange-500'
              };
              return {
                bg: 'bg-slate-800/30 border-transparent hover:border-slate-700',
                text: 'text-white',
                rank: 'bg-slate-700 text-white border-slate-600'
              };
            };

            const styles = getRankStyles(index);

            return (
              <div key={player.id} className={`flex items-center gap-4 p-3 rounded-xl transition-colors border ${styles.bg}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 shadow-lg ${styles.rank}`}>
                  {index + 1}
                </div>
                <div className="flex-grow min-w-0">
                  <Link href={`/player/${player.id}`} className={`font-medium truncate hover:opacity-80 transition-opacity block ${index < 3 ? 'text-white' : 'text-slate-200'}`}>
                    {player.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                      {getShortTeamName(player.team)}
                    </div>
                    <div className="text-xs font-mono text-blue-400">
                      {new Intl.NumberFormat('es-ES').format(player.price)}€
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${styles.text}`}>{player.points} pts</div>
                  <div className="flex justify-end gap-1 mt-1">
                    {player.recent_scores ? (
                      player.recent_scores.split(',').slice(0, 5).map((score, i) => (
                        <span key={i} className={`text-[10px] px-1 py-0.5 rounded ${getScoreColor(score)}`}>
                          {score}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-600">-</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-slate-500 py-8">No hay datos disponibles</div>
        )}
      </div>
    </div>
  );
}
