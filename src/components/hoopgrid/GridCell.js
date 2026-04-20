'use client';

import { motion } from 'framer-motion';
import PlayerImage from '@/components/ui/PlayerImage';

export default function GridCell({ guess, onClick, isSubmitted }) {
  const isCorrect = !!guess?.isCorrect;

  const getRarityColor = (rarity) => {
    const r = Number(rarity);
    if (isNaN(r)) return '#2563eb';
    if (r <= 1) return '#ffffff'; // Rainbow/White (Mythic)
    if (r <= 5) return '#9333ea'; // Purple (Legendary)
    if (r <= 12) return '#2563eb'; // Blue (Rare)
    if (r <= 25) return '#eab308'; // Gold (Uncommon)
    if (r <= 40) return '#c2c8d0'; // Silver (Common+)
    return '#a86929'; // Brown/Bronze (Common - 100%)
  };

  return (
    <motion.div
      whileHover={
        !isCorrect && !isSubmitted ? { scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' } : {}
      }
      onClick={onClick}
      style={{
        backgroundColor: isCorrect ? getRarityColor(guess.rarity) : undefined,
      }}
      className={`
        relative aspect-square rounded-xl overflow-hidden cursor-pointer
        border-2 transition-all duration-300 group
        ${isCorrect && guess.rarity <= 1 ? 'animate-rainbow-border shadow-xl' : 'border-white/10'}
        ${!isCorrect ? 'bg-white/5 shadow-inner' : ''}
      `}
    >
      {isCorrect ? (
        <div className="h-full flex flex-col items-end justify-end relative">
          {/* Player Image */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <PlayerImage
              src={guess.playerImg}
              alt={guess.playerName}
              width={180}
              height={180}
              className="object-contain opacity-100 w-full h-full scale-125 translate-y-4"
            />
          </div>

          {/* Static gloss shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent pointer-events-none" />
          {/* Dark gradient base */}
          <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          {/* Name + Rarity — single box */}
          <div className="relative w-full pb-2 px-1.5">
            <div className="w-full flex flex-col items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-white/10">
              <span className="w-full text-center text-[11px] md:text-[13px] font-black uppercase tracking-wide text-white leading-tight">
                {guess.playerName}
              </span>
              <span className="text-[10px] md:text-[11px] font-semibold text-white/70 tracking-widest">
                {Number(guess.rarity).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-primary/40 transition-all duration-300" />
        </div>
      )}
    </motion.div>
  );
}
