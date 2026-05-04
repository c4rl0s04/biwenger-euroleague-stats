'use client';

import { Trophy, TrendingUp, Wallet, Medal, Calendar, Award } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import { ElegantCard } from '@/components/ui';
import Image from 'next/image';
import { cloneElement } from 'react';

export default function ManagerIdentityCard({ stats }) {
  if (!stats) return null;

  const {
    name,
    icon,
    color_index,
    total_points,
    position,
    team_value,
    price_trend,
    victories,
    rounds_played,
    average_points,
  } = stats;

  const userColor = getColorForUser(null, name, color_index);

  // Formatters
  const formatPrice = (price) => {
    if (Math.abs(price) >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M€';
    }
    return new Intl.NumberFormat('es-ES').format(price) + '€';
  };

  const getRankBadge = (pos) => {
    const styles = {
      1: 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 text-slate-950 ring-yellow-400/30',
      2: 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-900 ring-slate-200/30',
      3: 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white ring-orange-500/30',
      default: 'bg-secondary text-muted-foreground ring-white/5',
    };
    return styles[pos] || styles.default;
  };

  return (
    <ElegantCard hideHeader padding="p-0" className="overflow-hidden group">
      {/* 1. BRANDING OVERLAY */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${userColor.bg} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700`}
      />

      <div className="relative flex flex-col lg:flex-row z-10">
        {/* --- SECTION A: IDENTITY CLUSTER --- */}
        <div className="flex items-center gap-6 p-6 lg:p-8 lg:w-[40%] border-b lg:border-b-0 lg:border-r border-border/50 bg-transparent">
          {/* Avatar with Ring */}
          <div className="relative shrink-0">
            <div
              className={`absolute -inset-1.5 rounded-full blur-md opacity-20 bg-gradient-to-tr from-primary to-accent`}
            />
            <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full border-2 border-white/10 overflow-hidden bg-secondary shadow-xl">
              {icon ? (
                <Image src={icon} alt={name} fill className="object-cover" sizes="96px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-muted-foreground/20">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            {/* Minimalist Rank Badge */}
            <div
              className={`absolute -bottom-1 -right-1 flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm shadow-lg ring-4 ${getRankBadge(position)}`}
            >
              {position}
            </div>
          </div>

          {/* Name & Basic Context */}
          <div className="flex flex-col min-w-0">
            <h1
              className={`text-3xl lg:text-4xl font-black tracking-tight leading-none truncate uppercase font-display mb-3 ${userColor.text}`}
            >
              {name}
            </h1>
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-2 group/badge">
                <Medal
                  size={18}
                  className="text-yellow-500/70 group-hover/badge:text-yellow-500 transition-colors"
                />
                <span className="text-xs font-bold text-white/60 group-hover/badge:text-foreground transition-colors uppercase tracking-wider">
                  {victories} Victorias
                </span>
              </div>
              <div className="flex items-center gap-2 group/badge">
                <Calendar
                  size={18}
                  className="text-primary/70 group-hover/badge:text-primary transition-colors"
                />
                <span className="text-xs font-bold text-white/60 group-hover/badge:text-foreground transition-colors uppercase tracking-wider">
                  {rounds_played} Jornadas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION B: KPI DASHBOARD --- */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/20">
          <KPICell
            label="Puntos"
            value={total_points}
            sub={`Media: ${average_points}`}
            icon={<Trophy />}
            color="text-orange-400"
          />

          <KPICell
            label="Valor"
            value={formatPrice(team_value)}
            sub="Plantilla"
            icon={<Wallet />}
            color="text-blue-400"
          />

          <KPICell
            label="Tendencia"
            value={`${price_trend > 0 ? '+' : ''}${formatPrice(price_trend)}`}
            sub="Esta semana"
            icon={<TrendingUp />}
            color="text-purple-400"
          />

          <KPICell
            label="Posición"
            value={`#${position}`}
            sub="Ranking Liga"
            icon={<Award />}
            color="text-yellow-400"
            className="hidden sm:flex"
          />
        </div>
      </div>
    </ElegantCard>
  );
}

/**
 * KPI Cell Sub-component
 */
function KPICell({ label, value, sub, icon, color = 'text-primary', valueColor, className = '' }) {
  // Use section color as default for value if none provided
  const finalValueColor = valueColor || color;

  return (
    <div
      className={`flex flex-col justify-center p-6 lg:p-8 bg-transparent hover:bg-white/[0.03] transition-colors group/kpi ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`transition-transform duration-300 group-hover/kpi:scale-110 ${color}`}>
          {cloneElement(icon, { size: 16 })}
        </div>
        <span
          className={`text-[10px] font-black uppercase tracking-widest group-hover/kpi:brightness-125 transition-all ${color}`}
        >
          {label}
        </span>
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={`text-xl lg:text-3xl font-black tracking-tighter tabular-nums ${finalValueColor} font-display`}
        >
          {value}
        </span>
        {sub && (
          <span className="text-[10px] font-bold text-white/70 mt-1.5 uppercase tracking-wide">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
