'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, TrendingUp, TrendingDown, ArrowUpRight, HandCoins } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import Image from 'next/image';

export default function LineupOffersSection({ squad, onAccept, onReject, loading }) {
  // Filter for players who have pending offers
  const playersWithOffers = squad.filter((p) => p.offers && p.offers.length > 0);

  if (playersWithOffers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/5 rounded-3xl border border-dashed border-white/10 backdrop-blur-sm">
        <div className="p-4 rounded-2xl bg-zinc-800/50 text-zinc-500 mb-4">
          <HandCoins size={32} strokeWidth={1.5} />
        </div>
        <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1">
          Sin ofertas activas
        </h4>
        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest text-center max-w-xs">
          Actualmente no tienes pujas de otros managers por tus jugadores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {playersWithOffers.map((player) => (
            <OfferCard
              key={player.id}
              player={player}
              onAccept={onAccept}
              onReject={onReject}
              loading={loading}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OfferCard({ player, onAccept, onReject, loading }) {
  const [imgError, setImgError] = useState(false);

  // Financial Logic
  const offer = player.offers[0];
  const offerAmount = offer.amount;
  const purchasePrice = player.owner?.price || 0;
  const marketValue = player.price;

  // Calculated Stats
  const totalProfit = offerAmount - purchasePrice;
  const marketDiff = offerAmount - marketValue;
  const profitPercent = purchasePrice > 0 ? ((totalProfit / purchasePrice) * 100).toFixed(1) : 0;
  const marketDiffPercent = ((marketDiff / marketValue) * 100).toFixed(1);

  // Time Logic
  const { hoursLeft, timeLeft } = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Math.floor(Date.now() / 1000);
    const tl = offer.until - now;
    return {
      hoursLeft: Math.max(0, Math.floor(tl / 3600)),
      timeLeft: tl,
    };
  }, [offer.until]);

  // Image Source Logic
  const playerImage =
    !imgError && player.img
      ? player.img
      : `https://biwenger.as.com/resources/images/players/full/${player.id}.png`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300 shadow-xl"
    >
      {/* Expiration Banner */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-zinc-800">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: `${Math.min(100, (timeLeft / (24 * 3600)) * 100)}%` }}
          className={`h-full ${hoursLeft < 4 ? 'bg-rose-500' : 'bg-primary'}`}
        />
      </div>

      <div className="p-5 space-y-5">
        {/* Player Info Row */}
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-xl bg-zinc-800 overflow-hidden border border-white/5 shadow-inner">
            <div className="relative w-full h-full pt-2 scale-[1.7] origin-top">
              <Image
                src={playerImage}
                alt={player.name}
                fill
                className="object-cover object-top"
                onError={() => setImgError(true)}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-white truncate tracking-tight">{player.name}</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
              <Clock size={12} className={hoursLeft < 4 ? 'text-rose-500' : ''} />
              <span className={hoursLeft < 4 ? 'text-rose-500' : ''}>
                Expira en {hoursLeft}h {Math.floor((timeLeft % 3600) / 60)}m
              </span>
            </div>
          </div>
          <div
            className={`p-2.5 rounded-xl ${totalProfit >= 0 ? 'bg-emerald-800/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}
          >
            {totalProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          </div>
        </div>

        {/* Financial Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5">
          <div className="space-y-1 text-center">
            <span className="text-[9px] text-white/60 uppercase font-black tracking-widest">
              Inversión
            </span>
            <div className="text-xs font-bold text-zinc-300">{formatCurrency(purchasePrice)}</div>
          </div>
          <div className="space-y-1 border-x border-white/5 text-center">
            <span className="text-[9px] text-white/60 uppercase font-black tracking-widest">
              Valor
            </span>
            <div className="text-xs font-bold text-zinc-300">{formatCurrency(marketValue)}</div>
          </div>
          <div className="space-y-1 text-center">
            <span className="text-[9px] text-white/60 uppercase font-black tracking-widest">
              Oferta
            </span>
            <div
              className={`text-xs font-black ${marketDiff >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}
            >
              {formatCurrency(offerAmount)}
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 min-w-0">
            <span className="text-xs text-white font-black uppercase tracking-wider block mb-2 truncate">
              Beneficio Total
            </span>
            <div
              className={`text-sm xl:text-base font-black flex items-center gap-1.5 whitespace-nowrap ${totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}
            >
              <span className="truncate">
                {totalProfit >= 0 ? '+' : ''}
                {formatCurrency(totalProfit)}
              </span>
              <span className="text-[10px] xl:text-xs opacity-50 font-medium shrink-0">
                ({profitPercent}%)
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 min-w-0">
            <span className="text-xs text-white font-black uppercase tracking-wider block mb-2 truncate">
              Margen Mercado
            </span>
            <div
              className={`text-sm xl:text-base font-black flex items-center gap-1.5 whitespace-nowrap ${marketDiff >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}
            >
              <span className="truncate">
                {marketDiff >= 0 ? '+' : ''}
                {formatCurrency(marketDiff)}
              </span>
              <span className="text-[10px] xl:text-xs opacity-50 font-medium shrink-0">
                ({marketDiffPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onReject(player, offer)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer border border-white/5"
          >
            <X size={14} />
            Rechazar
          </button>
          <button
            onClick={() => onAccept(player, offer)}
            disabled={loading}
            className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 hover:shadow-emerald-800/20 hover:scale-[1.02] active:scale-95 transition-all text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer"
          >
            <Check size={14} />
            Aceptar Oferta
          </button>
        </div>
      </div>
    </motion.div>
  );
}
