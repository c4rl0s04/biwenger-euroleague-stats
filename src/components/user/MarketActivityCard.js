'use client';

import {
  ArrowRightLeft,
  ShoppingCart,
  Tag,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { ElegantCard, AnimatedNumber } from '@/components/ui';
import Link from 'next/link';

export default function MarketActivityCard({ stats }) {
  if (!stats) return null;

  const { purchases, sales, total_spent, total_received, last_transfers = [] } = stats;

  const formatPrice = (price) => {
    if (Math.abs(price) >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M€';
    }
    return new Intl.NumberFormat('es-ES').format(price) + '€';
  };

  const netBalance = total_received - total_spent;

  return (
    <ElegantCard title="Mercado" icon={ArrowRightLeft} color="indigo">
      <div className="flex flex-col h-full justify-between gap-4">
        {/* --- ZONE 1: TOTAL VOLUME --- */}
        <div className="grid grid-cols-2 gap-4 relative group/volume">
          <div className="absolute -inset-4 bg-indigo-500/5 blur-3xl rounded-full opacity-0 group-hover/volume:opacity-100 transition-opacity duration-700 -z-10" />
          <div className="hover:scale-105 transition-transform duration-300 origin-left">
            <div className="text-indigo-400/80 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Inversión
            </div>
            <div className="text-3xl font-display font-black text-indigo-400 leading-none mb-1 drop-shadow-[0_0_10px_rgba(99,102,241,0.4)]">
              {formatPrice(total_spent)}
            </div>
            <div className="text-xs font-black text-white/50 uppercase tracking-tighter mt-1">
              <span className="text-white/90 text-sm">{purchases}</span> Compras
            </div>
          </div>
          <div className="text-right hover:scale-105 transition-transform duration-300 origin-right">
            <div className="text-pink-400/80 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-end">
              Retorno
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            </div>
            <div className="text-3xl font-display font-black text-pink-400 leading-none mb-1 drop-shadow-[0_0_10px_rgba(236,72,153,0.4)]">
              {formatPrice(total_received)}
            </div>
            <div className="text-xs font-black text-white/50 uppercase tracking-tighter mt-1">
              <span className="text-white/90 text-sm">{sales}</span> Ventas
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-white/10" />

        {/* --- ZONE 2: BALANCE --- */}
        <div className="group/balance relative">
          <div className="flex justify-between items-center mb-2">
            <div className="text-white/70 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              Balance Neto
              {netBalance > 0 && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black animate-bounce">
                  Profit
                </span>
              )}
            </div>
            <div
              className={`text-xl font-display font-black ${netBalance >= 0 ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-destructive drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}
            >
              {netBalance >= 0 ? '+' : ''}
              {formatPrice(netBalance)}
            </div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden flex relative">
            <div className="absolute inset-0 bg-white/5 blur-[2px]" />
            {total_spent + total_received > 0 ? (
              <>
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)] relative z-10"
                  style={{ width: `${(total_spent / (total_spent + total_received)) * 100}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-pink-600 to-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.6)] relative z-10"
                  style={{ width: `${(total_received / (total_spent + total_received)) * 100}%` }}
                />
              </>
            ) : (
              <div className="w-full h-full bg-white/5" />
            )}
          </div>
        </div>

        {/* --- ZONE 3: LAST MOVEMENTS --- */}
        <div className="space-y-3 flex flex-col justify-end">
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">
            Últimos Movimientos
          </h4>
          {last_transfers.length > 0 ? (
            last_transfers.map((tr, idx) => {
              const isPurchase = tr.type === 'purchase';
              const counterparty = isPurchase ? tr.vendedor : tr.comprador;
              const counterpartyName = counterparty
                ? counterparty.length > 12
                  ? counterparty.substring(0, 10) + '...'
                  : counterparty
                : 'Mercado';

              // Format date carefully if exists
              let dateStr = '';
              if (tr.fecha) {
                try {
                  const d = new Date(tr.fecha);
                  dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                } catch (e) {}
              }

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${isPurchase ? 'bg-indigo-500/10 text-indigo-400' : 'bg-pink-500/10 text-pink-400'} group-hover:scale-110 transition-transform`}
                    >
                      {isPurchase ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      {tr.player_id ? (
                        <Link
                          href={`/player/${tr.player_id}`}
                          className="text-sm font-black text-white/90 hover:text-blue-400 transition-colors truncate tracking-tight"
                        >
                          {tr.player_name || 'Desconocido'}
                        </Link>
                      ) : (
                        <span className="text-sm font-black text-white/90 truncate tracking-tight">
                          {tr.player_name || 'Desconocido'}
                        </span>
                      )}
                      <span className="text-[10px] sm:text-xs font-bold text-white/40 truncate mt-0.5">
                        {isPurchase ? 'De' : 'A'}:{' '}
                        <span className="text-white/70">{counterpartyName}</span>{' '}
                        {dateStr && `• ${dateStr}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span
                      className={`text-base sm:text-lg font-black font-display ${isPurchase ? 'text-indigo-400' : 'text-pink-400'}`}
                    >
                      {isPurchase ? '-' : '+'}
                      {formatPrice(tr.price)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-[10px] text-white/20 italic">
              Sin movimientos recientes
            </div>
          )}
        </div>
      </div>
    </ElegantCard>
  );
}
