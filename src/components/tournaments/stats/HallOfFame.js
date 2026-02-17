import { Trophy } from 'lucide-react';

export function HallOfFame({ winners }) {
  if (!winners || winners.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {winners.map((winner, index) => {
        const isFirst = index === 0;
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
            <div
              className={`relative rounded-full overflow-hidden shrink-0 ${
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
            </div>

            {/* Info */}
            <div className="text-center">
              <h3
                className={`font-black font-display tracking-tight mb-1 ${
                  isFirst ? 'text-2xl text-white' : 'text-lg text-zinc-200'
                }`}
              >
                {winner.name}
              </h3>
              <div className="flex items-center justify-center gap-2">
                <Trophy size={14} className={isFirst ? 'text-amber-500' : 'text-zinc-500'} />
                <span className={`font-bold ${isFirst ? 'text-amber-500' : 'text-zinc-400'}`}>
                  {winner.titles} Título{winner.titles !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Tournaments List (Small) */}
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {winner.tournaments.slice(0, 3).map((t, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 truncate max-w-[150px]"
                >
                  {t}
                </span>
              ))}
              {winner.tournaments.length > 3 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-500">
                  +{winner.tournaments.length - 3}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
