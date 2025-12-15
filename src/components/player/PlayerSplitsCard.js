'use client';

import { useMemo } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import { Split, MapPin, Trophy, XCircle } from 'lucide-react';

export default function PlayerSplitsCard({ matches, playerTeam }) {
  const splits = useMemo(() => {
    if (!matches || matches.length === 0 || !playerTeam) return null;

    const stats = {
      home: { points: 0, games: 0 },
      away: { points: 0, games: 0 },
      win: { points: 0, games: 0 },
      loss: { points: 0, games: 0 }
    };

    matches.forEach(m => {
      const isHome = m.home_team === playerTeam;
      const points = m.fantasy_points || 0;
      
      // Home/Away
      if (isHome) {
        stats.home.points += points;
        stats.home.games++;
      } else {
        stats.away.points += points;
        stats.away.games++;
      }

      // Win/Loss
      // Ensure scores exist before calculating
      if (m.home_score !== undefined && m.away_score !== undefined) {
        const homeScore = parseInt(m.home_score);
        const awayScore = parseInt(m.away_score);
        
        let won = false;
        if (isHome && homeScore > awayScore) won = true;
        if (!isHome && awayScore > homeScore) won = true;

        if (won) {
          stats.win.points += points;
          stats.win.games++;
        } else {
          stats.loss.points += points;
          stats.loss.games++;
        }
      }
    });

    const calcAvg = (set) => set.games > 0 ? (set.points / set.games).toFixed(1) : '-';

    return {
      home: calcAvg(stats.home),
      away: calcAvg(stats.away),
      win: calcAvg(stats.win),
      loss: calcAvg(stats.loss),
      games: stats
    };
  }, [matches, playerTeam]);

  if (!splits) return null;

  const StatRow = ({ label, val1, val2, label1, label2, icon: Icon, color }) => (
     <div className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0">
        <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-${color}-500/10`}>
                <Icon className={`w-4 h-4 text-${color}-400`} />
            </div>
            <span className="text-sm text-slate-300 font-medium">{label}</span>
        </div>
        <div className="flex gap-6 text-sm">
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase tracking-wide">{label1}</div>
                <div className="font-bold text-white">{val1} <span className="text-[10px] text-slate-500 font-normal">pts</span></div>
            </div>
             <div className="text-right min-w-[3rem]">
                <div className="text-xs text-slate-500 uppercase tracking-wide">{label2}</div>
                <div className="font-bold text-white">{val2} <span className="text-[10px] text-slate-500 font-normal">pts</span></div>
            </div>
        </div>
     </div>
  );

  return (
    <PremiumCard
      title="Rendimiento por Contexto"
      icon={Split}
      color="yellow"
      className="h-full"
    >
      <div className="space-y-1">
        <StatRow 
            label="Local vs Visitante" 
            val1={splits.home} label1="Casa"
            val2={splits.away} label2="Fuera"
            icon={MapPin}
            color="blue"
        />
        <StatRow 
            label="Victoria vs Derrota" 
            val1={splits.win} label1="Ganados"
            val2={splits.loss} label2="Perdidos"
            icon={Trophy}
            color="amber"
        />
      </div>
      <div className="mt-4 text-[10px] text-slate-500 text-center italic">
          Promedio de puntos fantasy según el resultado del partido real
      </div>
    </PremiumCard>
  );
}
