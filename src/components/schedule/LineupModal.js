'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, Trophy } from 'lucide-react';

// Position display config — blue / green / red
const POSITION_CONFIG = {
  Base: {
    label: 'B',
    badge: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  Alero: {
    label: 'A',
    badge: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
  Pivot: {
    label: 'P',
    badge: 'text-red-400 bg-red-400/10 border-red-400/20',
  },
};

function PlayerRow({ player, index, isCaptain, isStarter, onPlayerClick }) {
  const pos = player.normPos || 'Base';
  const config = POSITION_CONFIG[pos] || POSITION_CONFIG.Base;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
        isCaptain
          ? 'bg-yellow-500/5 border-yellow-500/20'
          : isStarter
            ? 'bg-secondary/50 border-border/50'
            : 'bg-transparent border-transparent'
      }`}
    >
      {/* Row number */}
      <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0 text-center">
        {index + 1}
      </span>

      {/* Position badge */}
      <span
        className={`text-[8px] font-black px-1.5 py-0.5 rounded border shrink-0 tracking-widest ${config.badge}`}
      >
        {config.label}
      </span>

      {/* Player name — clickable */}
      <button
        onClick={() => onPlayerClick(player.id)}
        className={`flex-1 text-sm font-semibold truncate text-left transition-all duration-150 hover:scale-[1.02] hover:brightness-125 active:scale-95 cursor-pointer ${
          isCaptain ? 'text-yellow-300' : 'text-foreground'
        }`}
      >
        {player.name}
      </button>

      {/* Captain trophy */}
      {isCaptain && (
        <div className="flex items-center gap-1 shrink-0">
          <Trophy size={11} className="text-yellow-500 fill-yellow-500" />
          <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">
            Cap
          </span>
        </div>
      )}

      {/* Bench label */}
      {!isStarter && (
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
          SUP
        </span>
      )}
    </div>
  );
}

export default function LineupModal({
  isOpen,
  onClose,
  starters,
  bench,
  captain,
  formationType,
  userName,
}) {
  const router = useRouter();

  const handlePlayerClick = (playerId) => {
    onClose();
    router.push(`/player/${playerId}`);
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Formation banner */}
            <div className="px-5 pt-4 pb-3 border-b border-border bg-secondary/30">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                Esquema
              </p>
              <p className="text-3xl font-black text-foreground tracking-tight">{formationType}</p>
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-black text-foreground leading-none mb-1">
                    Alineación enviada
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium tracking-wide">
                    {userName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Starters */}
            <div className="px-3 pt-3 pb-1">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 mb-2">
                Quinteto Inicial
              </p>
              <div className="space-y-1">
                {starters.map((player, i) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    index={i}
                    isCaptain={player.id === captain?.id}
                    isStarter
                    onPlayerClick={handlePlayerClick}
                  />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 my-2 border-t border-border" />

            {/* Bench */}
            <div className="px-3 pb-3">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 mb-2">
                Banquillo
              </p>
              <div className="space-y-1">
                {bench.map((player, i) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    index={i}
                    isCaptain={false}
                    isStarter={false}
                    onPlayerClick={handlePlayerClick}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 pb-4">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-secondary hover:bg-muted border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-all tracking-widest uppercase cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
