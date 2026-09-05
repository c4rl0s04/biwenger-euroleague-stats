'use client';

import Image from 'next/image';
import { DollarSign, TrendingUp, TrendingDown, User } from 'lucide-react';
import { ElegantCard } from '@/components/ui';

export default function PlayerMarketCard({ player, className = '' }) {
  const isPositive = player.price_increment >= 0;
  const changeColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
  const changeBg = isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10';
  const changeBorder = isPositive ? 'border-emerald-500/20' : 'border-rose-500/20';
  const shadowGlow = isPositive
    ? 'shadow-[0_0_20px_rgba(16,185,129,0.15)]'
    : 'shadow-[0_0_20px_rgba(244,63,94,0.15)]';

  // Calculate current season start date (September 1st)
  const today = new Date();
  const startYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
  const seasonStartDate = new Date(startYear, 8, 1); // September 1st

  // Filter history for current season only
  const currentSeasonHistory = (player.priceHistory || []).filter(
    (h) => new Date(h.date) >= seasonStartDate
  );
  const hasHistory = currentSeasonHistory.length > 0;
  const prices = hasHistory ? currentSeasonHistory.map((h) => Number(h.price)) : [player.price];

  const maxPrice = Math.max(...prices, player.price);
  const minPrice = Math.min(...prices, player.price);
  const progress =
    maxPrice === minPrice ? 50 : ((player.price - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <ElegantCard
      title="Mercado"
      icon={DollarSign}
      color="emerald"
      className={`h-full ${className}`}
    >
      <div className="flex flex-col h-full justify-between mt-2">
        {/* Main Price Display */}
        <div className="flex flex-col items-center justify-center py-6 relative z-10 flex-1">
          <div className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-emerald-400/80 mb-3">
            Valor Actual
          </div>

          <div className="text-5xl md:text-6xl font-black text-emerald-400 tracking-tighter tabular-nums drop-shadow-lg leading-none flex items-baseline">
            {(player.price / 1000000).toFixed(2)}
            <span className="text-2xl md:text-3xl text-emerald-500 ml-1 tracking-normal">M€</span>
          </div>

          {/* Change Pill */}
          <div
            className={`mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${changeBg} border ${changeBorder} ${shadowGlow} backdrop-blur-sm transition-transform duration-500 hover:scale-105 cursor-default`}
          >
            {isPositive ? (
              <TrendingUp className={`w-4 h-4 ${changeColor}`} />
            ) : (
              <TrendingDown className={`w-4 h-4 ${changeColor}`} />
            )}
            <span className={`text-sm md:text-base font-black tracking-widest ${changeColor}`}>
              {isPositive ? '+' : ''}
              {Math.abs(player.price_increment / 1000).toFixed(0)}k
            </span>
          </div>

          {/* Season Price Range (Premium Bar) */}
          {hasHistory && maxPrice !== minPrice && (
            <div className="mt-8 w-full max-w-[85%] flex flex-col items-center gap-3">
              <div className="flex justify-between w-full text-sm md:text-base font-black uppercase tracking-wider text-slate-300">
                <span>{(minPrice / 1000000).toFixed(1)}M (Mín)</span>
                <span>{(maxPrice / 1000000).toFixed(1)}M (Máx)</span>
              </div>

              {/* Premium Bar Container */}
              <div className="relative w-full flex items-center py-2">
                {/* Track Background */}
                <div className="w-full h-2.5 rounded-full bg-slate-950/80 shadow-inner border border-white/10 overflow-hidden relative">
                  {/* Empty Track Texture */}
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,rgba(255,255,255,0.05)_4px,rgba(255,255,255,0.05)_5px)]" />

                  {/* Active Gradient Fill */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Marker Knob */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-[3px] border-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10 transition-all duration-1000 flex items-center justify-center"
                  style={{ left: `calc(${progress}% - 10px)` }}
                >
                  <div className="w-1 h-1 bg-slate-900 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ElegantCard>
  );
}
