'use client';

import { History, ArrowRight, ShoppingCart, User, Wallet, Sparkles } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';

export default function PlayerOwnershipCard({ transfers, className = '' }) {
  if (!transfers || transfers.length === 0) {
      return null;
  }

  return (
    <PremiumCard title="Historial de Traspasos" icon={History} color="cyan" className={className}>
        <div className="relative pl-2 pr-2 py-2">
            {/* Vertical Line */}
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-700/50"></div>

            <div className="space-y-6 relative">
                {transfers.map((t, idx) => {
                    const fromMarket = t.from_name === 'Mercado';
                    const toMarket = t.to_name === 'Mercado';
                    const fromSystem = t.from_name === 'Biwenger';
                    const toSystem = t.to_name === 'Biwenger';

                    // Determine Type
                    let type = 'trade'; // Default: User to User
                    let theme = 'blue';
                    let label = 'Intercambio';
                    let Icon = ArrowRight;

                    // Detect Initial Assignment / System (Price 0)
                    if (t.amount === 0) {
                         type = 'system';
                         theme = 'amber';
                         label = 'Asignación Inicial';
                         Icon = User;
                    } else if (fromMarket) {
                        type = 'purchase';
                        theme = 'emerald';
                        label = 'Fichado (del Mercado)';
                        Icon = ShoppingCart;
                    } else if (toMarket) {
                        type = 'sale';
                        theme = 'rose';
                        label = 'Vendido (al Mercado)';
                        Icon = Wallet;
                    } else if (fromSystem || toSystem) {
                         type = 'system';
                         theme = 'slate';
                         label = 'Asignación Inicial';
                         Icon = User;
                    }

                    return (
                        <div key={idx} className="relative flex gap-4 group">
                            {/* Dot / Icon */}
                            <div className={`
                                relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-slate-900 shadow-lg
                                bg-${theme}-500/20 text-${theme}-400
                            `}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>

                            {/* Content Bubble */}
                            <div className={`
                                flex-1 bg-slate-800/40 border-l-4 rounded-r-xl rounded-l-md p-3 transition-colors
                                border-l-${theme}-500 border-y border-r border-slate-700/50 hover:border-slate-600
                            `}>
                                {/* Header: Label & Price */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className={`text-xs font-bold uppercase tracking-wider text-${theme}-400 mb-0.5`}>
                                            {label}
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-500">
                                            {new Date(t.date).toLocaleDateString('es-ES', { 
                                                day: 'numeric', 
                                                month: 'long', 
                                                year: 'numeric' 
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-lg font-black text-${theme}-400`}>
                                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(t.amount)}
                                        </div>
                                    </div>
                                </div>

                                {/* Flow Visualization */}
                                <div className="flex items-center justify-between bg-slate-900/30 rounded-lg p-2 border border-slate-800/50">
                                    {/* FROM */}
                                    <div className="flex items-center gap-2 max-w-[40%]">
                                        {t.from_img ? (
                                            <img src={t.from_img} alt={t.from_name} className="w-6 h-6 rounded-full border border-slate-700 object-cover" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-400 border border-slate-600">
                                                {t.from_name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="text-xs text-slate-300 truncate font-medium">{t.from_name}</div>
                                    </div>

                                    <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />

                                    {/* TO */}
                                    <div className="flex items-center gap-2 max-w-[40%] justify-end">
                                        <div className="text-xs text-slate-300 truncate font-medium">{t.to_name}</div>
                                        {t.to_img ? (
                                            <img src={t.to_img} alt={t.to_name} className="w-6 h-6 rounded-full border border-slate-700 object-cover" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-400 border border-slate-600">
                                                {t.to_name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </PremiumCard>
  );
}
