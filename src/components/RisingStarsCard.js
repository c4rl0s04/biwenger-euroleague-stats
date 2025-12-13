'use client';

import { Sparkles , TrendingUp, ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getShortTeamName } from '@/lib/utils/format';

export default function RisingStarsCard() {
  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rising-stars')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setStars(result.data || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching rising stars:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-slate-700/50 rounded"></div>
          <div className="h-16 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 backdrop-blur-md border border-emerald-700/30 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-600/50 transition-all h-full flex flex-col">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="w-32 h-32 text-emerald-500" />
      </div>

      <div className="relative flex-1 flex flex-col">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4 shrink-0">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          Estrellas Emergentes
        </h2>

        <div className="flex-1 flex flex-col justify-between gap-2">
          {stars && stars.length > 0 ? (
            stars.map((player) => (
              <div key={player.player_id} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:border-emerald-600/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm flex items-center gap-2">
                      <Link href={`/player/${player.player_id}`} className="hover:text-emerald-400 transition-colors">
                        {player.name}
                      </Link>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xs text-slate-400">{getShortTeamName(player.team)} · {player.position}</div>
                    {player.owner_name && (
                      <div className="text-xs text-blue-400">👤 {player.owner_name}</div>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-sm font-bold text-emerald-400">+{player.improvement.toFixed(1)}</div>
                        <div className="text-xs text-slate-500">{player.improvement_pct}%</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{player.recent_avg.toFixed(1)} pts/g</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">No hay datos suficientes</div>
          )}
        </div>
      </div>
    </div>
  );
}
