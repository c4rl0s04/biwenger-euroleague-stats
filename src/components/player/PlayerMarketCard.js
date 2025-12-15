'use client';

import { DollarSign, TrendingUp } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';

export default function PlayerMarketCard({ player, className = '' }) {
  return (
    <PremiumCard title="Mercado" icon={DollarSign} color="emerald" className={`h-full ${className}`}>
        <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">Valor Actual</div>
                    <div className="text-4xl font-black text-white tracking-tight">{(player.price / 1000000).toFixed(2)}M€</div>
                </div>
                <div className={`text-right ${player.price_increment >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'} px-3 py-2 rounded-lg border ${player.price_increment >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
                    <div className="text-[10px] uppercase tracking-wider opacity-80 mb-0.5 font-bold">Cambio</div>
                    <div className="text-lg font-bold flex items-center justify-end gap-1">
                        {player.price_increment >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                        {Math.abs(player.price_increment / 1000).toFixed(0)}k
                    </div>
                </div>
            </div>

             <div className="mt-6 pt-4 border-t border-slate-700/30">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">Propietario</div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 ring-2 ring-slate-600">
                        {player.owner_name ? player.owner_name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="text-white font-medium truncate text-lg" title={player.owner_name}>
                        {player.owner_name || 'Agente Libre'}
                    </div>
                </div>
            </div>
        </div>
    </PremiumCard>
  );
}
