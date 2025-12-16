'use client';

import { Trophy } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';

// Color palette for different users
const USER_COLORS = [
  { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  { bg: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-500/30', text: 'text-pink-400' },
  { bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  { bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', text: 'text-red-400' },
];

// Special colors for specific users
const SPECIAL_USER_COLORS = {
  'All Stars': { bg: 'from-amber-700/30 to-amber-900/20', border: 'border-amber-600/40', text: 'text-amber-500' },
};

export default function RoundWinnersCard() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clasificacion/round-winners')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setWinners(result.data.winners || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching round winners:', err);
        setLoading(false);
      });
  }, []);

  // Create a stable color mapping for each unique user
  const userColorMap = useMemo(() => {
    const uniqueUsers = [...new Set(winners.map(w => w.user_id))];
    const map = {};
    let colorIndex = 0;
    uniqueUsers.forEach((userId) => {
      const userName = winners.find(w => w.user_id === userId)?.name;
      if (SPECIAL_USER_COLORS[userName]) {
        map[userId] = SPECIAL_USER_COLORS[userName];
      } else {
        map[userId] = USER_COLORS[colorIndex % USER_COLORS.length];
        colorIndex++;
      }
    });
    return map;
  }, [winners]);

  return (
    <PremiumCard
      title="Ganadores de Jornada"
      icon={Trophy}
      color="yellow"
      loading={loading}
    >
      {!loading && (
        <div className="flex flex-wrap justify-center gap-3">
          {winners.length > 0 ? (
            winners.map((winner) => {
              const colors = userColorMap[winner.user_id];
              return (
                <div 
                  key={winner.round_id}
                  className={`flex-shrink-0 w-28 p-3 rounded-xl text-center transition-all bg-gradient-to-b ${colors.bg} border ${colors.border} hover:scale-105`}
                >
                  <div className="text-slate-400 text-[10px] font-medium mb-2">{winner.round_name}</div>
                  <div className="flex justify-center mb-2">
                    {winner.icon ? (
                      <img src={winner.icon} alt={winner.name} className="w-10 h-10 rounded-full ring-2 ring-white/20" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">{winner.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="text-xs font-medium text-white truncate mb-1">{winner.name}</div>
                  <div className={`text-sm font-bold ${colors.text}`}>
                    {winner.points} pts
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-slate-500 py-4 w-full">No hay datos de ganadores</div>
          )}
        </div>
      )}
    </PremiumCard>
  );
}
