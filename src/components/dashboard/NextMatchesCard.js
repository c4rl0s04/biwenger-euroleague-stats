'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApiData } from '@/lib/hooks/useApiData';
import { getShortTeamName } from '@/lib/utils/format';
import { getCorrectedMatchDate, formatMatchTime } from '@/lib/utils/date';

function DayMatchRow({ dayName, matches, roundName }) {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [matches]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <div className="flex flex-col gap-3 relative group/carousel">
      {/* Day Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
        <Calendar className="w-4 h-4 text-blue-400" />
        {dayName}
      </div>

      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:bg-accent transition-all duration-200 -ml-2 lg:opacity-0 lg:group-hover/carousel:opacity-100 cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:bg-accent transition-all duration-200 -mr-2 lg:opacity-0 lg:group-hover/carousel:opacity-100 cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Matches Row */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-4 px-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {matches.map((match, idx) => {
            const time = formatMatchTime(match.date);

            return (
              <div
                key={idx}
                className="snap-center shrink-0 w-[260px] bg-card/40 backdrop-blur-sm border border-border/50 rounded-xl hover:border-blue-500/30 transition-all group relative overflow-hidden flex flex-col"
              >
                {/* Card Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Top: Time */}
                {/* Top: Time OR Score */}
                <div className="bg-muted/30 py-3 text-center border-b border-white/5 group-hover:bg-blue-500/5 transition-colors relative">
                  {match.home_score !== null && match.status !== 'scheduled' ? (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-3xl font-bold text-foreground font-mono tracking-tight leading-none group-hover:scale-110 transition-transform duration-300">
                        {match.home_score} - {match.away_score}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {match.status === 'finished' ? 'Finalizado' : 'En Juego'}
                      </span>
                      {/* Floating Time for reference */}
                      <div className="absolute top-2 right-2 text-[10px] text-muted-foreground/50 font-mono">
                        {time}
                      </div>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-foreground font-mono tracking-tight block">
                      {time}
                    </span>
                  )}
                </div>

                {/* Bottom: Teams Side-by-Side */}
                <div className="grid grid-cols-2 gap-2 p-3 pt-4 items-start">
                  {/* Home Team */}
                  <Link
                    href={`/team/${match.home_id}`}
                    className="flex flex-col items-center text-center gap-2 group/home cursor-pointer"
                  >
                    {match.home_logo && (
                      <div className="relative w-12 h-12 transition-transform group-hover/home:scale-110 duration-200">
                        <Image
                          src={match.home_logo}
                          alt={match.home_team}
                          fill
                          className="object-contain drop-shadow-md"
                          sizes="48px"
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span className="font-display text-base font-bold text-foreground leading-tight group-hover/home:text-blue-400 transition-colors">
                        {match.home_short || getShortTeamName(match.home_team)}
                      </span>
                      {match.home_position && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {match.home_position}º
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Away Team */}
                  <Link
                    href={`/team/${match.away_id}`}
                    className="flex flex-col items-center text-center gap-2 group/away cursor-pointer"
                  >
                    {match.away_logo && (
                      <div className="relative w-12 h-12 transition-transform group-hover/away:scale-110 duration-200">
                        <Image
                          src={match.away_logo}
                          alt={match.away_team}
                          fill
                          className="object-contain drop-shadow-md"
                          sizes="48px"
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span className="font-display text-base font-bold text-foreground leading-tight group-hover/away:text-blue-400 transition-colors">
                        {match.away_short || getShortTeamName(match.away_team)}
                      </span>
                      {match.away_position && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {match.away_position}º
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function NextMatchesCard() {
  const { data, loading } = useApiData('/api/dashboard/next-round');
  const nextRound = data?.nextRound;

  if (loading) {
    // Skeleton for carousel: 4 cards
    return (
      <div className="flex gap-4 overflow-hidden py-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-w-[240px] h-32 rounded-xl bg-card border border-border animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!nextRound?.matches?.length) return null;

  // Group matches by day
  const matchesByDay = nextRound.matches.reduce((acc, match) => {
    const date = match.date ? new Date(match.date) : new Date();
    const dateKey = date.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }); // Grouping key

    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: date,
        matches: [],
      };
    }
    acc[dateKey].matches.push(match);
    return acc;
  }, {});

  const dayGroups = Object.values(matchesByDay);

  return (
    <div className="w-full flex flex-col gap-8">
      {dayGroups.map((group, groupIdx) => {
        const dayName = group.date.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
        return (
          <DayMatchRow
            key={groupIdx}
            dayName={dayName}
            matches={group.matches}
            roundName={nextRound.round_name}
          />
        );
      })}
    </div>
  );
}
