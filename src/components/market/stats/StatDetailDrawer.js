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

            {/* Manager Filter Bar - Initial Palette Style */}
            {allUsers.length > 0 && (statType === 'player' || statType === 'transaction') && (
              <div className="px-8 py-5 border-b border-white/5 bg-zinc-950/20">
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

                        {/* Fallback Initials (Visible if no image or error) */}
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
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {data
                ?.filter((item) => {
                  if (!selectedManagerId) return true;

                  // Match by ID fields
                  const itemId = item.user_id || item.owner_id || item.buyer_id || item.id;
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
                })
                .map((item, idx) => (
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

  // --- CATEGORY: Competitive / Rivalry ---
  if (
    item.stolen_count !== undefined ||
    item.stolen_from_count !== undefined ||
    item.bid_count !== undefined
  ) {
    if (item.bid_count !== undefined) {
      valueLabel = 'Pujas';
      valueText = item.bid_count;
      valueSub = `Precio Traspaso: ${formatEuro(item.precio)}€`;
    } else if (item.stolen_count !== undefined) {
      valueLabel = 'Jugadores Robados';
      valueText = item.stolen_count;
      valueSub = `${item.total_spent ? formatEuro(item.total_spent) + '€ invertidos' : 'Al acecho'}`;
    } else {
      valueLabel = 'Jugadores Perdidos';
      valueText = item.stolen_from_count;
      valueSub = 'Víctima de pujas';
    }
  }
  // --- CATEGORY: Transactions / Flips ---
  else if (item.purchase_price && (item.sale_price || item.profit)) {
    const profit = item.profit || (item.sale_price ? item.sale_price - item.purchase_price : 0);
    valueLabel = profit >= 0 ? 'Beneficio' : 'Pérdida';
    valueText = `${formatEuro(Math.abs(profit))}€`;

    if (item.team_name && item.team_logo) {
      valueSub = (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <img
              src={item.team_logo}
              alt={item.team_name}
              className="w-3.5 h-3.5 object-contain shrink-0"
            />
            <span className="truncate">{item.team_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-70">C:</span> {formatEuro(item.purchase_price)}€
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span className="opacity-70">V:</span> {formatEuro(item.sale_price)}€
          </div>
        </div>
      );
    } else {
      valueSub = (
        <div className="flex items-center gap-2">
          <span className="opacity-70">C:</span> {formatEuro(item.purchase_price)}€
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span className="opacity-70">V:</span> {formatEuro(item.sale_price)}€
        </div>
      );
    }
  }
  // --- CATEGORY: Revaluation ---
  else if (item.purchase_price && (item.revaluation || item.devaluation)) {
    const change = item.revaluation || item.devaluation;
    valueLabel = change >= 0 ? 'Revalorización' : 'Depreciación';
    valueText = `${formatEuro(Math.abs(change))}€`;
    valueSub = (
      <div className="flex items-center gap-2">
        <span className="opacity-70">Compra:</span> {formatEuro(item.purchase_price)}€
        <span className="w-1 h-1 rounded-full bg-zinc-700" />
        <span className="opacity-70">Actual:</span> {formatEuro(item.current_price || item.price)}€
      </div>
    );
  }
  // --- CATEGORY: User Totals / Sellers ---
  else if (
    item.total_spent !== undefined ||
    item.net_profit !== undefined ||
    item.total_profit !== undefined
  ) {
    if (item.total_spent !== undefined) {
      valueLabel = 'Inversión Total';
      valueText = `${formatEuro(item.total_spent)}€`;
      valueSub = `${item.purchases_count} fichajes realizados`;
    } else {
      const profit = item.net_profit || item.total_profit || 0;
      valueLabel = 'Plusvalías Totales';
      valueText = `${formatEuro(profit)}€`;
      valueSub = item.total_sales
        ? `${formatEuro(item.total_sales)}€ en ventas (${item.sales_count} ops)`
        : `${item.trade_count || item.sales_count || 0} operaciones`;
    }
  }
  // --- CATEGORY: Performance / Value ---
  else if (item.points_per_million !== undefined) {
    valueLabel = 'Puntos / Millón';
    valueText = item.points_per_million.toFixed(2);
    valueSub = `${item.total_points} puntos totales`;
  }
  // --- CATEGORY: Generic / Transfer Record ---
  else {
    const mainVal =
      item.precio || item.price || item.purchase_price || item.total_spent || item.value || 0;
    valueLabel = item.precio ? 'Precio Traspaso' : 'Valor';
    valueText = `${formatEuro(mainVal)}€`;

    if (item.team_name && item.team_logo) {
      valueSub = (
        <div className="flex items-center gap-1.5 overflow-hidden">
          <img
            src={item.team_logo}
            alt={item.team_name}
            className="w-3.5 h-3.5 object-contain shrink-0"
          />
          <span className="truncate">{item.team_name}</span>
        </div>
      );
    } else {
      valueSub = item.player_team || item.team || item.player_name || '';
    }
  }

  // Resolve Primary Subject Identity
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

  const primaryColor = isUser
    ? getColorForUser(linkId, name, resolvedColorIndex)
    : { text: 'text-white group-hover:text-primary' };

  // Resolve Secondary Manager Identity (for players/transactions)
  const managerName =
    item.user_name ||
    item.owner_name ||
    item.comprador ||
    item.vendedor ||
    item.winner ||
    (statType === 'user' ? null : item.name);

  const managerId =
    item.user_id ||
    item.owner_id ||
    item.comprador_id ||
    item.buyer_id ||
    item.vendedor_id ||
    item.winner_id;

  const managerColorIndex = [
    item.user_color_index,
    item.color_index,
    item.buyer_color,
    item.buyer_color_index,
    item.owner_color_index,
    item.comprador_color_index,
    item.vendedor_color_index,
  ].find((v) => v !== undefined && v !== null);

  const secondaryColor =
    !isUser && managerName && managerId
      ? getColorForUser(managerId, managerName, managerColorIndex)
      : { text: 'text-zinc-500' };

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
          className={`w-8 font-black italic text-xl tabular-nums text-center ${isTop3 ? 'text-primary' : 'text-zinc-400'}`}
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
            className={`w-full h-full object-cover ${!isUser ? 'object-top scale-[1.35] translate-y-1.5' : 'object-center'}`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <h4
              className={`font-black uppercase tracking-tight truncate leading-tight transition-colors ${primaryColor.text}`}
            >
              {name}
            </h4>
            {isUser ? (
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                Manager
              </span>
            ) : item.vendedor && item.comprador ? (
              <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest truncate ${
                      item.vendedor === 'Mercado' || item.vendedor === 'Biwenger'
                        ? 'text-zinc-500'
                        : getColorForUser(
                            item.vendedor_id || item.seller_id,
                            item.vendedor || item.seller_name,
                            item.vendedor_color_index ?? item.seller_color
                          ).text
                    }`}
                  >
                    {item.vendedor}
                  </span>
                  <ArrowRight size={10} className="text-zinc-700 shrink-0" />
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest truncate ${
                      item.comprador === 'Mercado' || item.comprador === 'Biwenger'
                        ? 'text-zinc-500'
                        : getColorForUser(
                            item.comprador_id || item.buyer_id,
                            item.comprador || item.buyer_name,
                            item.comprador_color_index ?? item.buyer_color
                          ).text
                    }`}
                  >
                    {item.comprador}
                  </span>
                </div>
              </div>
            ) : (
              <span
                className={`text-[10px] font-black uppercase tracking-widest mt-1 ${secondaryColor.text}`}
              >
                {managerName || 'Sin Dueño'}
              </span>
            )}
          </div>
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-2 border-l border-white/10 pl-2">
            {valueSub}
          </div>
        </div>

        {/* Value */}
        <div className="text-right shrink-0">
          <div className="text-sm font-black text-white leading-none">{valueText}</div>
          <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1.5">
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
