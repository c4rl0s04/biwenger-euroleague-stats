'use client';

import { Calendar } from 'lucide-react';
import { useApiData } from '@/lib/hooks/useApiData';
import { getShortTeamName } from '@/lib/utils/format';
// import { getTeamLogo } from '@/lib/utils/teams'; // Database now handles logos

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

  return (
    <div className="w-full">
      {/* Container with horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
        {nextRound.matches.map((match, idx) => {
          const date = new Date(match.date);
          const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
          const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

          const isEuroleague = true; // Assuming all matches are EL in this context

          return (
            <div
              key={idx}
              className="snap-center shrink-0 min-w-[260px] bg-card border border-border/50 rounded-xl p-4 hover:border-blue-500/30 transition-colors group relative overflow-hidden"
            >
              {/* Card Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Date Header */}
              <div className="flex justify-between items-center mb-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                <span className="text-blue-400">{dayName}</span>
                <span>{time}</span>
              </div>

              {/* Teams */}
              <div className="space-y-3">
                {/* Home */}
                <div className="flex justify-between items-center group/home">
                  <div className="flex items-center gap-3">
                    {match.home_logo && (
                      <img
                        src={match.home_logo}
                        alt={match.home_team}
                        className="w-8 h-8 object-contain"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    )}
                    <span className="font-display text-lg text-foreground group-hover/home:text-blue-400 transition-colors">
                      {match.home_short || getShortTeamName(match.home_team)}
                    </span>
                  </div>
                  {match.home_score !== null && (
                    <span className="font-mono text-lg">{match.home_score}</span>
                  )}
                </div>

                {/* Away */}
                <div className="flex justify-between items-center group/away">
                  <div className="flex items-center gap-3">
                    {match.away_logo && (
                      <img
                        src={match.away_logo}
                        alt={match.away_team}
                        className="w-8 h-8 object-contain"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    )}
                    <span className="font-display text-lg text-foreground group-hover/away:text-blue-400 transition-colors">
                      {match.away_short || getShortTeamName(match.away_team)}
                    </span>
                  </div>
                  {match.away_score !== null && (
                    <span className="font-mono text-lg">{match.away_score}</span>
                  )}
                </div>
              </div>

              {/* VS Divider (Decorative) */}
              {match.home_score === null && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[40px] font-display text-white/5 pointer-events-none">
                  VS
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
