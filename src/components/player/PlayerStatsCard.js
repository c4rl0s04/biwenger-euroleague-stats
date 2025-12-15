'use client';

import { Activity, HeartPulse } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';

export default function PlayerStatsCard({ player, className = '' }) {
  return (
    <PremiumCard title="Rendimiento" icon={Activity} color="amber" className={`h-full ${className}`}>
        <div className="flex flex-col h-full justify-between space-y-4">
            <div className="grid grid-cols-2 gap-6">
                {/* Media Season */}
                <div>
                    <div className="text-amber-400 text-xs uppercase tracking-wider mb-2 font-bold">Media</div>
                    <div className="text-5xl font-black text-white tracking-tighter">{player.season_avg}</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-1">Puntos por partido</div>
                </div>
                {/* Total Points */}
                <div className="flex flex-col justify-center border-l border-slate-700/50 pl-6">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">Total</div>
                    <div className="text-3xl font-bold text-white">{player.total_points}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Puntos totales</div>
                </div>
                
                {/* Row 2: Games & Form */}
                <div className="pt-4 border-t border-slate-700/30">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">Partidos</div>
                    <div className="text-2xl font-bold text-white">{player.games_played}</div>
                     <div className="text-[10px] text-slate-500 mt-0.5">Jugados</div>
                </div>
                <div className="pt-4 border-t border-slate-700/30 border-l border-slate-700/50 pl-6">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">Forma (Ult 3)</div>
                    <div className="text-2xl font-bold text-emerald-400">
                        {(() => {
                            if (!player.recentMatches || player.recentMatches.length === 0) return '-';
                            const last3 = player.recentMatches.slice(0, 3);
                            const avg = last3.reduce((sum, m) => sum + (m.fantasy_points || 0), 0) / last3.length;
                            return avg.toFixed(1);
                        })()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Media ult. 3</div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-700/30 flex items-center justify-between">
                 <div className="text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2 font-semibold">
                    <HeartPulse className="w-4 h-4 text-slate-500" /> Disponibilidad
                 </div>
                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border ${player.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                     <span className={`w-2 h-2 rounded-full ${player.status === 'ok' ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                     {player.status === 'ok' ? 'Disponible' : 'No Disponible'}
                 </div>
            </div>
        </div>
    </PremiumCard>
  );
}
