'use client';

import { BarChart2, Shield, Target, AlertCircle } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';

export default function PlayerAdvancedStatsCard({ advancedStats, className = '' }) {
  if (!advancedStats) return null;
  const s = advancedStats;

  // Calculate percentages safely
  const calcPct = (made, att) => att > 0 ? Math.round((made / att) * 100) : 0;
  
  const pct2 = calcPct(s.two_points_made, s.two_points_attempted);
  const pct3 = calcPct(s.three_points_made, s.three_points_attempted);
  const pctFT = calcPct(s.free_throws_made, s.free_throws_attempted);

  // Helper for progress bar
  const StatBar = ({ label, value, max, color }) => (
      <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 uppercase tracking-wider">{label}</span>
              <span className="text-slate-200 font-mono">{value}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${color}`} 
                style={{ width: `${Math.min((value/max)*100, 100)}%` }}
              ></div>
          </div>
      </div>
  );

  return (
    <PremiumCard title="Estadísticas Avanzadas" icon={BarChart2} color="pink" className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Shooting Splits */}
            <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-white mb-4">
                    <Target className="w-4 h-4 text-indigo-400" /> Tiros (Temp.)
                </h4>
                
                <div className="space-y-4">
                    {/* 2 Pointers */}
                    <div className="bg-slate-800/20 p-3 rounded-lg border border-slate-700/30">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs text-slate-400">Tiros de 2</span>
                            <span className="text-lg font-bold text-white">{pct2}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full">
                            <div className="h-full bg-indigo-500 rounded-full" style={{width: `${pct2}%`}}></div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 text-right">
                            {s.two_points_made}/{s.two_points_attempted} anotados
                        </div>
                    </div>

                    {/* 3 Pointers */}
                    <div className="bg-slate-800/20 p-3 rounded-lg border border-slate-700/30">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs text-slate-400">Triples</span>
                            <span className="text-lg font-bold text-white">{pct3}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full">
                            <div className="h-full bg-cyan-500 rounded-full" style={{width: `${pct3}%`}}></div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 text-right">
                            {s.three_points_made}/{s.three_points_attempted} anotados
                        </div>
                    </div>

                     {/* Free Throws */}
                     <div className="bg-slate-800/20 p-3 rounded-lg border border-slate-700/30">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs text-slate-400">Tiros Libres</span>
                            <span className="text-lg font-bold text-white">{pctFT}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full">
                            <div className="h-full bg-emerald-500 rounded-full" style={{width: `${pctFT}%`}}></div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 text-right">
                            {s.free_throws_made}/{s.free_throws_attempted} anotados
                        </div>
                    </div>
                </div>
            </div>

            {/* Defense & Hustle */}
            <div>
                 <h4 className="flex items-center gap-2 text-sm font-bold text-white mb-4">
                    <Shield className="w-4 h-4 text-emerald-400" /> Defensa y Otros
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/20 p-3 rounded px-4 text-center border border-slate-700/30">
                        <div className="text-2xl font-bold text-white">{s.blocks}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Tapones</div>
                    </div>
                     <div className="bg-slate-800/20 p-3 rounded px-4 text-center border border-slate-700/30">
                        <div className="text-2xl font-bold text-white">{s.turnovers}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Pérdidas</div>
                    </div>
                     <div className="bg-slate-800/20 p-3 rounded px-4 text-center border border-slate-700/30">
                        <div className="text-2xl font-bold text-white">{s.fouls}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Faltas</div>
                    </div>
                     <div className="bg-slate-800/20 p-3 rounded px-4 text-center border border-slate-700/30">
                        <div className="text-2xl font-bold text-white">{s.free_throws_attempted}</div>
                        <div className="text-[10px] text-slate-500 uppercase">TL Intent.</div>
                    </div>
                </div>

                <div className="mt-6 flex items-start gap-2 bg-slate-900/50 p-3 rounded text-xs text-slate-400 border border-slate-800">
                    <AlertCircle className="w-4 h-4 shrink-0 text-slate-500" />
                    <span>Los porcentajes de tiro se calculan sobre el total de la temporada y pueden variar según la jornada.</span>
                </div>
            </div>
        </div>
    </PremiumCard>
  );
}
