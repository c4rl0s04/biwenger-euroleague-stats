'use client';

import { Trophy } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';

import { getColorForUser } from '@/lib/constants/colors';

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
              const colors = getColorForUser(winner.user_id, winner.name);
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
