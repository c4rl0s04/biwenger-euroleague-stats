import Link from 'next/link';
import { Users, Trophy } from 'lucide-react';
import StandingsTable from '@/components/StandingsTable';
import { getLastRoundWinner } from '@/lib/database';

export default function StandingsCard({ standings }) {
  const lastWinner = getLastRoundWinner();

  return (
    <div className="lg:col-span-1 bg-gradient-to-br from-blue-900/20 to-slate-900 backdrop-blur-md border border-blue-700/30 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-600/50 transition-all">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Users className="w-32 h-32 text-blue-500" />
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" /> Clasificación
        </h2>
        <Link href="/standings" className="text-sm text-blue-400 hover:text-blue-300">Ver todo</Link>
      </div>
      <StandingsTable standings={standings} />
      
      {/* League Insights Footer */}
      <div className="mt-6 pt-5 border-t border-slate-800/50">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-800/30 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Media Puntos</div>
            <div className="text-lg font-bold text-slate-300">
              {standings.length > 0 ? Math.round(standings.reduce((acc, u) => acc + u.total_points, 0) / standings.length) : 0}
            </div>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Valor Liga</div>
            <div className="text-lg font-bold text-blue-400">
              {new Intl.NumberFormat('es-ES').format(standings.reduce((acc, u) => acc + u.team_value, 0))}€
            </div>
          </div>
        </div>
        
        {lastWinner ? (
            <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl p-3 border border-yellow-500/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Ganador {lastWinner.round_name}</span>
                <Trophy className="w-3 h-3 text-yellow-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {lastWinner.icon ? (
                    <img src={lastWinner.icon} alt={lastWinner.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">{lastWinner.name.charAt(0)}</div>
                  )}
                  <span className="text-sm font-medium text-white">{lastWinner.name}</span>
                </div>
                <div className="text-sm font-bold text-yellow-500">
                  {lastWinner.points} pts
                </div>
              </div>
            </div>
        ) : null}
      </div>
    </div>
  );
}
