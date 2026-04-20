'use client';

import { motion } from 'framer-motion';
import PlayerImage from '@/components/ui/PlayerImage';

export default function GridCell({ guess, onClick, isSubmitted }) {
  const isCorrect = !!guess?.isCorrect;

  const getRarityColor = (rarity) => {
    if (rarity === null || rarity === undefined) return '#2563eb';
    if (rarity <= 1) return '#ffffff';
    if (rarity <= 5) return '#9333ea';
    if (rarity <= 15) return '#2563eb';
    if (rarity <= 30) return '#eab308';
    if (rarity <= 50) return '#e2e8f0';
    return '#ea580c';
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
        <div className="h-full flex flex-col items-center justify-end relative">
          <div className="absolute inset-0 flex items-center justify-center pt-2">
            <PlayerImage
              src={guess.playerImg}
              alt={guess.playerName}
              width={160}
              height={160}
              className="object-contain opacity-100"
            />
          </div>

          <div className="relative w-full p-2 bg-gradient-to-t from-black/90 to-transparent pt-8 text-center">
            <p className="text-[9px] font-black uppercase text-white leading-tight drop-shadow-md">
              {guess.playerName}
            </p>
            <p className="text-[8px] font-bold text-white opacity-70">
              Rarity: {Number(guess.rarity).toFixed(2)}%
            </p>
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
