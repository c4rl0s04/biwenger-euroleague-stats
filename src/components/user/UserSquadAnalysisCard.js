'use client';

import { TrendingUp, TrendingDown, Minus, Trophy, DollarSign, Activity } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ElegantCard } from '@/components/ui';
import { getScoreColor } from '@/lib/utils/format';

export default function UserSquadAnalysisCard({ squad }) {
  if (!squad || !squad.players || squad.players.length === 0) {
    return (
      <ElegantCard
        title="Análisis de Plantilla"
        icon={Activity}
        color="indigo"
        className="col-span-full"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-white/40 italic">No hay jugadores en la plantilla actualmente.</p>
        </div>
      </ElegantCard>
    );
  }

  const { players } = squad;

  return (
    <div className="col-span-full space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {players.map((player, idx) => (
          <PlayerCompactCard key={player.id} player={player} index={idx} />
        ))}
      </div>
    </div>
  );
}

function PlayerCompactCard({ player, index }) {
  const formatMoney = (amount) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M';
    }
    return (amount / 1000).toFixed(0) + 'K';
  };

  const getPositionColor = (pos) => {
    switch (pos) {
      case 'Base':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Alero':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'Pivot':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getPositionLabel = (pos) => {
    switch (pos) {
      case 'Base':
        return 'B';
      case 'Alero':
        return 'A';
      case 'Pivot':
        return 'P';
      default:
        return 'X';
    }
  };

  const scores = player.recent_scores ? player.recent_scores.split(',').slice(0, 5) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
      className="group relative"
    >
      <Link href={`/player/${player.id}`} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all duration-300 group-hover:bg-white/[0.06] group-hover:shadow-2xl group-hover:shadow-black/50">
          {/* Top Section: Position and Team */}
          <div className="flex justify-between items-start p-3 pb-0 relative z-10">
            <span
              className={`text-[10px] font-black w-6 h-6 rounded-lg border flex items-center justify-center ${getPositionColor(player.position)}`}
            >
              {getPositionLabel(player.position)}
            </span>
            {player.team_img && (
              <div className="w-6 h-6 opacity-40 group-hover:opacity-80 transition-opacity">
                <Image
                  src={player.team_img}
                  alt={player.team}
                  width={24}
                  height={24}
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>

          <div className="flex px-3 pb-3 pt-1 gap-3 relative z-10">
            {/* Player Image */}
            <div className="relative w-16 h-16 shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              {player.img ? (
                <Image
                  src={player.img}
                  alt={player.name}
                  fill
                  className="object-contain object-bottom transition-transform duration-500 group-hover:scale-110 drop-shadow-lg"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white/10" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <h4 className="text-sm font-black text-white leading-tight truncate group-hover:text-primary transition-colors">
                {player.name}
              </h4>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider truncate mb-1">
                {player.team}
              </p>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-500/70" />
                  <span className="text-xs font-black text-white/90 tabular-nums">
                    {player.points}
                  </span>
                </div>
                <div className="w-[1px] h-3 bg-white/10" />
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-500/70" />
                  <span className="text-xs font-bold text-white/70 tabular-nums">
                    {formatMoney(player.price)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Scores (Last 5) */}
          <div className="flex border-t border-white/[0.08] p-2 px-3 gap-1 bg-black/20">
            {scores.length > 0 ? (
              scores.map((score, i) => (
                <div
                  key={i}
                  className={`flex-1 text-[9px] font-black py-0.5 rounded-sm flex items-center justify-center transition-all duration-300 ${getScoreColor(score)} border border-black/20`}
                >
                  {score === 'X' ? '-' : score}
                </div>
              ))
            ) : (
              <div className="w-full text-[9px] font-bold text-white/20 text-center uppercase tracking-widest py-0.5">
                Sin datos recientes
              </div>
            )}
          </div>

          {/* Price Trend Indicator */}
          {player.price_increment !== 0 && (
            <div
              className={`absolute top-0 right-0 p-1.5 rounded-bl-xl ${player.price_increment > 0 ? 'text-emerald-500' : 'text-rose-500'}`}
            >
              {player.price_increment > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
