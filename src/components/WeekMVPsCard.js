'use client';

import { Trophy, Award } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function WeekMVPsCard() {
  const [mvps, setMvps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/last-round-mvps')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setMvps(result.data || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching MVPs:', err);
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
    <div className="bg-gradient-to-br from-yellow-900/20 to-slate-900 backdrop-blur-md border border-yellow-700/30 rounded-2xl p-6 relative overflow-hidden group hover:border-yellow-600/50 transition-all">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Trophy className="w-32 h-32 text-yellow-500" />
      </div>

      <div className="relative">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          MVPs Última Jornada
        </h2>

        <div className="space-y-2">
          {mvps && mvps.length > 0 ? (
            mvps.map((player, index) => (
              <div 
                key={player.player_id} 
                className={`p-3 rounded-lg border transition-all ${
                  index === 0 
                    ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50' 
                    : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 
                      ? 'bg-yellow-500 text-slate-900' 
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {index === 0 ? <Award className="w-5 h-5" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/player/${player.player_id}`} className="font-medium text-white text-sm hover:text-yellow-400 transition-colors block">
                      {player.name}
                    </Link>
                    <div className="text-xs text-slate-400">{player.team} · {player.position}</div>
                    {player.owner_name && (
                      <div className="text-xs text-blue-400">👤 {player.owner_name}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${index === 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {player.points} pts
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">No hay datos de la última jornada</div>
          )}
        </div>
      </div>
    </div>
  );
}
