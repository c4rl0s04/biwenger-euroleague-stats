// ... imports
import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Award, Target, HelpCircle } from 'lucide-react'; // Added HelpCircle for "Other"
import { getColorForUser } from '@/lib/constants/colors';

/**
 * PerfectRoundsCard - Stacked Bar Chart of efficiency ranges
 */
export default function PerfectRoundsCard({ allUsersHistory = [], users = [], loading = false }) {
  const { perfectData, maxRounds } = useMemo(() => {
    if (!allUsersHistory.length) return { perfectData: [], maxRounds: 0 };

    let max = 0;
    const data = allUsersHistory
      .map(({ userId, history }) => {
        if (!history || history.length === 0) return null;

        const totalRounds = history.length;
        if (totalRounds > max) max = totalRounds;

        const elite = history.filter((r) => r.efficiency >= 95).length;
        const excellent = history.filter((r) => r.efficiency >= 90 && r.efficiency < 95).length;
        const good = history.filter((r) => r.efficiency >= 85 && r.efficiency < 90).length;
        const other = totalRounds - (elite + excellent + good);

        return {
          userId,
          elite,
          excellent,
          good,
          other,
          totalRounds,
          // Sort score: prioritize high efficiency
          score: elite * 100 + excellent * 10 + good,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    return { perfectData: data, maxRounds: max };
  }, [allUsersHistory]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-24 h-4 bg-white/5 rounded" />
            <div className="flex-1 h-6 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!perfectData.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">No hay datos disponibles</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {perfectData.map((data, index) => {
          const user = users.find((u) => u.id === data.userId);
          const userColor = getColorForUser(data.userId, user?.name, user?.color_index);
          const baseColor = userColor.stroke;

          // Width calculations relative to maxRounds to keep scale consistent
          const getWidth = (count) => (count / maxRounds) * 100;

          return (
            <div key={data.userId} className="flex items-center gap-3 group">
              {/* User Info (Left) */}
              <div className="w-28 flex-shrink-0 flex items-center gap-2">
                <div className="text-[10px] text-muted-foreground font-bold w-4">#{index + 1}</div>
                <Link href={`/user/${data.userId}`} className="flex items-center gap-1.5 min-w-0">
                  {user?.icon ? (
                    <Image
                      src={user.icon}
                      alt={user.name}
                      width={18}
                      height={18}
                      unoptimized
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white bg-zinc-700"
                      style={{ backgroundColor: userColor.stroke }}
                    >
                      {user?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <span className={`text-xs font-medium truncate ${userColor.text}`}>
                    {user?.name?.slice(0, 10) || 'User'}
                  </span>
                </Link>
              </div>

              {/* Stacked Bar (Right) */}
              <div className="flex-1 h-6 bg-zinc-900/50 rounded-md overflow-hidden flex relative">
                {/* Elite Segment (95+) */}
                {data.elite > 0 && (
                  <div
                    style={{ width: `${getWidth(data.elite)}%` }}
                    className="h-full bg-yellow-500/90 hover:bg-yellow-500 transition-colors flex items-center justify-center relative group/seg border-r border-black/20"
                  >
                    {getWidth(data.elite) > 8 && (
                      <span className="text-[10px] font-bold text-black/80 shadow-sm">
                        {data.elite}
                      </span>
                    )}
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded hidden group-hover/seg:block whitespace-nowrap z-10 border border-zinc-700">
                      95%+: {data.elite}
                    </div>
                  </div>
                )}

                {/* Excellent Segment (90-94) */}
                {data.excellent > 0 && (
                  <div
                    style={{ width: `${getWidth(data.excellent)}%` }}
                    className="h-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors flex items-center justify-center relative group/seg border-r border-black/10"
                  >
                    {getWidth(data.excellent) > 8 && (
                      <span className="text-[10px] font-bold text-white/90 shadow-sm">
                        {data.excellent}
                      </span>
                    )}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded hidden group-hover/seg:block whitespace-nowrap z-10 border border-zinc-700">
                      90-94%: {data.excellent}
                    </div>
                  </div>
                )}

                {/* Good Segment (85-89) */}
                {data.good > 0 && (
                  <div
                    style={{ width: `${getWidth(data.good)}%` }}
                    className="h-full bg-blue-500/70 hover:bg-blue-500 transition-colors flex items-center justify-center relative group/seg border-r border-black/5"
                  >
                    {getWidth(data.good) > 8 && (
                      <span className="text-[10px] font-bold text-white/90 shadow-sm">
                        {data.good}
                      </span>
                    )}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded hidden group-hover/seg:block whitespace-nowrap z-10 border border-zinc-700">
                      85-89%: {data.good}
                    </div>
                  </div>
                )}

                {/* Other Segment (<85) */}
                {data.other > 0 && (
                  <div
                    style={{ width: `${getWidth(data.other)}%` }}
                    className="h-full bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors flex items-center justify-center relative group/seg"
                  >
                    {/* No label for other usually to keep clean, or maybe very subtle */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded hidden group-hover/seg:block whitespace-nowrap z-10 border border-zinc-700">
                      &lt;85%: {data.other}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-2 border-t border-white/5 text-[10px] text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-yellow-500/90" />
          <span>95%+ (Elite)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/80" />
          <span>90-94% (Excelente)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500/70" />
          <span>85-89% (Bueno)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-zinc-800/50" />
          <span>Resto</span>
        </div>
      </div>
    </div>
  );
}
