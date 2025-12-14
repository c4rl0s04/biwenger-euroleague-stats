'use client';

import { Flame, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getShortTeamName } from '@/lib/utils/format';

export default function HotStreaksCard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/player-streaks')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setPlayers(result.data?.hot || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching streaks:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 animate-pulse h-full">
        <div className="h-6 bg-slate-700/50 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-slate-700/50 rounded"></div>
          <div className="h-16 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-900/20 to-slate-900 backdrop-blur-md border border-orange-700/30 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-600/50 transition-all h-full flex flex-col">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Flame className="w-32 h-32 text-orange-500" />
      </div>

      <div className="relative flex-1 flex flex-col">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4 shrink-0">
          <Flame className="w-5 h-5 text-orange-500" />
          En Racha
        </h2>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between gap-2">
          {players && players.length > 0 ? (
            players.map((player) => (
              <div key={player.player_id} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:border-orange-600/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link href={`/player/${player.player_id}`} className="font-medium text-white text-sm hover:text-orange-400 transition-colors block">
                      {player.name}
                    </Link>
                    <div className="text-xs text-slate-400">{getShortTeamName(player.team)} · {player.position}</div>
                    {player.owner_name && (
                      <div className="text-xs text-blue-400">👤 {player.owner_name}</div>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <div className="flex items-center gap-1 text-sm font-bold text-orange-400">
                      <TrendingUp className="w-4 h-4" />
                      {Math.abs(player.trend_pct)}%
                    </div>
                    <div className="text-xs text-slate-500">{player.recent_avg.toFixed(1)} pts/g</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">No hay jugadores en racha</div>
          )}
        </div>
      </div>
    </div>
  );
}
