'use client';

import { Activity, HeartPulse } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';

export default function PlayerStatsCard({ player, className = '' }) {
  return (
    <PremiumCard title="Rendimiento" icon={Activity} color="emerald" className={`h-full ${className}`}>
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Media</div>
                    <div className="text-2xl font-bold text-white">{player.season_avg}</div>
                </div>
                <div>
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total</div>
                    <div className="text-2xl font-bold text-white">{player.total_points}</div>
                </div>
            </div>

            <div className="pt-2 border-t border-slate-700/30">
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                    <HeartPulse className="w-3 h-3" /> Estado
                 </div>
                 <div className={`mt-1 inline-flex items-center px-2 py-1 rounded text-sm font-medium ${player.status === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                     {player.status === 'ok' ? 'Disponible' : 'No Disponible'}
                 </div>
            </div>
        </div>
    </PremiumCard>
  );
}
