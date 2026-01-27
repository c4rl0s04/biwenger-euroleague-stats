'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export function MatchCard({ match }) {
  // Use status to determine if match has been played (not score, since unplayed matches have 0-0)
  const isPlayed = match.status === 'finished';

  // Determine if match is currently live (started but not finished)
  const matchDate = match.date ? new Date(match.date) : null;
  const now = new Date();
  const isLive = matchDate && matchDate <= now && !isPlayed;

  // Determine winner for highlighting
  const homeWinner = isPlayed && match.home.score > match.away.score;
  const awayWinner = isPlayed && match.away.score > match.home.score;

  // Format time only (date is now in Section title)
  const formattedTime = matchDate
    ? matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 bg-card/40 border rounded-xl hover:bg-card/60 transition-colors',
        isLive ? 'border-red-500/50 bg-red-500/5' : 'border-border/40'
      )}
    >
      {/* Home Team */}
      <Link
        href={`/team/${match.home.id}`}
        className="flex items-center gap-3 flex-1 justify-start min-w-0 group"
      >
        <span
          className={cn(
            'font-bold text-sm sm:text-base truncate text-right w-full group-hover:text-primary transition-colors',
            homeWinner ? 'text-primary' : 'text-foreground'
          )}
        >
          {match.home.name}
        </span>
        <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={match.home.img}
            alt={match.home.name}
            className="w-full h-full object-contain"
          />
        </div>
      </Link>

      {/* Score / Time / Live */}
      <div className="flex flex-col items-center justify-center px-4 shrink-0 min-w-[80px]">
        {isLive ? (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider">
                En vivo
              </span>
            </div>
          </div>
        ) : isPlayed ? (
          <div className="flex items-center gap-2 font-mono text-xl sm:text-2xl font-black tracking-tight">
            <span className={cn(homeWinner ? 'text-primary' : 'text-foreground')}>
              {match.home.score}
            </span>
            <span className="text-muted-foreground/40 text-sm">-</span>
            <span className={cn(awayWinner ? 'text-primary' : 'text-foreground')}>
              {match.away.score}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm font-medium">{formattedTime || 'VS'}</span>
        )}
      </div>

      {/* Away Team */}
      <Link
        href={`/team/${match.away.id}`}
        className="flex items-center gap-3 flex-1 justify-end min-w-0 group"
      >
        <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={match.away.img}
            alt={match.away.name}
            className="w-full h-full object-contain"
          />
        </div>
        <span
          className={cn(
            'font-bold text-sm sm:text-base truncate text-left w-full group-hover:text-primary transition-colors',
            awayWinner ? 'text-primary' : 'text-foreground'
          )}
        >
          {match.away.name}
        </span>
      </Link>
    </div>
  );
}
