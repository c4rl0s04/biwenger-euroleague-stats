'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, TrendingUp, ArrowRight } from 'lucide-react';
import PlayerImage from '@/components/ui/PlayerImage';
import { getColorForUser } from '@/lib/constants/colors';

function formatEuro(value) {
  return new Intl.NumberFormat('es-ES').format(Math.round(value || 0));
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
}) {
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
  };

  const colors = colorMap[color] || colorMap.blue;

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
            className="fixed top-0 right-0 h-screen w-full sm:w-[500px] bg-zinc-950/90 backdrop-blur-3xl border-l border-white/5 z-[201] flex flex-col shadow-[-10px_0_50px_rgba(0,0,0,0.8)]"
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
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 leading-tight mb-1">
                    {subtitle || 'Ranking Completo'}
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight truncate">
                    {title}
                  </h2>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {data.slice(0, 50).map((item, idx) => (
                <StatItemRow key={idx} item={item} idx={idx} statType={statType} />
              ))}

              {data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 italic text-sm">
                  No hay datos disponibles para este ranking.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/5 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 leading-none mb-1">
                  Registros
                </span>
                <span className="text-2xl font-black text-white tabular-nums leading-none">
                  {data.length}
                </span>
              </div>

              <div className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">
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
  // Common data resolution
  const rank = idx + 1;
  const isTop3 = rank <= 3;

  // Resolve Value Label and Value
  let valueLabel = '';
  let valueText = '';
  let valueSub = '';

  // 1. Transaction Type
  if (item.purchase_price && item.sale_price) {
    const profit = item.profit || item.sale_price - item.purchase_price;
    valueLabel = profit >= 0 ? 'Beneficio' : 'Pérdida';
    valueText = `${formatEuro(Math.abs(profit))}€`;
    valueSub = `Compra: ${formatEuro(item.purchase_price)}€`;
  }
  // 2. Revaluation Type
  else if (item.purchase_price && (item.revaluation || item.devaluation)) {
    const change = item.revaluation || item.devaluation;
    valueLabel = change >= 0 ? 'Revalorización' : 'Depreciación';
    valueText = `${formatEuro(Math.abs(change))}€`;
    valueSub = `Comprado por: ${formatEuro(item.purchase_price)}€`;
  }
  // 3. User Stats
  else if (item.total_spent || item.total_overpay || item.trade_count) {
    if (item.total_spent) {
      valueLabel = 'Total Invertido';
      valueText = `${formatEuro(item.total_spent)}€`;
      valueSub = `${item.purchases_count} fichajes`;
    } else if (item.total_overpay) {
      valueLabel = 'Sobrepago Total';
      valueText = `${formatEuro(item.total_overpay)}€`;
      valueSub = `${item.contested_wins} victorias disputadas`;
    } else {
      valueLabel = 'Plusvalías';
      valueText = `${formatEuro(item.total_profit || 0)}€`;
      valueSub = `${item.trade_count} operaciones`;
    }
  }
  // 4. Default / Generic Player
  else {
    const mainVal = item.price || item.purchase_price || item.total_spent || item.profit || 0;
    valueLabel = 'Valor';
    valueText = `${formatEuro(mainVal)}€`;
    valueSub = item.player_team || item.team || '';
  }

  // Resolve Image and Identity
  const isUser = statType === 'user' || (!item.player_id && (item.id || item.user_id));
  const imageSrc = item.player_img || item.user_img || item.icon || item.buyer_icon;
  const name = item.player_name || item.user_name || item.name || item.buyer_name;
  const linkId = item.id || item.user_id || item.buyer_id || item.player_id;
  const linkPath = isUser ? `/user/${linkId}` : `/player/${item.player_id || item.id}`;

  const resolvedColorIndex = [
    item.color_index,
    item.user_color_index,
    item.buyer_color,
    item.user_color,
  ].find((v) => v !== undefined && v !== null);
  const userColor = isUser
    ? getColorForUser(linkId, name, resolvedColorIndex)
    : { text: 'text-white' };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + idx * 0.02 }}
    >
      <Link
        href={linkPath}
        className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
      >
        {/* Rank */}
        <div
          className={`w-8 font-black italic text-xl tabular-nums text-center ${isTop3 ? 'text-primary' : 'text-zinc-700'}`}
        >
          {rank}
        </div>

        {/* Media */}
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/5 overflow-hidden shrink-0 relative">
          <PlayerImage
            src={imageSrc}
            name={name}
            width={48}
            height={48}
            className={`w-full h-full object-cover ${!isUser ? 'object-top scale-[1.6] translate-y-1.5' : 'object-contain p-2'}`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4
            className={`font-black uppercase tracking-tight truncate leading-tight group-hover:text-primary transition-colors ${userColor.text}`}
          >
            {name}
          </h4>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{valueSub}</div>
        </div>

        {/* Value */}
        <div className="text-right shrink-0">
          <div className="text-sm font-black text-white leading-none">{valueText}</div>
          <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1.5">
            {valueLabel}
          </div>
        </div>

        <ArrowRight
          size={14}
          className="text-zinc-800 group-hover:text-primary transition-colors ml-1"
        />
      </Link>
    </motion.div>
  );
}
