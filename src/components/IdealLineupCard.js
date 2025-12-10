'use client';

import { Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getScoreColor, getShortTeamName } from '@/lib/utils';

export default function IdealLineupCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ideal-lineup')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching ideal lineup:', err);
        setLoading(false);
      });
  }, []);

  // Helper for styles based on position
  const getPositionStyles = (position) => {
    const pos = position?.toLowerCase() || '';
    if (pos.includes('base')) return { label: 'B', bg: 'bg-blue-600', border: 'border-blue-500', text: 'text-white', ring: 'ring-blue-500/30' };
    if (pos.includes('alero')) return { label: 'A', bg: 'bg-green-600', border: 'border-green-500', text: 'text-white', ring: 'ring-green-500/30' };
    if (pos.includes('pivot') || pos.includes('pívot')) return { label: 'P', bg: 'bg-red-600', border: 'border-red-500', text: 'text-white', ring: 'ring-red-500/30' };
    
    // Fallback
    return { label: pos.charAt(0).toUpperCase(), bg: 'bg-slate-700', border: 'border-slate-600', text: 'text-slate-300', ring: 'ring-slate-500/30' };
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5 h-full animate-pulse flex flex-col">
        <div className="h-6 bg-slate-700/50 rounded w-1/2 mb-6 shrink-0"></div>
        <div className="flex-1 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-700/50 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const { lineup, total_points, round_name } = data || { lineup: [], total_points: 0 };

  if (!lineup || lineup.length === 0) {
      return (
        <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900 backdrop-blur-md border border-indigo-700/30 rounded-2xl p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-indigo-500" />
              Quinteto Ideal
            </h2>
            <div className="flex-1 flex items-center justify-center text-slate-500">No hay datos disponibles</div>
        </div>
      );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900 backdrop-blur-md border border-indigo-700/30 rounded-2xl p-5 h-full flex flex-col relative overflow-hidden group hover:border-indigo-600/50 transition-all">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <Crown className="w-32 h-32 text-indigo-500" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0 relative z-10">
        <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-indigo-500" />
            Quinteto Ideal
            </h2>
            <div className="text-xs text-indigo-300 font-mono mt-1">{round_name}</div>
        </div>
        <div className="text-right">
            <div className="text-2xl font-bold text-white">{total_points}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Puntos Totales</div>
        </div>
      </div>

      {/* List Container - flex-1 to fill space, justify-between to distribute items */}
      <div className="flex-1 flex flex-col justify-between gap-2 relative z-10">
        {lineup.map((player) => {
          const style = getPositionStyles(player.position);
          
          return (
            <div key={player.player_id} className="p-2 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:bg-slate-800/60 transition-all flex items-center gap-3">
               <div className="relative shrink-0">
                  {/* Large Circle with Position Style */}
                  <div className={`w-11 h-11 rounded-full overflow-hidden border-2 ${style.border} bg-slate-800 flex items-center justify-center shadow-sm ${style.ring}`}>
                    <img 
                        src={player.img} 
                        alt={player.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentNode;
                            parent.classList.remove('bg-slate-800');
                            parent.classList.add(...style.bg.split(' '));
                            
                            // Insert text manually if needed or rely on parent content logic
                            // But since we can't re-render easily inside onError without state, we manipulate DOM
                            parent.innerHTML = `<span class="font-bold text-lg ${style.text}">${style.label}</span>`;
                        }}
                    />
                  </div>
               </div>
               
               <div className="flex-1 min-w-0">
                  <Link href={`/player/${player.player_id}`} className="font-medium text-white text-sm hover:text-indigo-400 transition-colors truncate block">
                    {player.name}
                  </Link>
                  <div className="flex flex-col gap-0.5 text-xs text-slate-400 mt-0.5">
                    <span>{getShortTeamName(player.team)}</span>
                    {player.owner_name && (
                        <span className="text-indigo-300 truncate text-[11px]">
                            👤 {player.owner_name}
                        </span>
                    )}
                  </div>
               </div>

               <div className="text-right shrink-0">
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-md ${getScoreColor(player.points)}`}>
                    {player.points}
                  </span>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}