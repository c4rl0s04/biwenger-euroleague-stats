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

  const isHero = displayItems.length <= 2;
  const isSingle = displayItems.length === 1;

  return (
    <Card title={title} icon={AlertCircle} color="red" className="h-full">
      <div className="flex flex-col gap-6 py-4 h-full">
        {/* Score indicator - Centered regardless of layout */}
        <div className="flex justify-center -mt-2">
          <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 shadow-sm shadow-red-500/5">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.25em]">
              Peor puntuación: {worstScore}
            </span>
          </div>
        </div>

        <div
          className={`flex-1 flex flex-col justify-center ${
            isHero ? 'items-center gap-6' : 'space-y-4'
          }`}
        >
          {displayItems.map((b, idx) => (
            <div
              key={b.user_id}
              className={`flex items-center transition-all duration-300 ${
                isHero
                  ? 'flex-col text-center gap-3 animate-in fade-in zoom-in-95 duration-500'
                  : 'justify-between px-2 w-full hover:bg-white/[0.02] rounded-xl py-1'
              }`}
            >
              <div className={`flex items-center gap-4 min-w-0 ${isHero ? 'flex-col' : ''}`}>
                {/* Avatar */}
                <div
                  className={`
                    ${isSingle ? 'w-20 h-20' : isHero ? 'w-14 h-14' : 'w-9 h-9'} 
                    rounded-full overflow-hidden shrink-0 border-2 border-white/10 bg-zinc-900 shadow-xl relative
                    group/avatar
                  `}
                >
                  {b.user_icon ? (
                    <img
                      src={
                        b.user_icon.startsWith('http')
                          ? b.user_icon
                          : `https://cdn.biwenger.com/${b.user_icon}`
                      }
                      alt={b.usuario}
                      className="w-full h-full object-cover grayscale-[0.3] group-hover/avatar:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <UserIcon size={isHero ? 24 : 14} />
                    </div>
                  )}
                  {/* Subtle red glow on hover */}
                  <div className="absolute inset-0 bg-red-500/0 group-hover/avatar:bg-red-500/10 transition-colors pointer-events-none" />
                </div>

                <div className={`flex flex-col ${isHero ? 'items-center' : ''} min-w-0`}>
                  <Link
                    href={`/user/${b.user_id}`}
                    className={`
                      ${
                        isSingle
                          ? 'text-3xl sm:text-4xl'
                          : isHero
                            ? 'text-xl sm:text-2xl'
                            : 'text-lg sm:text-xl'
                      } 
                      font-black text-red-500 hover:text-red-400 transition-colors tracking-tighter truncate max-w-full
                    `}
                  >
                    {b.usuario}
                  </Link>

                  {/* Multiplier / Count Label - Visible always in Hero, or only if > 1 in List */}
                  {(isHero || b.count > 1) && (
                    <div
                      className={`
                        flex items-center gap-1.5 px-2 py-0.5 rounded-full mt-1.5
                        ${
                          isHero
                            ? 'bg-red-500/10 border border-red-500/20'
                            : 'bg-black/40 border border-white/5'
                        }
                      `}
                    >
                      <span className="text-[10px] font-black text-red-500/60 font-sans tracking-widest uppercase">
                        Veces:
                      </span>
                      <span className="text-xs font-black text-red-400 tabular-nums">
                        {b.count}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* List Multiplier (Old Style) - Only if not Hero and count > 1 */}
              {!isHero && b.count > 1 && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/5 shadow-inner shrink-0">
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
