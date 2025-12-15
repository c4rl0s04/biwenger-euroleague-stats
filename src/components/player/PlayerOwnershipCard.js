'use client';

import { History, ArrowRight, ShoppingCart } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';

export default function PlayerOwnershipCard({ transfers, className = '' }) {
  if (!transfers || transfers.length === 0) {
      return null; // Don't show if no history
  }

  return (
    <PremiumCard title="Historial de Traspasos" icon={History} color="indigo" className={className}>
        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {transfers.map((t, idx) => {
                const isMarket = t.from_name === 'Mercado' || t.to_name === 'Mercado';
                return (
                    <div key={idx} className="relative pl-4 border-l-2 border-slate-700/50 pb-4 last:border-l-0 last:pb-0">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-slate-900 mt-1.5 ring-4 ring-slate-900"></div>
                        
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-xs text-slate-500 mb-1">{new Date(t.date).toLocaleDateString()}</div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <span className="font-medium text-white">{t.from_name}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-500" />
                                    <span className="font-medium text-white">{t.to_name}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-emerald-400">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(t.amount)}
                                </div>
                                {isMarket && (
                                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 mt-0.5">
                                        <ShoppingCart className="w-3 h-3" /> Mercado
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </PremiumCard>
  );
}
