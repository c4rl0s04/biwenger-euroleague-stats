'use client';

import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { Users, Euro, Trophy, TrendingUp, BarChart3 } from 'lucide-react';

export default function PlayerStatsSection({ filteredPlayers = [] }) {
  // Calculate stats
  const totalCount = filteredPlayers.length;
  const totalValue = filteredPlayers.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalPoints = filteredPlayers.reduce((sum, p) => sum + (p.total_points || 0), 0);
  const avgPoints = totalCount > 0 ? (totalPoints / totalCount).toFixed(1) : '0.0';
  const avgValue = totalCount > 0 ? totalValue / totalCount : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <ElegantCard title="JUGADORES" icon={Users} color="blue" padding="p-4">
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white">
            <AnimatedNumber value={totalCount} />
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
            Encontrados
          </span>
        </div>
      </ElegantCard>

      <ElegantCard title="VALOR TOTAL" icon={Euro} color="emerald" padding="p-4">
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white tracking-tighter">
            <AnimatedNumber value={totalValue} format="currency" />
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter text-emerald-500/80">
            Mercado
          </span>
        </div>
      </ElegantCard>

      <ElegantCard title="PUNTOS TOTALES" icon={Trophy} color="amber" padding="p-4">
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white">
            <AnimatedNumber value={totalPoints} />
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter text-amber-500/80">
            Acumulados
          </span>
        </div>
      </ElegantCard>

      <ElegantCard title="MEDIA PUNTOS" icon={TrendingUp} color="purple" padding="p-4">
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white">
            <AnimatedNumber value={parseFloat(avgPoints)} decimals={1} />
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter text-purple-500/80">
            Por Jugador
          </span>
        </div>
      </ElegantCard>

      <ElegantCard
        title="VALOR MEDIO"
        icon={BarChart3}
        color="cyan"
        padding="p-4"
        className="col-span-2 lg:col-span-1"
      >
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white tracking-tighter">
            <AnimatedNumber value={avgValue} format="currency" />
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter text-cyan-500/80">
            Inversión Media
          </span>
        </div>
      </ElegantCard>
    </div>
  );
}
