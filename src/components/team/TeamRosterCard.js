'use client';

import { useState } from 'react';
import { Search, Users, TrendingUp, TrendingDown, Activity, User } from 'lucide-react';
import { ElegantCard } from '@/components/ui';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getScoreColor } from '@/lib/utils/format';
import { getColorForUser } from '@/lib/constants/colors';

export default function TeamRosterCard({ roster }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, base, alero, pivot, free, owned

  if (!roster || roster.length === 0) {
    return (
      <ElegantCard title="Plantilla" icon={Users} color="blue">
        <div className="py-12 text-center text-white/40 italic">
          No hay jugadores registrados en este equipo.
        </div>
      </ElegantCard>
    );
  }

  const filteredRoster = roster.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'free'
        ? !player.owner_id
        : activeFilter === 'owned'
          ? player.owner_id
          : player.position.toLowerCase() === activeFilter);
    return matchesSearch && matchesFilter;
  });

  const positions = [
    { id: 'all', label: 'Todos', color: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' },
    { id: 'base', label: 'Bases', color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
    { id: 'alero', label: 'Aleros', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
    { id: 'pivot', label: 'Pivots', color: 'bg-rose-500', shadow: 'shadow-rose-500/20' },
    { id: 'free', label: 'Libres', color: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
    { id: 'owned', label: 'Fichados', color: 'bg-cyan-500', shadow: 'shadow-cyan-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar jugador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
          {positions.map((pos) => (
            <button
              key={pos.id}
              onClick={() => setActiveFilter(pos.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === pos.id
                  ? `${pos.color} text-white shadow-lg ${pos.shadow}`
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredRoster.map((player, idx) => (
            <PlayerCard key={player.id} player={player} index={idx} />
          ))}
        </AnimatePresence>
      </div>

      {filteredRoster.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-white/20 font-bold uppercase tracking-widest">
            No se encontraron jugadores
          </p>
        </div>
      )}
    </div>
  );
}

function PlayerCard({ player, index }) {
  const formatMoney = (amount) => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    return (amount / 1000).toFixed(0) + 'K';
  };

  const getPositionStyles = (pos) => {
    switch (pos) {
      case 'Base':
        return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'Alero':
        return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
      case 'Pivot':
        return 'text-rose-400 border-rose-400/30 bg-rose-400/10';
      default:
        return 'text-slate-400 border-slate-400/30 bg-slate-400/10';
    }
  };

  const userColor = player.owner_id
    ? getColorForUser(player.owner_id, player.owner_name, player.owner_color_index)
    : null;

  const scores = player.recent_scores ? player.recent_scores.split(',').slice(0, 5) : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className="group"
    >
      <Link href={`/player/${player.id}`} className="block">
        <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/[0.08] hover:border-blue-500/30 hover:bg-white/[0.06] transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-black/50">
          {/* Top Info: Position & Owner */}
          <div className="p-3 flex justify-between items-start">
            <span
              className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-black uppercase ${getPositionStyles(player.position)}`}
            >
              {player.position.charAt(0)}
            </span>

            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all ${
                player.owner_id
                  ? `${userColor?.bgLight || 'bg-amber-500/10'} ${userColor?.border || 'border-amber-500/20'}`
                  : 'bg-emerald-500/10 border-emerald-500/20'
              }`}
            >
              <User
                size={10}
                className={
                  player.owner_id ? userColor?.text || 'text-amber-500' : 'text-emerald-500'
                }
              />
              <span
                className={`text-[9px] font-black uppercase tracking-tighter truncate max-w-[60px] ${
                  player.owner_id ? userColor?.text || 'text-amber-500' : 'text-emerald-500'
                }`}
              >
                {player.owner_name || 'Libre'}
              </span>
            </div>
          </div>

          {/* Player Media Cluster */}
          <div className="px-4 pb-4 flex flex-col items-center text-center">
            <div className="relative w-24 h-24 mb-3">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
              <div className="relative w-full h-full overflow-hidden rounded-full border border-white/5 bg-white/[0.02] group-hover:border-blue-500/20 transition-all">
                {player.img ? (
                  <Image
                    src={player.img}
                    alt={player.name}
                    fill
                    className="object-contain object-top scale-125 pt-2 group-hover:scale-135 transition-transform duration-500"
                    unoptimized
                  />
                ) : (
                  <Activity className="w-8 h-8 text-white/10 m-auto mt-8" />
                )}
              </div>
            </div>

            <h4
              className={`text-sm font-black text-white leading-tight transition-colors line-clamp-1 ${
                player.owner_id
                  ? userColor?.groupHover || 'group-hover:text-blue-400'
                  : 'group-hover:text-emerald-400'
              }`}
            >
              {player.name}
            </h4>

            <div className="mt-4 w-full grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/[0.08] transition-colors">
                <span className="text-[8px] font-bold text-amber-400/60 uppercase tracking-widest mb-1">
                  Puntos
                </span>
                <span className="text-sm font-black text-amber-400 tabular-nums">
                  {player.points}
                </span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/[0.08] transition-colors">
                <span className="text-[8px] font-bold text-blue-400/60 uppercase tracking-widest mb-1">
                  Valor
                </span>
                <span className="text-sm font-black text-blue-400 tabular-nums">
                  {formatMoney(player.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Form Strip */}
          <div className="flex border-t border-white/[0.08] p-2 px-3 gap-1 bg-black/40">
            {scores.length > 0 ? (
              scores.map((score, i) => (
                <div
                  key={i}
                  className={`flex-1 text-[10px] font-black py-1 rounded-md flex items-center justify-center transition-all duration-300 ${getScoreColor(score)} border border-black/20`}
                >
                  {score === 'X' ? '-' : score}
                </div>
              ))
            ) : (
              <div className="w-full text-[9px] font-bold text-white/20 text-center uppercase tracking-widest py-0.5">
                Sin datos
              </div>
            )}
          </div>

          {/* Price Trend Indicator */}
          {player.price_increment !== 0 && (
            <div
              className={`absolute top-12 right-4 flex flex-col items-center ${player.price_increment > 0 ? 'text-emerald-500' : 'text-rose-500'}`}
            >
              {player.price_increment > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="text-[8px] font-black">
                {formatMoney(Math.abs(player.price_increment))}
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
