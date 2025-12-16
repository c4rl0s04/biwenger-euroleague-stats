'use client';

import { TrendingUp, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';

export default function PointsProgressionCard() {
  const [progression, setProgression] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clasificacion/progression')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setProgression(result.data.progression || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching progression:', err);
        setLoading(false);
      });
  }, []);

  // Group by round for display
  const rounds = [...new Set(progression.map(p => p.round_name))].slice(-5);
  const users = [...new Set(progression.map(p => p.name))];
  
  // Get cumulative points per user for the last round
  const lastRound = rounds[rounds.length - 1];
  const userTotals = users.map(name => {
    const lastEntry = progression.find(p => p.name === name && p.round_name === lastRound);
    return { name, cumulative: lastEntry?.cumulative_points || 0 };
  }).sort((a, b) => b.cumulative - a.cumulative);

  // Calculate max for bar width
  const maxPoints = Math.max(...userTotals.map(u => u.cumulative), 1);

  return (
    <PremiumCard
      title="Evolución de Puntos"
      icon={Activity}
      color="purple"
      loading={loading}
    >
      {!loading && (
        <div className="space-y-3">
          {userTotals.slice(0, 6).map((user, index) => {
            const percentage = (user.cumulative / maxPoints) * 100;
            const isTop3 = index < 3;
            
            return (
              <div key={user.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isTop3 ? 'text-white' : 'text-slate-400'}`}>
                    {user.name}
                  </span>
                  <span className={`text-xs font-bold ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-slate-300' :
                    index === 2 ? 'text-orange-400' :
                    'text-slate-500'
                  }`}>
                    {user.cumulative}
                  </span>
                </div>
                <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                      index === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-300' :
                      index === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-400' :
                      'bg-gradient-to-r from-purple-600 to-purple-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          
          {rounds.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/50">
              <div className="text-xs text-slate-500 text-center">
                Basado en las últimas {rounds.length} jornadas
              </div>
            </div>
          )}
        </div>
      )}
    </PremiumCard>
  );
}
