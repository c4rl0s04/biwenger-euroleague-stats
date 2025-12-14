'use client';

import { Snowflake, TrendingDown, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getShortTeamName } from '@/lib/utils/format';
import PremiumCard from '@/components/ui/PremiumCard';

export default function ColdStreaksCard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/player-streaks')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setPlayers(result.data?.cold || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching streaks:', err);
        setLoading(false);
      });
  }, []);

  const infoTooltip = (
    <div className="group/info relative">
      <Info className="w-4 h-4 text-slate-500 hover:text-cyan-400 cursor-help transition-colors" />
      <div className="absolute right-0 top-6 w-64 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50">
        <p className="mb-2 font-semibold text-cyan-400">Criterio de Bache:</p>
        Comparativa entre la media de las últimas 5 jornadas (mín. 3 jugados) y la media de la temporada.
        <div className="mt-2 text-slate-400 border-t border-slate-700 pt-2">
          Se requiere un empeoramiento superior al <span className="text-white">20%</span>.
        </div>
      </div>
    </div>
  );

  return (
    <PremiumCard
      title="En Bache"
      icon={Snowflake}
      color="cyan"
      loading={loading}
      actionRight={infoTooltip}
    >
      {!loading && (
        <div className="flex-1 flex flex-col justify-between gap-2">
          {players && players.length > 0 ? (
            players.map((player) => (
              <div key={player.player_id} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:border-cyan-600/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link href={`/player/${player.player_id}`} className="font-medium text-white text-sm hover:text-cyan-400 transition-colors block">
                      {player.name}
                    </Link>
                    <div className="text-xs text-slate-400">{getShortTeamName(player.team)} · {player.position}</div>
                    {player.owner_name && (
                      <div className="text-xs text-blue-400">👤 {player.owner_name}</div>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <div className="flex items-center gap-1 text-sm font-bold text-cyan-400">
                      <TrendingDown className="w-4 h-4" />
                      {Math.abs(player.trend_pct)}%
                    </div>
                    <div className="text-xs text-slate-500">{player.recent_avg.toFixed(1)} pts/g</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">No hay jugadores en bache</div>
          )}
        </div>
      )}
    </PremiumCard>
  );
}
