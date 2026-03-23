import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { getColorForUser } from '@/lib/constants/colors';
import { cn } from '@/lib/utils';

export function HallOfFame({ winners }) {
  if (!winners || winners.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {winners.map((winner, index) => {
        const isFirst = index === 0;
        const userColor = getColorForUser(winner.id, winner.name, winner.colorIndex);

        return (
          <div
            key={winner.id}
            className={`relative overflow-hidden rounded-xl border p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 ${
              isFirst
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-900/20 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                : 'bg-card/40 border-white/5 hover:bg-card/60'
            }`}
          >
            {/* Rank Badge */}
            <div
              className={`absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded-full ${
                isFirst ? 'bg-amber-500 text-black' : 'bg-white/10 text-zinc-400'
              }`}
            >
              #{index + 1}
            </div>

            {/* Avatar */}
            <Link
              href={`/user/${winner.id || winner.name}`}
              className={`relative rounded-full overflow-hidden shrink-0 transition-transform active:scale-95 ${
                isFirst
                  ? 'w-20 h-20 border-4 border-amber-500 shadow-xl'
                  : 'w-16 h-16 border-2 border-white/10'
              }`}
            >
              {winner.icon ? (
                <img
                  src={
                    winner.icon.startsWith('http')
                      ? winner.icon
                      : `https://cdn.biwenger.com/${winner.icon}`
                  }
                  alt={winner.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <Trophy size={isFirst ? 32 : 24} className="text-zinc-500" />
                </div>
              )}
            </Link>

            {/* Info */}
            <div className="text-center">
              <Link href={`/user/${winner.id || winner.name}`} className="group/name">
                <h3
                  className={cn(
                    'font-black font-display tracking-tight mb-1 transition-colors',
                    isFirst ? 'text-2xl text-white' : 'text-lg text-zinc-200',
                    userColor.groupHover
                  )}
                >
                  {winner.name}
                </h3>
              </Link>
              <div className="flex items-center justify-center gap-2">
                <Trophy size={14} className={isFirst ? 'text-amber-500' : 'text-zinc-500'} />
                <span className={`font-bold ${isFirst ? 'text-amber-500' : 'text-zinc-400'}`}>
                  {winner.titles} Título{winner.titles !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Tournaments List */}
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 px-2">
              {winner.tournaments.map((t, i) => (
                <span
                  key={i}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-md font-bold transition-colors uppercase tracking-tight',
                    isFirst
                      ? 'bg-amber-500/10 text-amber-500/80 border border-amber-500/20'
                      : 'bg-white/5 text-zinc-500 border border-white/5',
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
        );
      })}
    </div>
  );
}
