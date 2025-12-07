'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
          topPlayers.map((player, index) => (
            <div key={player.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-lg font-bold text-white border-2 border-slate-600">
                {index + 1}
              </div>
              <div className="flex-grow min-w-0">
                <Link href={`/player/${player.id}`} className="font-medium text-white truncate hover:text-green-400 transition-colors block">
                  {player.name}
                </Link>
                <div className="text-xs text-slate-400">{player.team} · {player.position}</div>
                {player.owner_name && (
                  <div className="text-xs text-blue-400">👤 {player.owner_name}</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold text-green-400">{player.points} pts</div>
                <div className="text-xs text-slate-500">{player.average} avg</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-500 py-8">No hay datos disponibles</div>
        )}
      </div>
    </div>
  );
}
