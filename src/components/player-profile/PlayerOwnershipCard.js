'use client';

import { History, ArrowRight, ShoppingCart, User, Wallet } from 'lucide-react';
import { ElegantCard } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import Image from 'next/image';
import Link from 'next/link';

const TYPE_CONFIG = {
  purchase: {
    label: 'Fichado (del Mercado)',
    icon: ShoppingCart,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  sale: {
    label: 'Vendido (al Mercado)',
    icon: Wallet,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  trade: {
    label: 'Intercambio',
    icon: ArrowRight,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  system: {
    label: 'Asignación Inicial',
    icon: User,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
};

const MarketLogo = ({ size = 'w-8 h-8', className = '' }) => (
  <div
    className={`${size} rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center border border-white/20 shadow-lg ${className}`}
  >
    <span className="text-xs font-black text-white">M</span>
  </div>
);

const BiwengerLogo = ({ size = 'w-8 h-8', className = '' }) => (
  <div
    className={`${size} rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border border-white/20 shadow-lg ${className}`}
  >
    <span className="text-[10px] font-black text-white tracking-tighter">BW</span>
  </div>
);

export default function PlayerOwnershipCard({ transfers, className = '' }) {
  if (!transfers || transfers.length === 0) return null;

  const sortedTransfers = [...transfers].reverse();

  return (
    <ElegantCard title="Historial de Traspasos" icon={History} color="cyan" className={className}>
      <div className="relative pl-1 pr-1 py-4 mt-2">
        {/* Vertical Timeline Track */}
        <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>

        <div className="space-y-8 relative">
          {sortedTransfers.map((t, idx) => {
            const fromMarket = t.from_name === 'Mercado';
            const toMarket = t.to_name === 'Mercado';
            const fromSystem = t.from_name === 'Biwenger';
            const toSystem = t.to_name === 'Biwenger';

            let typeKey = 'trade';
            if (t.amount === 0 || fromSystem || toSystem) typeKey = 'system';
            else if (fromMarket) typeKey = 'purchase';
            else if (toMarket) typeKey = 'sale';

            const config = TYPE_CONFIG[typeKey];
            const Icon = config.icon;

            // Determine Manager Color for this transfer
            const managerColorIndex = toMarket || toSystem ? t.from_color : t.to_color;
            const mColors = getColorForUser(null, null, managerColorIndex);

            return (
              <div key={idx} className="relative grid grid-cols-[auto_1fr_auto] gap-6 group">
                {/* Left: Timeline Node */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br ${config.bg} ${config.border}`}
                  >
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                </div>

                {/* Center: Content Card */}
                <div
                  className={`flex-1 bg-gradient-to-br ${mColors.bg} border border-white/5 rounded-2xl p-4 transition-all duration-300 group-hover:bg-white/[0.1] group-hover:border-${mColors.name}-500/30`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span
                        className={`text-2xl font-display font-black uppercase tracking-wider ${config.color} leading-none mb-1 block`}
                      >
                        {config.label}
                      </span>
                      <span className="text-[11px] font-bold text-white/60 uppercase">
                        {new Date(t.date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xl font-black tracking-tighter ${config.color} tabular-nums`}
                      >
                        {t.amount > 0 ? (
                          <>
                            {new Intl.NumberFormat('es-ES', {
                              maximumFractionDigits: 0,
                            }).format(t.amount)}
                            <span className="text-sm ml-0.5 opacity-70">€</span>
                          </>
                        ) : (
                          'GRATIS'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Flow Visualization */}
                  <div
                    className={`grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-black/20 rounded-xl p-3 border border-white/5 group-hover:border-${mColors.name}-500/20 transition-colors`}
                  >
                    {/* FROM */}
                    <div className="flex items-center gap-3 overflow-hidden">
                      {t.from_id ? (
                        <Link
                          href={`/user/${t.from_id}`}
                          className="flex items-center gap-3 hover:opacity-70 transition-opacity"
                        >
                          <div className="relative w-9 h-9 shrink-0">
                            {t.from_img ? (
                              <Image
                                src={t.from_img}
                                alt={t.from_name}
                                fill
                                className="rounded-full border border-white/10 object-cover"
                                sizes="36px"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-white/40 border border-white/10">
                                {t.from_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-bold text-white/90 truncate underline underline-offset-4 decoration-white/10">
                            {t.from_name}
                          </span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3">
                          {t.from_name === 'Mercado' ? (
                            <MarketLogo size="w-9 h-9" />
                          ) : t.from_name === 'Biwenger' ? (
                            <BiwengerLogo size="w-9 h-9" />
                          ) : (
                            <div className="relative w-9 h-9 shrink-0">
                              <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-white/40 border border-white/10">
                                {t.from_name.charAt(0)}
                              </div>
                            </div>
                          )}
                          <span className="text-sm font-bold text-white/90 truncate">
                            {t.from_name}
                          </span>
                        </div>
                      )}
                    </div>

                    <ArrowRight
                      className={`w-4 h-4 text-white/20 group-hover:${mColors.text} transition-colors group-hover:translate-x-0.5`}
                    />

                    {/* TO */}
                    <div className="flex items-center gap-3 overflow-hidden justify-end">
                      {t.to_id ? (
                        <Link
                          href={`/user/${t.to_id}`}
                          className="flex items-center gap-3 hover:opacity-70 transition-opacity justify-end"
                        >
                          <span className="text-sm font-bold text-white/90 truncate text-right underline underline-offset-4 decoration-white/10">
                            {t.to_name}
                          </span>
                          <div className="relative w-9 h-9 shrink-0">
                            {t.to_img ? (
                              <Image
                                src={t.to_img}
                                alt={t.to_name}
                                fill
                                className="rounded-full border border-white/10 object-cover"
                                sizes="36px"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-white/40 border border-white/10">
                                {t.to_name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 justify-end">
                          <span className="text-sm font-bold text-white/90 truncate text-right">
                            {t.to_name}
                          </span>
                          {t.to_name === 'Mercado' ? (
                            <MarketLogo size="w-9 h-9" />
                          ) : t.to_name === 'Biwenger' ? (
                            <BiwengerLogo size="w-9 h-9" />
                          ) : (
                            <div className="relative w-9 h-9 shrink-0">
                              <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-white/40 border border-white/10">
                                {t.to_name.charAt(0)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Owner Track */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 shadow-inner transition-all duration-500 group-hover:scale-110 ${t.to_id ? `border-${mColors.name}-500/50 bg-white/5` : 'border-white/10 bg-white/5 overflow-hidden'}`}
                  >
                    {t.to_id ? (
                      <Link href={`/user/${t.to_id}`} className="relative w-full h-full">
                        {t.to_img ? (
                          <Image
                            src={t.to_img}
                            alt={t.to_name}
                            fill
                            className="rounded-full object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-black text-white/40 uppercase">
                            {t.to_name.charAt(0)}
                          </div>
                        )}
                      </Link>
                    ) : t.to_name === 'Mercado' ? (
                      <MarketLogo size="w-full h-full" />
                    ) : (
                      <BiwengerLogo size="w-full h-full" />
                    )}
                  </div>
                  {/* Subtle track line for owner */}
                  {idx < sortedTransfers.length - 1 && (
                    <div className="absolute top-12 bottom-0 w-0.5 bg-gradient-to-b from-white/10 to-transparent translate-y-2"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ElegantCard>
  );
}
