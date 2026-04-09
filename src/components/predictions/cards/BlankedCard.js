import { AlertCircle, User as UserIcon } from 'lucide-react';
import { Card } from '@/components/ui';
import Link from 'next/link';

export function BlankedCard({ achievements }) {
  const blanked = achievements?.blanked || [];

  if (blanked.length === 0) return null;

  const worstScore = blanked[0].aciertos;
  const isZero = worstScore === 0;
  const title = isZero ? 'Blanked' : 'Farolillo Rojo';

  // Group by user to avoid repetition and count occurrences
  const groupedUsers = blanked.reduce((acc, current) => {
    const existing = acc.find((item) => item.user_id === current.user_id);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({
        ...current,
        count: 1,
      });
    }
    return acc;
  }, []);

  // Sort by count (descending) so most frequent "losers" are on top
  const sortedUsers = groupedUsers.sort((a, b) => b.count - a.count);
  const displayItems = sortedUsers.slice(0, 5);

  const isCrowded = displayItems.length > 2;
  const nameSizeClass = isCrowded ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl';

  return (
    <Card title={title} icon={AlertCircle} color="red" className="h-full">
      <div className="flex flex-col gap-5 py-4">
        {/* Score indicator */}
        <div className="flex justify-center -mt-2">
          <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">
              Peor puntuación: {worstScore}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {displayItems.map((b, idx) => (
            <div key={b.user_id} className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3 min-w-0">
                {/* Micro Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 bg-zinc-900">
                  {b.user_icon ? (
                    <img
                      src={
                        b.user_icon.startsWith('http')
                          ? b.user_icon
                          : `https://cdn.biwenger.com/${b.user_icon}`
                      }
                      alt={b.usuario}
                      className="w-full h-full object-cover grayscale-[0.2]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <UserIcon size={12} />
                    </div>
                  )}
                </div>

                <Link
                  href={`/user/${b.user_id}`}
                  className={`${nameSizeClass} font-black text-red-500 hover:text-red-400 transition-colors tracking-tight truncate`}
                >
                  {b.usuario}
                </Link>
              </div>

              {/* Multiplier / Count Symbol */}
              {b.count > 1 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/5 shadow-inner shrink-0">
                  <span className="text-[10px] font-black text-red-400/60 font-mono tracking-tighter">
                    ×
                  </span>
                  <span className="text-sm font-black text-red-400 tabular-nums">{b.count}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {sortedUsers.length > 5 && (
          <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-widest pt-2 border-t border-white/5">
            +{sortedUsers.length - 5} managers más
          </p>
        )}
      </div>
    </Card>
  );
}
