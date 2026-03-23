'use client';

import { Trophy } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';
import { cn } from '@/lib/utils';

export function HallOfFame({ winners }) {
  if (!winners || winners.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {winners.map((winner, index) => {
        const isFirst = index === 0;
        const isSecond = index === 1;
        const isThird = index === 2;

        // Rank-based color logic (Gold, Silver, Bronze)
        const rankColor = isFirst ? 'amber' : isSecond ? 'zinc' : isThird ? 'orange' : 'zinc';
        const rankTitle = isFirst
          ? '1º PUESTO'
          : isSecond
            ? '2º PUESTO'
            : isThird
              ? '3º PUESTO'
              : `#${index + 1} PUESTO`;

        return (
          <ElegantCard
            key={winner.id}
            title={rankTitle}
            icon={Trophy}
            color={rankColor}
            bgColor={rankColor}
            className="h-full relative overflow-hidden transition-all duration-500 hover:scale-[1.03]"
          >
            <div className="flex flex-col items-center justify-center gap-5 py-3">
              {/* Avatar - Unified Size */}
              <Link
                href={`/user/${winner.id || winner.name}`}
                className={cn(
                  'relative w-24 h-24 rounded-full overflow-hidden shrink-0 transition-all duration-500 hover:shadow-2xl active:scale-95 group/avatar border-2',
                  isFirst
                    ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'border-white/10 shadow-lg'
                )}
              >
                {winner.icon ? (
                  <img
                    src={
                      winner.icon.startsWith('http')
                        ? winner.icon
                        : `https://cdn.biwenger.com/${winner.icon}`
                    }
                    alt={winner.name}
                    className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <Trophy size={32} className="text-zinc-500" />
                  </div>
                )}
              </Link>

              {/* Info - Unified Typography */}
              <div className="text-center">
                <Link
                  href={`/user/${winner.id || winner.name}`}
                  className="group/name inline-block"
                >
                  <h3 className="font-black font-display tracking-tight text-2xl text-white mb-1 group-hover/name:text-primary transition-colors">
                    {winner.name}
                  </h3>
                </Link>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span
                    className={cn(
                      'px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border',
                      isFirst
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-white/5 text-zinc-400 border-white/5'
                    )}
                  >
                    {winner.titles} Título{winner.titles !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Tournaments List - Unified Styling */}
              <div className="mt-2 flex flex-wrap justify-center gap-2 px-2 max-w-full">
                {winner.tournaments.map((t, i) => (
                  <span
                    key={i}
                    className={cn(
                      'text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all duration-300 uppercase tracking-tight border shadow-sm',
                      isFirst
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : isSecond
                          ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          : isThird
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            : 'bg-white/5 text-zinc-500 border-white/5'
                    )}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </ElegantCard>
        );
      })}
    </div>
  );
}
