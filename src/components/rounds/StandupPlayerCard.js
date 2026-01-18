'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { getScoreColor } from '@/lib/utils/format';

export default function StandupPlayerCard({ player, onClick }) {
  // Config for the "Jersey" style look
  const positionColor =
    {
      PG: 'bg-blue-600',
      Base: 'bg-blue-600',
      SG: 'bg-blue-600',
      SF: 'bg-green-600',
      Alero: 'bg-green-600',
      PF: 'bg-green-600',
      C: 'bg-red-600',
      Pivot: 'bg-red-600',
    }[player.position] || 'bg-slate-700';

  const getPointsText = (pts) => {
    const s = Number(pts);
    if (s >= 10) return 'text-blue-500';
    if (s >= 5) return 'text-green-500';
    if (s > 0) return 'text-orange-500';
    if (s == 0) return 'text-slate-400';
    return 'text-red-500';
  };

  const ptsColor = getPointsText(player.points);

  return (
    <div
      className="relative group cursor-pointer w-32 flex flex-col items-center"
      onClick={() => onClick && onClick(player)}
    >
      {/* 1. THE PLAYER (Billboarding) */}

      {/* Jersey / Body (Now Image) */}
      <div className="relative z-20 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2">
        <div
          className={`w-28 h-28 ${positionColor} rounded-lg shadow-lg border-2 border-white/20 overflow-hidden relative bg-slate-800`}
        >
          <div className="relative w-full h-full scale-125 origin-top">
            <Image
              src={
                player.img ||
                `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player.player_id}.png`
              }
              alt={player.name || 'Player'}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover object-top"
              onError={(e) => {
                // Next.js Image doesn't support inline onError directly
              }}
            />
          </div>
          {/* Fallback if image fails (Jersey style) */}
          <div className="hidden w-full h-full absolute inset-0 flex-col items-center justify-center">
            <span className="text-white text-2xl font-bold font-mono tracking-tighter drop-shadow-md">
              {player.player_id % 55 || 23}
            </span>
          </div>

          {/* Captain Badge */}
          {player.isCaptain && (
            <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-400 rounded-full text-[10px] font-bold flex items-center justify-center text-black border border-white shadow-sm z-10">
              C
            </div>
          )}
        </div>
      </div>

      {/* 2. THE STATS CARD (The white box below) */}
      <div className="relative z-20 mt-[-6px] bg-white w-full rounded-md shadow-[0_4px_8px_rgba(0,0,0,0.3)] border border-gray-300 overflow-hidden text-center">
        {/* Name Bar */}
        <div
          className={`${positionColor} text-white text-[10px] font-bold py-0.5 uppercase tracking-wide truncate px-1`}
        >
          {player.name || 'Player'}
        </div>
        {/* Stats Row */}
        <div className="flex justify-between items-center px-2 py-1.5 text-slate-800">
          <div className="flex flex-col leading-none items-center">
            <span className={`text-lg font-black ${ptsColor}`}>
              {player.points !== undefined ? player.points : '-'}
            </span>
            <span className="text-[9px] text-gray-500 font-bold uppercase">PTS</span>
          </div>
          <div className="h-5 w-px bg-gray-200 mx-1"></div>
          <div className="flex flex-col leading-none items-center">
            <span className="text-lg font-black text-slate-700">{player.valuation || '-'}</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase">VAL</span>
          </div>
        </div>
      </div>

      {/* 3. THE SHADOW (Essential for 3D effect) */}
      <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-16 h-4 bg-black/40 blur-sm rounded-[100%] scale-x-150 z-10 pointer-events-none transition-all group-hover:scale-x-125 group-hover:bg-black/20"></div>
    </div>
  );
}
