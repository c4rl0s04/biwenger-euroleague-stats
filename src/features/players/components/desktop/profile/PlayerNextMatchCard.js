'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatMatchDate, formatMatchTime } from '@/lib/utils/date';
import { CalendarClock, MapPin } from 'lucide-react';
import { ElegantCard } from '@/components/ui';

export default function PlayerNextMatchCard({ nextMatch, playerTeam, className = '' }) {
  if (!nextMatch) {
    return (
      <ElegantCard
        title="Próximo Partido"
        icon={CalendarClock}
        color="orange"
        className={`h-full ${className}`}
      >
        <div className="flex items-center justify-center h-full min-h-[160px] text-muted-foreground/60 text-sm font-bold uppercase tracking-widest">
          Sin partidos programados
        </div>
      </ElegantCard>
    );
  }

  const isHome = nextMatch.home_team === playerTeam;
  const opponent = isHome ? nextMatch.away_team : nextMatch.home_team;
  const opponentImg = isHome ? nextMatch.away_img : nextMatch.home_img;
  const opponentId = isHome ? nextMatch.away_id : nextMatch.home_id;

  const playerTeamImg = isHome ? nextMatch.home_img : nextMatch.away_img;
  const playerTeamId = isHome ? nextMatch.home_id : nextMatch.away_id;

  // Format date and time using standardized utility
  const dateStr = formatMatchDate(nextMatch.date);
  const timeStr = formatMatchTime(nextMatch.date);

  return (
    <ElegantCard
      title="Próximo Partido"
      icon={CalendarClock}
      color="orange"
      className={`h-full ${className}`}
    >
      <div className="flex flex-col h-full mt-2">
        {/* Top row: Match Context */}
        <div className="flex justify-center items-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.15)] backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,1)]"></span>
            </span>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-orange-400/90 mt-px">
              {nextMatch.round_name || 'Liga'}
            </span>
          </div>
        </div>

        {/* Matchup Visualization */}
        <div className="flex items-center justify-between flex-1 relative z-10 px-2 md:px-6">
          {/* Player's Team Logo */}
          <div className="flex flex-col items-center">
            <Link
              href={`/team/${playerTeamId}`}
              className="relative w-20 h-20 md:w-24 md:h-24 drop-shadow-xl group-hover/card:scale-110 hover:!scale-125 transition-transform duration-500 cursor-pointer z-20"
            >
              {playerTeamImg ? (
                <Image
                  src={playerTeamImg}
                  alt={playerTeam || 'Team'}
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-white/5 rounded-xl" />
              )}
            </Link>
          </div>

          {/* VS & Location */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.3em]">
              VS
            </span>
            <div className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm shadow-inner">
              <MapPin className="w-3 h-3 text-orange-400" />
              <span className="uppercase tracking-widest">{isHome ? 'Casa' : 'Fuera'}</span>
            </div>
          </div>

          {/* Opponent's Team Logo */}
          <div className="flex flex-col items-center">
            <Link
              href={`/team/${opponentId}`}
              className="relative w-20 h-20 md:w-24 md:h-24 drop-shadow-xl group-hover/card:scale-110 hover:!scale-125 transition-transform duration-500 cursor-pointer z-20"
            >
              {opponentImg ? (
                <Image
                  src={opponentImg}
                  alt={opponent}
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-white/5 rounded-xl" />
              )}
            </Link>
          </div>
        </div>

        {/* Opponent Text */}
        <div className="text-center mt-5">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Contra
          </span>
          <div className="text-base md:text-lg font-black text-white tracking-widest uppercase truncate px-2 mt-1 drop-shadow-md">
            {opponent}
          </div>
        </div>

        {/* Footer: Date & Time */}
        <div className="flex flex-col items-center mt-6 pt-5 border-t border-white/10 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-px bg-orange-500/50" />
          <div className="text-3xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg leading-none mb-1">
            {timeStr}
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {dateStr}
          </div>
        </div>
      </div>
    </ElegantCard>
  );
}
