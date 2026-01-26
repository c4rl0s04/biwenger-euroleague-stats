'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';

// Section 7.2: The Player Token UI
// "A circular avatar with a colored border indicating position."
export default function PlayerCourtCard({ player, onClick, size = 'base' }) {
  const [imgError, setImgError] = useState(false);

  // Fallback for missing headshots (Section 5.2)
  const handleImageError = () => setImgError(true);

  // Map position to "Team/Role Colors" (Section 7.1 Dynamic Theming)
  // Map position to "Team/Role Colors" (Section 7.1 Dynamic Theming)
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

  const getPointsBg = (pts) => {
    const s = Number(pts);
    if (s >= 10) return 'bg-blue-600';
    if (s >= 5) return 'bg-green-600';
    if (s > 0) return 'bg-orange-500';
    if (s == 0) return 'bg-slate-500';
    return 'bg-red-600';
  };

  const ptsBg = getPointsBg(player.points);

  // CAPTAIN LOGIC: Override border and add glow
  const isCaptain = player.is_captain;
  const baseColors = positionColors[player.position] || {
    border: 'border-white',
    bg: 'bg-slate-900',
  };

  const colors = {
    ...baseColors,
    border: isCaptain ? 'border-yellow-400' : baseColors.border, // Gold border for captain
  };

  // Size configurations
  const sizes = {
    base: {
      avatar: 'w-12 h-12 md:w-16 md:h-16',
      border: 'border-[2px] md:border-[3px]',
      nameText: 'text-[10px] md:text-xs',
      namePad: 'px-2 py-0.5 md:px-3 md:py-1',
      ptsText: 'text-xs md:text-sm',
    },
    large: {
      avatar: 'w-16 h-16 md:w-24 md:h-24',
      border: 'border-[3px] md:border-[4px]',
      nameText: 'text-xs md:text-sm',
      namePad: 'px-3 py-1 md:px-4 md:py-1.5',
      ptsText: 'text-sm md:text-base',
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
        {/* Glossy Reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none z-30" />

        {!imgError ? (
          <div className="relative w-full h-full pt-2 scale-[1.7] origin-top">
            <Image
              src={
                !imgError
                  ? player.img ||
                    `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player.player_id}.png`
                  : '/placeholder.png' // Fallback handled by onError mostly but good practice
              }
              alt={player.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={handleImageError}
            />
          </div>
        ) : (
          // Fallback: Initials on Jersey color background
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-base font-bold">
            {player.name ? player.name.substring(0, 2).toUpperCase() : '??'}
          </div>
        )}
      </div>

      {/* 2. The Semantic Label (Pill) */}
      <div className="absolute top-[85%] left-1/2 -translate-x-1/2 z-30">
        <div className="flex flex-col items-center">
          <span
            className={`${colors.bg} ${s.nameText} text-white ${s.namePad} rounded-full border border-white/20 shadow-md whitespace-nowrap font-bold tracking-wider backdrop-blur-md max-w-[150px] truncate`}
          >
            {player.name
              ? player.name.length > 12
                ? player.name.substring(0, 12) + '...'
                : player.name
              : 'Player ' + player.player_id}
          </span>

          {/* Stat Badge (Points) */}
          <span
            className={`mt-0.5 ${s.ptsText} text-white ${ptsBg} font-mono font-black px-1.5 py-0 rounded border border-white/20 shadow-sm`}
          >
            {player.points !== undefined ? `${player.points} pts` : '-'}
          </span>
        </div>
      </div>

      {/* 3. The "Halo" Selection Indicator (Section 7.2) */}
      {player.isSelected && (
        <motion.div
          layoutId="selection-ring"
          className="absolute -inset-1 rounded-full border-2 border-white/50 border-dashed animate-spin-slow pointer-events-none"
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}
