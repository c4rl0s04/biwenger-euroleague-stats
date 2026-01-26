'use client';

import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

export function MatchCard({ match }) {
  const isPlayed = match.home.score !== null && match.away.score !== null;

  // Determine winner for highlighting (optional)
  const homeWinner = isPlayed && match.home.score > match.away.score;
  const awayWinner = isPlayed && match.away.score > match.home.score;

  return (
    <div className="flex items-center justify-between p-4 bg-card/40 border border-border/40 rounded-xl hover:bg-card/60 transition-colors">
      {/* Home Team */}
      <div className="flex items-center gap-3 flex-1 justify-start min-w-0">
        <span
          className={cn(
            'font-bold text-sm sm:text-base truncate text-right w-full',
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
      </div>

      {/* Score / Time */}
      <div className="flex flex-col items-center justify-center px-4 shrink-0 min-w-[80px]">
        {isPlayed ? (
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
          <span className="text-muted-foreground text-xs font-medium bg-muted/20 px-2 py-1 rounded-md">
            VS
          </span>
        )}
      </div>

      {/* Away Team */}
      <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
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
            'font-bold text-sm sm:text-base truncate text-left w-full',
            awayWinner ? 'text-primary' : 'text-foreground'
          )}
        >
          {match.away.name}
        </span>
      </div>
    </div>
  );
}
