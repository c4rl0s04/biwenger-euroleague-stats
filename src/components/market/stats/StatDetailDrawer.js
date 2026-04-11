'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, TrendingUp } from 'lucide-react';
import PlayerImage from '@/components/ui/PlayerImage';
import { getColorForUser } from '@/lib/constants/colors';

import { formatEuro, formatProfit } from '@/lib/utils/currency';
import { TooltipHeader } from '@/components/ui/Tooltip';

// Import strategy-based renderers
import PlayerStatRow from './renderers/PlayerStatRow';
import UserStatRow from './renderers/UserStatRow';
import TransactionStatRow from './renderers/TransactionStatRow';
import TemporalStatRow from './renderers/TemporalStatRow';
import { getMetricConfig } from './renderers/registry';

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * StatDetailDrawer
 * A slide-over panel for viewing full rankings of market statistics.
 */
export default function StatDetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon = TrendingUp,
  data = [],
  statType = 'player', // 'player' | 'user' | 'transaction'
  color = 'blue',
  allUsers = [],
  showFilters = true,
}) {
  const [selectedManagerId, setSelectedManagerId] = React.useState(null);
  const [prevOpen, setPrevOpen] = React.useState(isOpen);

  // Reset filter when opening (Render-time state update pattern)
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setSelectedManagerId(null);
    }
  }
  // Handle Escape key and body scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Color Mapping
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/20',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      glow: 'shadow-rose-500/20',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/20',
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-400',
      glow: 'shadow-indigo-500/20',
    },
    fuchsia: {
      bg: 'bg-fuchsia-500/10',
      border: 'border-fuchsia-500/20',
      text: 'text-fuchsia-400',
      glow: 'shadow-fuchsia-500/20',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-500/20',
    },
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/20',
    },
    teal: {
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      text: 'text-teal-400',
      glow: 'shadow-teal-500/20',
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      glow: 'shadow-red-500/20',
    },
    pink: {
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      text: 'text-pink-400',
      glow: 'shadow-pink-500/20',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/20',
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  // Memoize filtered data for both summary and list
  const filteredData = React.useMemo(() => {
    if (!data) return [];
    return data.filter((item) => {
      if (!selectedManagerId) return true;

      // Match by ID fields
      const itemId = item.winner_id || item.user_id || item.owner_id || item.buyer_id || item.id;
      if (itemId === selectedManagerId) return true;

      // Match by Name fields (comprador, seller, owner_name, etc)
      const selectedUser = allUsers.find((u) => u.id === selectedManagerId);
      if (selectedUser) {
        const names = [
          item.user_name,
          item.owner_name,
          item.name,
          item.buyer_name,
          item.comprador,
          item.vendedor,
          item.winner, // for biggest steal
        ];
        if (names.includes(selectedUser.name)) return true;
      }

      return false;
    });
  }, [data, selectedManagerId, allUsers]);

  // Calculate Summary if config exists
  const summaryData = React.useMemo(() => {
    if (!filteredData.length) return null;
    const config = getMetricConfig(filteredData[0], statType.toUpperCase());
    if (!config?.summary) return null;

    const total = filteredData.reduce((acc, item) => {
      const val =
        typeof config.summary.key === 'function'
          ? config.summary.key(item)
          : item[config.summary.key];
      return acc + (Number(val) || 0);
    }, 0);

    const label =
      typeof config.summary.label === 'function'
        ? config.summary.label(filteredData[0])
        : config.summary.label;

    return { total, label, type: config.summary.type };
  }, [filteredData, statType]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[700px] bg-zinc-950/95 backdrop-blur-3xl border-l border-white/5 z-[201] flex flex-col shadow-[-10px_0_50px_rgba(0,0,0,0.8)]"
          >
            {/* Header */}
            <div className="relative p-8 pb-6 border-b border-white/5 bg-zinc-900/40">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-5">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${colors.border} ${colors.bg} ${colors.glow} shadow-lg`}
                >
                  <Icon size={26} className={colors.text} />
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 leading-tight mb-2">
                    {subtitle || 'Ranking Completo'}
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight truncate">
                    {title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Manager Filter Bar & Summary Metric */}
            {showFilters && allUsers.length > 0 && (
              <div className="px-8 py-5 border-b border-white/5 bg-zinc-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                {/* Only show icons/filter for NON-user types */}
                {statType !== 'user' ? (
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* "Todos" Icon */}
                      <button
                        onClick={() => setSelectedManagerId(null)}
                        className={`w-11 h-11 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2 flex items-center justify-center relative cursor-pointer ${
                          selectedManagerId === null
                            ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-110 z-10'
                            : 'bg-zinc-900/40 text-zinc-500 border-white/5 hover:bg-white/5 hover:border-white/10'
                        }`}
                        title="Todos los Managers"
                      >
                        ALL
                      </button>

                      {/* Manager Icons */}
                      {allUsers.map((user) => {
                        const uColor = getColorForUser(user.id, user.name, user.color_index);
                        const isSelected = selectedManagerId === user.id;

                        return (
                          <button
                            key={user.id}
                            onClick={() => setSelectedManagerId(user.id)}
                            className={`w-11 h-11 rounded-full text-[11px] font-black uppercase transition-all shrink-0 flex items-center justify-center border-2 overflow-hidden relative cursor-pointer ${
                              isSelected
                                ? `${uColor.border.replace('border-', 'border-opacity-100 border-')} shadow-[0_0_15px_rgba(0,0,0,0.4)] scale-110 z-10 opacity-100`
                                : `opacity-30 hover:opacity-100 border-white/5 hover:border-white/20 bg-zinc-900/20`
                            }`}
                            title={user.name}
                          >
                            {/* Manager Avatar Image */}
                            {user.icon ? (
                              <img
                                src={user.icon}
                                alt={user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : null}

                            {/* Fallback Initials */}
                            <span
                              className={`absolute inset-0 flex items-center justify-center font-bold text-xs tracking-tighter ${isSelected ? uColor.text : 'text-zinc-600'} -z-10`}
                            >
                              {getInitials(user.name)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selection Context Label */}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                        Filtrando por:
                      </span>
                      <span
                        className={`text-[11px] font-black uppercase tracking-widest transition-colors ${
                          selectedManagerId
                            ? getColorForUser(
                                selectedManagerId,
                                allUsers.find((u) => u.id === selectedManagerId)?.name,
                                allUsers.find((u) => u.id === selectedManagerId)?.color_index
                              ).text
                            : 'text-zinc-400'
                        }`}
                      >
                        {selectedManagerId
                          ? allUsers.find((u) => u.id === selectedManagerId)?.name
                          : 'Todos los Managers'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Resumen General de la Liga
                    </span>
                  </div>
                )}

                {/* Integrated centered, wider Summary Metric */}
                {summaryData && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center border-l border-white/10 pl-6 h-full shrink-0"
                  >
                    <div className="flex flex-col items-center">
                      <div className="max-w-[140px] text-center mb-1.5">
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-500 leading-tight block">
                          {summaryData.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 whitespace-nowrap">
                        <span
                          className={`${summaryData.type === 'currency' ? 'text-3xl' : 'text-4xl'} font-black tracking-tighter tabular-nums leading-none ${colors.text}`}
                        >
                          {summaryData.type === 'currency'
                            ? formatProfit(summaryData.total)
                            : summaryData.total.toLocaleString('es-ES')}
                        </span>
                        {summaryData.type === 'currency' && summaryData.total < 0 && (
                          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none">
                            pérdida total
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {filteredData.map((item, idx) => (
                <StatItemRow key={idx} item={item} idx={idx} statType={statType} />
              ))}

              {filteredData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 italic text-sm">
                  No hay datos disponibles para este ranking.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-3 border-t border-white/5 bg-zinc-900/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                  Registros
                </span>
                <span className="text-lg font-black text-white tabular-nums leading-none">
                  {filteredData.length}
                </span>
              </div>

              <div className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.2em]">
                Data Actualizada
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

function StatItemRow({ item, idx, statType }) {
  // Strategy: Determine which specialized row to render based on data presence

  // 1. Transactional / Transfer specific
  if (
    item.price_diff !== undefined ||
    item.bid_count !== undefined ||
    (item.vendedor && item.comprador)
  ) {
    return <TransactionStatRow item={item} idx={idx} statType={statType} />;
  }

  // 2. Temporal / Hold-time based
  if (
    item.hours_held !== undefined ||
    item.days_held !== undefined ||
    (item.purchase_price !== undefined && item.sale_price !== undefined)
  ) {
    return <TemporalStatRow item={item} idx={idx} statType={statType} />;
  }

  // 3. User / Manager Totals
  if (
    item.total_spent !== undefined ||
    item.net_profit !== undefined ||
    item.total_profit !== undefined ||
    item.stolen_count !== undefined ||
    item.failed_bids_count !== undefined ||
    item.trade_count !== undefined
  ) {
    return <UserStatRow item={item} idx={idx} statType={statType} />;
  }

  // 4. Default to Player (Activiy, Inflation, Infirmary, Revaluation, Points)
  return <PlayerStatRow item={item} idx={idx} statType={statType} />;
}
