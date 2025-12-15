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
      // Aggressively normalize: remove all non-alphanumeric chars and lowercase
      const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      const homeNorm = normalize(m.home_team);
      const playerNorm = normalize(playerTeam);
      
      // Check exact match OR inclusion (e.g. "Bayern" in "FC Bayern Munich")
      const isHome = homeNorm && playerNorm && (homeNorm === playerNorm || homeNorm.includes(playerNorm) || playerNorm.includes(homeNorm));
      
      // SKIP DNP (Did Not Play) - Don't count toward stats
      if (m.fantasy_points === null) return;

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
      <div className="space-y-6 pt-2">
        {/* Home vs Away */}
        <div className="space-y-3">
             <div className="flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-slate-400">
                <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-blue-400" /> Contexto
                </div>
                <span>Promedio Puntos</span>
             </div>
             
             {/* Visual Bar */}
             <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                    className="bg-blue-500 h-full transition-all duration-500" 
                    style={{ width: `${(parseFloat(splits.home) / (parseFloat(splits.home) + parseFloat(splits.away)) * 100) || 50}%` }} 
                />
                <div 
                    className="bg-purple-500 h-full transition-all duration-500 flex-1" 
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/30 rounded-lg p-2 border border-slate-700/30">
                    <div className="text-[10px] text-slate-500 uppercase mb-0.5">Casa (Local)</div>
                    <div className="text-xl font-bold text-white">{splits.home}</div>
                </div>
                <div className="text-right bg-slate-800/30 rounded-lg p-2 border border-slate-700/30">
                    <div className="text-[10px] text-slate-500 uppercase mb-0.5">Fuera (Visitante)</div>
                    <div className="text-xl font-bold text-white">{splits.away}</div>
                </div>
             </div>
        </div>

        {/* Win vs Loss */}
        <div className="space-y-3 pt-4 border-t border-slate-700/30">
             <div className="flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-slate-400">
                <div className="flex items-center gap-2">
                    <Trophy className="w-3 h-3 text-amber-400" /> Resultado
                </div>
                <span>Promedio Puntos</span>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-emerald-900/10 rounded-lg p-2 border border-emerald-500/10">
                    <div className="text-[10px] text-emerald-400 uppercase mb-0.5">En Victoria</div>
                    <div className="text-xl font-bold text-emerald-100">{splits.win}</div>
                </div>
                <div className="text-right bg-rose-900/10 rounded-lg p-2 border border-rose-500/10">
                    <div className="text-[10px] text-rose-400 uppercase mb-0.5">En Derrota</div>
                    <div className="text-xl font-bold text-rose-100">{splits.loss}</div>
                </div>
             </div>
        </div>
      </div>
    </PremiumCard>
  );
}
