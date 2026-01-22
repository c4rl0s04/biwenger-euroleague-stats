'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

// Section 7.2: The Player Token UI
// "A circular avatar with a colored border indicating position."
export default function PlayerCourtCard({ player, onClick }) {
  const [imgError, setImgError] = useState(false);

  // Fallback for missing headshots (Section 5.2)
  const handleImageError = () => setImgError(true);

  // Map position to "Team/Role Colors" (Section 7.1 Dynamic Theming)
  const positionColors = {
    PG: { border: 'border-blue-500', bg: 'bg-blue-600' },
    Base: { border: 'border-blue-500', bg: 'bg-blue-600' },
    SG: { border: 'border-blue-500', bg: 'bg-blue-600' },
    SF: { border: 'border-green-500', bg: 'bg-green-600' },
    Alero: { border: 'border-green-500', bg: 'bg-green-600' },
    PF: { border: 'border-green-500', bg: 'bg-green-600' },
    C: { border: 'border-red-500', bg: 'bg-red-600' },
    Pivot: { border: 'border-red-500', bg: 'bg-red-600' },
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
  const colors = positionColors[player.position] || { border: 'border-white', bg: 'bg-slate-900' };

  return (
    <motion.div
      className="relative group cursor-pointer"
      onClick={() => onClick && onClick(player)}
      whileHover={{ scale: 1.15, zIndex: 50 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* 1. The Avatar Token */}
      <div
        className={`relative w-16 h-16 md:w-24 md:h-24 rounded-full border-[3px] md:border-[4px] ${colors.border} shadow-[0_6px_16px_rgba(0,0,0,0.6)] bg-slate-900 overflow-hidden z-20`}
      >
        {/* Glossy Reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none z-30" />

        {!imgError ? (
          <img
            src={
              player.img ||
              `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player.player_id}.png`
            }
            alt={player.name}
            className="w-full h-full object-cover object-top pt-2 scale-110" // scalable image
            onError={handleImageError}
          />
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
            className={`${colors.bg} text-xs md:text-sm text-white px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/20 shadow-md whitespace-nowrap font-bold tracking-wider backdrop-blur-md max-w-[200px] truncate`}
          >
            {player.name || 'Player ' + player.player_id}
          </span>

          {/* Stat Badge (Points) */}
          <span
            className={`mt-1 text-sm md:text-base text-white ${ptsBg} font-mono font-black px-2 py-0.5 rounded border border-white/20 shadow-sm`}
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
