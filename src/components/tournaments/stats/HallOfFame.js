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
        const userColor = getColorForUser(winner.id, winner.name, winner.colorIndex);

        return (
          <ElegantCard
            key={winner.id}
            title={isFirst ? 'GRAN CAMPEÓN' : `CAMPEÓN #${index + 1}`}
            icon={Trophy}
            color={isFirst ? 'amber' : 'zinc'}
            className={cn(
              'h-full relative overflow-hidden transition-all duration-500 hover:scale-[1.03]',
              isFirst &&
                'bg-gradient-to-br from-amber-500/10 via-amber-900/5 to-transparent border-amber-500/30'
            )}
          >
            <div className="flex flex-col items-center justify-center gap-4 py-2">
              {/* Avatar */}
              <Link
                href={`/user/${winner.id || winner.name}`}
                className={cn(
                  'relative rounded-full overflow-hidden shrink-0 transition-all duration-500 hover:shadow-2xl active:scale-95 group/avatar',
                  isFirst
                    ? 'w-24 h-24 border-4 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : 'w-20 h-20 border-2 border-white/10'
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
                    <Trophy size={isFirst ? 36 : 28} className="text-zinc-500" />
                  </div>
                )}
                {/* Visual Rank overlay for non-first */}
                {!isFirst && (
                  <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover/avatar:opacity-100 text-white font-black text-xl transition-opacity">
                      #{index + 1}
                    </span>
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="text-center">
                <Link
                  href={`/user/${winner.id || winner.name}`}
                  className="group/name inline-block"
                >
                  <h3
                    className={cn(
                      'font-black font-display tracking-tight mb-1 transition-colors',
                      isFirst ? 'text-3xl text-white' : 'text-xl text-zinc-200',
                      userColor.groupHover
                    )}
                  >
                    {winner.name}
                  </h3>
                </Link>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest',
                      isFirst ? 'bg-amber-500 text-black' : 'bg-white/10 text-zinc-400'
                    )}
                  >
                    {winner.titles} Título{winner.titles !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Tournaments List */}
              <div className="mt-4 flex flex-wrap justify-center gap-2 px-2 max-w-full">
                {winner.tournaments.map((t, i) => (
                  <span
                    key={i}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-lg font-bold transition-all duration-300 uppercase tracking-tight border shadow-sm',
                      isFirst
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : 'bg-white/5 text-zinc-500 border-white/5',
                      !isFirst &&
                        userColor.text
                          .replace('text-', 'bg-')
                          .concat('/10 border-')
                          .concat(userColor.text.replace('text-', ''))
                          .concat('/20 ') + userColor.text
                    )}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Background elements for first place */}
            {isFirst && (
              <>
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-600/5 blur-[50px] pointer-events-none" />
              </>
            )}
          </ElegantCard>
        );
      })}
    </div>
  );
}
