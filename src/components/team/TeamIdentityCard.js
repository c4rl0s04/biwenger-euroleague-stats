'use client';

import { Trophy, Wallet, CheckCircle2, XCircle } from 'lucide-react';
import { ElegantCard } from '@/components/ui';
import Image from 'next/image';
import { cloneElement } from 'react';

export default function TeamIdentityCard({ team }) {
  if (!team) return null;

  const {
    name,
    logo,
    total_fantasy_points,
    total_value,
    roster_size,
    matches_played,
    wins,
    losses,
  } = team;

  // Formatters
  const formatPrice = (price) => {
    if (Math.abs(price) >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M€';
    }
    return new Intl.NumberFormat('es-ES').format(price) + '€';
  };

  return (
    <ElegantCard hideHeader padding="p-0" className="overflow-hidden group">
      {/* Brand Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 opacity-40 group-hover:opacity-60 transition-opacity duration-700" />

      <div className="relative flex flex-col lg:flex-row z-10">
        {/* --- SECTION A: TEAM IDENTITY --- */}
        <div className="flex items-center gap-6 p-6 lg:p-8 lg:w-[40%] border-b lg:border-b-0 lg:border-r border-border/50">
          {/* Logo with Glow */}
          <div className="relative shrink-0">
            <div className="absolute -inset-4 rounded-full blur-2xl opacity-10 bg-blue-500 group-hover:opacity-20 transition-opacity" />
            <div className="relative w-20 h-20 lg:w-28 lg:h-28 flex items-center justify-center">
              {logo ? (
                <Image
                  src={logo}
                  alt={name}
                  fill
                  className="object-contain"
                  sizes="112px"
                  priority
                />
              ) : (
                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-3xl">
                  🛡️
                </div>
              )}

              {/* Position Badge */}
              {team.rank > 0 && (
                <div className="absolute -bottom-1 -right-1 w-9 h-9 lg:w-12 lg:h-12 bg-[#0a0a0a]/90 backdrop-blur-xl rounded-xl flex flex-col items-center justify-center border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] group-hover:scale-110 group-hover:border-primary/40 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <span className="relative z-10 text-[7px] lg:text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-0.5">
                    POS
                  </span>
                  <span className="relative z-10 text-sm lg:text-xl font-black text-white leading-none font-display">
                    {team.rank}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name & Basic Info */}
          <div className="flex flex-col min-w-0">
            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter leading-tight truncate uppercase font-display mb-3 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent group-hover:to-white transition-all">
              {name}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                  {roster_size} Jugadores
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION B: TEAM KPIs --- */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/20">
          <KPICell
            label="Puntos Fantasy"
            value={total_fantasy_points}
            sub={`Media: ${(total_fantasy_points / (matches_played || 1)).toFixed(1)}`}
            icon={<Trophy />}
            color="text-amber-400"
          />

          <KPICell
            label="Partidos Ganados"
            value={wins}
            sub="Victorias Reales"
            icon={<CheckCircle2 />}
            color="text-emerald-400"
          />

          <KPICell
            label="Partidos Perdidos"
            value={losses}
            sub="Derrotas Reales"
            icon={<XCircle />}
            color="text-rose-400"
          />

          <KPICell
            label="Valor Plantilla"
            value={formatPrice(total_value)}
            sub="Total Biwenger"
            icon={<Wallet />}
            color="text-blue-400"
          />
        </div>
      </div>
    </ElegantCard>
  );
}

function KPICell({ label, value, sub, icon, color = 'text-primary', className = '' }) {
  return (
    <div
      className={`flex flex-col justify-center p-6 lg:p-8 bg-black/20 hover:bg-white/[0.03] transition-colors group/kpi ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`transition-transform duration-300 group-hover/kpi:scale-110 ${color}`}>
          {cloneElement(icon, { size: 16 })}
        </div>
        <span
          className={`text-[10px] font-black uppercase tracking-widest group-hover/kpi:brightness-125 transition-all ${color} opacity-70`}
        >
          {label}
        </span>
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={`text-xl lg:text-3xl font-black tracking-tighter tabular-nums text-white font-display`}
        >
          {value}
        </span>
        <span className="text-[10px] font-bold text-white/50 mt-2 uppercase tracking-wide">
          {sub}
        </span>
      </div>
    </div>
  );
}
