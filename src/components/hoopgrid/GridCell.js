'use client';

import { motion } from 'framer-motion';
import PlayerImage from '@/components/ui/PlayerImage';

/**
 * Individual cell in the Hoopgrid board.
 */
export default function GridCell({ guess, onClick, isGameSubmitted }) {
  // Direct HEX color map for maximum reliability
  const getRarityColor = (rarity) => {
    if (rarity === null || rarity === undefined) return '#2563eb'; // Selection Blue
    if (rarity <= 1) return '#ffffff'; // Rainbow/White
    if (rarity <= 5) return '#9333ea'; // Purple
    if (rarity <= 15) return '#2563eb'; // Blue
    if (rarity <= 30) return '#eab308'; // Gold
    if (rarity <= 50) return '#e2e8f0'; // Silver
    return '#ea580c'; // Bronze (Orange-600)
  };

  const isCorrect = !!guess?.isCorrect;
  const rarityColor = isCorrect ? getRarityColor(guess.rarity) : null;

  return (
    <motion.div
      whileHover={
        !isCorrect && !isGameSubmitted
          ? { scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }
          : {}
      }
      whileTap={!isCorrect && !isGameSubmitted ? { scale: 0.98 } : {}}
      onClick={onClick}
      style={{
        backgroundColor: rarityColor || undefined,
        color: guess?.rarity <= 50 && isCorrect && guess?.rarity > 30 ? '#0f172a' : 'inherit',
      }}
      className={`
        relative aspect-square rounded-xl overflow-hidden cursor-pointer
        border-2 transition-all duration-300 group
        ${isCorrect && guess.rarity <= 1 ? 'animate-rainbow-border shadow-xl' : 'border-white/10'}
        ${!isCorrect ? 'bg-white/5 shadow-inner' : ''}
        ${guess?.isCorrect === false ? 'border-destructive bg-destructive/20' : ''}
      `}
    >
      {isCorrect ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full flex flex-col items-center justify-end relative"
        >
          {/* Player Image - Large & 100% Opaque */}
          <div className="absolute inset-0 flex items-center justify-center pt-2">
            <PlayerImage
              src={guess.playerImg}
              alt={guess.playerName}
              width={160}
              height={160}
              className="object-contain opacity-100 group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          {/* Player Info Overlay */}
          <div className="relative w-full p-2 bg-gradient-to-t from-black/90 to-transparent pt-8 text-center">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter leading-tight text-white mb-0.5 drop-shadow-md">
              {guess.playerName}
            </p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-[8px] font-bold opacity-70 text-white">Rarity:</span>
              <span className="text-[9px] font-black text-white">
                {Number(guess.rarity).toFixed(2)}%
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-primary/40 group-hover:scale-125 transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.05)]" />
        </div>
      )}
    </motion.div>
  );
}
