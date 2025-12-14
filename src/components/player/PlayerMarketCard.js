'use client';

import { DollarSign, TrendingUp } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';

export default function PlayerMarketCard({ player, className = '' }) {
  return (
    <PremiumCard title="Mercado" icon={DollarSign} color="cyan" className={`h-full ${className}`}>
        <div className="space-y-5">
            <div className="flex justify-between items-start">
                <div>
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Valor Actual</div>
                    <div className="text-2xl font-bold text-white">{(player.price / 1000000).toFixed(2)}M€</div>
                </div>
                <div className={`text-right ${player.price_increment >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Cambio</div>
                    <div className="text-lg font-medium flex items-center justify-end gap-1">
                        {player.price_increment >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                        {Math.abs(player.price_increment / 1000).toFixed(0)}k
                    </div>
                </div>
            </div>

             <div className="pt-2 border-t border-slate-700/30">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Propietario</div>
                <div className="text-white font-medium truncate" title={player.owner_name}>
                    {player.owner_name || 'Agente Libre'}
                </div>
            </div>
        </div>
    </PremiumCard>
  );
}
