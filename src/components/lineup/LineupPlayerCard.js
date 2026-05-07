'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';

export default function LineupPlayerCard({ player, onClick, size = 'base', isSelected = false }) {
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => setImgError(true);

  const positionColors = {
    PG: { border: 'border-blue-500', bg: 'bg-slate-900' },
    Base: { border: 'border-blue-500', bg: 'bg-slate-900' },
    SG: { border: 'border-blue-500', bg: 'bg-slate-900' },
    SF: { border: 'border-green-500', bg: 'bg-slate-900' },
    Alero: { border: 'border-green-500', bg: 'bg-slate-900' },
    PF: { border: 'border-green-500', bg: 'bg-slate-900' },
    C: { border: 'border-red-500', bg: 'bg-slate-900' },
    Pivot: { border: 'border-red-500', bg: 'bg-slate-900' },
  };

  const isCaptain = player.is_captain;
  const baseColors = positionColors[player.position] || {
    border: 'border-white',
    bg: 'bg-slate-900',
  };

  const colors = {
    ...baseColors,
    border: isCaptain ? 'border-yellow-400' : baseColors.border,
  };

  const sizes = {
    base: {
      avatar: 'w-12 h-12 md:w-16 md:h-16',
      border: 'border-[2px] md:border-[3px]',
      nameText: 'text-[10px] md:text-xs',
      namePad: 'px-2 py-0.5 md:px-3 md:py-1',
    },
    large: {
      avatar: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24',
      border: 'border-[2px] md:border-[3px] xl:border-[4px]',
      nameText: 'text-[9px] sm:text-[10px] md:text-xs xl:text-sm',
      namePad: 'px-2 py-0.5 md:px-3 md:py-1',
    },
  };

  const s = sizes[size] || sizes.base;

  return (
    <motion.div
      className="relative group cursor-pointer"
      onClick={() => onClick && onClick(player)}
      whileHover={{ scale: 1.05, zIndex: 50 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className={`relative ${s.avatar} rounded-full ${s.border} ${colors.border} 
          ${isCaptain ? 'shadow-[0_0_30px_rgba(250,204,21,0.9),0_0_60px_rgba(250,204,21,0.6)]' : 'shadow-[0_6px_16px_rgba(0,0,0,0.6)]'} 
          bg-slate-900 overflow-hidden z-20`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none z-30" />

        {player.img && !imgError ? (
          <div className="relative w-full h-full pt-2 scale-[1.7] origin-top">
            <Image
              src={player.img}
              alt={player.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={handleImageError}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-base font-bold">
            {player.name ? player.name.substring(0, 2).toUpperCase() : '??'}
          </div>
        )}
      </div>

      <div className="absolute top-[85%] left-1/2 -translate-x-1/2 z-30">
        <div className="flex flex-col items-center">
          <span
            className={`${colors.bg} ${s.nameText} text-white ${s.namePad} rounded-full border border-white/20 shadow-md whitespace-nowrap font-bold tracking-wider backdrop-blur-md max-w-[150px] truncate`}
          >
            {player.name || 'Player'}
          </span>
        </div>
      </div>

      {isSelected && (
        <motion.div
          layoutId="selection-ring"
          className="absolute -inset-2 rounded-full border-2 border-primary/50 border-dashed animate-spin-slow pointer-events-none"
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}
