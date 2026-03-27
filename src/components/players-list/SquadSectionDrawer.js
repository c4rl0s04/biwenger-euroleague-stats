'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Trophy, Target, TrendingUp, DollarSign } from 'lucide-react';
import PlayerImage from '@/components/ui/PlayerImage';

/**
 * SquadSectionDrawer
 * A premium right-side drawer that shows a filtered list of players.
 */
export default function SquadSectionDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  players = [],
  color = '#3b82f6',
}) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-slate-950/80 backdrop-blur-3xl border-l border-white/10 z-[101] flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.5)]"
          >
            {/* Header Area */}
            <div className="relative p-8 pb-6 border-b border-white/5">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-5">
                {/* Visual Anchor */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/10 relative overflow-hidden group"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <div
                    className="absolute inset-0 opacity-20 blur-xl group-hover:opacity-40 transition-opacity"
                    style={{ backgroundColor: color }}
                  />
                  {icon ? (
                    <img src={icon} alt="" className="w-10 h-10 object-contain relative z-10" />
                  ) : (
                    <Trophy size={32} className="relative z-10" style={{ color }} />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80 leading-tight mb-1">
                    {subtitle || 'Breakdown'}
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight truncate">
                    {title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="space-y-4">
                {players.length > 0 ? (
                  players.map((player, idx) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all cursor-default"
                    >
                      {/* Player Image with Background */}
                      <div className="w-14 h-14 rounded-xl bg-slate-900 border border-white/5 overflow-hidden shrink-0 relative">
                        <PlayerImage
                          src={player.img}
                          name={player.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-black italic text-base text-slate-100 uppercase tracking-tight truncate leading-none">
                            {player.name}
                          </h4>
                          <span className="text-[10px] font-black text-muted-foreground bg-white/5 px-2 py-0.5 rounded leading-none uppercase">
                            {player.position}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <Target size={12} className="text-primary" />
                            <span className="text-xs font-black tabular-nums text-slate-300">
                              {player.average || 0}{' '}
                              <span className="text-[9px] text-muted-foreground italic ml-0.5">
                                AVG
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign size={12} className="text-emerald-500" />
                            <span className="text-xs font-black tabular-nums text-slate-300">
                              {new Intl.NumberFormat('es-ES').format(player.price || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Team Logo Overlay (Subtle) */}
                      <div className="w-8 h-8 opacity-30 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0 relative">
                        <Image
                          src={player.team_img}
                          alt=""
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center text-muted-foreground italic text-sm opacity-50">
                    No se encontraron jugadores en esta sección.
                  </div>
                )}
              </div>
            </div>

            {/* Footer Area */}
            <div className="p-8 border-t border-white/5 bg-black/20 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 leading-none mb-1">
                  Total Jugadores
                </span>
                <span className="text-2xl font-black text-white tabular-nums leading-none">
                  {players.length}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                <TrendingUp size={16} className="text-primary" />
                <span className="text-xs font-black uppercase text-primary tracking-wider">
                  Detalles Actualizados
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
