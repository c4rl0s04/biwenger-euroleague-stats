'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { X, Trophy, Target, TrendingUp, Euro } from 'lucide-react';
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

  // Helper: Get badge color based on position
  const getPositionColor = (pos) => {
    switch (pos) {
      case 'Base':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Alero':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Pivot':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-white/5 text-muted-foreground border-white/10';
    }
  };

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
            className="fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-[hsl(var(--sidebar-background)/0.8)] backdrop-blur-3xl border-l border-[hsl(var(--sidebar-border))] z-[101] flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.5)]"
          >
            {/* Header Area */}
            <div className="relative p-8 pb-6 border-b border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background)/0.4)]">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
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
                  <h2 className="text-2xl font-black uppercase tracking-tight text-foreground leading-tight truncate">
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
                    >
                      <Link
                        href={`/player/${player.id}`}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-[hsl(var(--secondary)/0.3)] hover:bg-[hsl(var(--secondary)/0.6)] border border-[hsl(var(--border)/0.5)] hover:border-[hsl(var(--primary)/0.3)] transition-all duration-300 cursor-pointer"
                      >
                        {/* Player Image with Background */}
                        <div className="w-14 h-14 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--sidebar-border))] overflow-hidden shrink-0 relative">
                          <PlayerImage
                            src={player.img}
                            name={player.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover object-top scale-[1.55] translate-y-[22%] transform group-hover:scale-[1.65] transition-all duration-500"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-black italic text-base text-foreground uppercase tracking-tight truncate leading-none group-hover:text-primary transition-colors">
                              {player.name}
                            </h4>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded border leading-none uppercase ${getPositionColor(player.position)}`}
                            >
                              {player.position}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <Target size={12} className="text-primary" />
                              <span className="text-xs font-black tabular-nums text-foreground/80">
                                {player.average || 0}{' '}
                                <span className="text-[9px] text-muted-foreground italic ml-0.5">
                                  AVG
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Euro size={12} className="text-emerald-500" />
                              <span className="text-xs font-black tabular-nums text-foreground/80">
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
                      </Link>
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
            <div className="p-8 border-t border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background)/0.6)] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 leading-none mb-1">
                  Total Jugadores
                </span>
                <span className="text-2xl font-black text-foreground tabular-nums leading-none">
                  {players.length}
                </span>
              </div>
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)] shadow-[inset_0_0_20px_rgba(250,80,1,0.05)]">
                <TrendingUp size={16} className="text-primary" />
                <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                  Breakdown Completo
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
