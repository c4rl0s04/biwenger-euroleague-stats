'use client';

import { useState } from 'react';
import { X, Search, UserPlus, ArrowLeftRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function LineupPlayerSwapModal({
  isOpen,
  onClose,
  targetPlayer,
  isStarter,
  squad,
  activeIds,
  onSelect,
  captainId,
  onSetCaptain,
}) {
  const [search, setSearch] = useState('');

  if (!isOpen || !targetPlayer) return null;

  // 1. Filter squad based on position (if starter) and search term
  const filteredPlayers = squad.filter((p) => {
    // If starter, must match position
    if (isStarter && p.position !== targetPlayer.position) return false;

    // Search match
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;

    // Don't show the player we are currently swapping
    return String(p.id) !== String(targetPlayer.id);
  });

  // Sort: Active players first, then by performance
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const aActive = activeIds.has(String(a.id));
    const bActive = activeIds.has(String(b.id));
    if (aActive !== bActive) return aActive ? -1 : 1;

    const scoreA = (a.average || 0) * 100 + (a.points || 0);
    const scoreB = (b.average || 0) * 100 + (b.points || 0);
    return scoreB - scoreA;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-zinc-950 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '80vh' }}
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isStarter ? 'Cambiar' : 'Reemplazar'}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  {isStarter
                    ? `Mostrando solo ${targetPlayer.position}s disponibles.`
                    : 'Selecciona un jugador para entrar en la rotación.'}
                </p>
              </div>

              {/* Captain Action (Only for starters) */}
              {isStarter && (
                <button
                  onClick={() => {
                    onSetCaptain(targetPlayer.id);
                    onClose();
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 cursor-pointer ${
                    String(captainId) === String(targetPlayer.id)
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-500'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Star
                    size={16}
                    fill={String(captainId) === String(targetPlayer.id) ? 'currentColor' : 'none'}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {String(captainId) === String(targetPlayer.id) ? 'Capitán' : 'Hacer Capitán'}
                  </span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar jugador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-white/5 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <div className="space-y-1">
              {sortedPlayers.map((player) => {
                const isActive = activeIds.has(String(player.id));

                return (
                  <button
                    key={player.id}
                    onClick={() => onSelect(player)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                      {player.img ? (
                        <div className="relative w-full h-full pt-1 scale-[1.5] origin-top">
                          <Image
                            src={player.img}
                            alt={player.name}
                            fill
                            className="object-cover object-top"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                          {player.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate">{player.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-medium">
                          {player.position}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {player.average || 0} pts avg • {player.points || 0} total
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isActive ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                          <ArrowLeftRight className="w-3 h-3" />
                          Swap
                        </div>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-white/10 text-white">
                          <UserPlus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {sortedPlayers.length === 0 && (
              <div className="py-12 text-center text-zinc-600 text-sm italic">
                No se encontraron jugadores disponibles.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
