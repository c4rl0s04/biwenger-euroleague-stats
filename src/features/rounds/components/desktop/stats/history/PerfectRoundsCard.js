// ... imports
import { useMemo } from 'react';
import { Star } from 'lucide-react';
import StatsList from '@/components/ui/StatsList';

/**
 * PerfectRoundsCard - Efficiency range distribution using StatsList
 */
export default function PerfectRoundsCard({ allUsersHistory = [], users = [], loading = false }) {
  const { items, maxRounds } = useMemo(() => {
    if (!allUsersHistory.length) return { items: [], maxRounds: 0 };

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

        const user = users.find((u) => u.id === userId);

        return {
          id: userId,
          user_id: userId,
          name: user?.name || 'User',
          icon: user?.icon,
          color_index: user?.color_index,
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

    return { items: data, maxRounds: max };
  }, [allUsersHistory, users]);

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

  if (!items.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">No hay datos disponibles</div>
    );
  }

  // Width calculations relative to maxRounds to keep scale consistent
  const getWidth = (count) => (count / maxRounds) * 100;

  return (
    <div className="flex flex-col h-full">
      <StatsList
        items={items}
        renderRight={(data) => (
          <div className="w-48 sm:w-80 h-5 bg-zinc-900/50 rounded overflow-hidden flex relative border border-white/5">
            {/* Elite Segment (95+) */}
            {data.elite > 0 && (
              <div
                style={{ width: `${getWidth(data.elite)}%` }}
                className="h-full bg-yellow-500/90 hover:bg-yellow-500 transition-colors flex items-center justify-center relative group/seg border-r border-black/20"
              >
                {getWidth(data.elite) > 8 && (
                  <span className="text-[11px] font-black text-black/90">{data.elite}</span>
                )}
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded hidden group-hover/seg:block whitespace-nowrap z-20 border border-zinc-700 shadow-xl">
                  95%+: {data.elite} jor.
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
                  <span className="text-[11px] font-black text-white">{data.excellent}</span>
                )}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded hidden group-hover/seg:block whitespace-nowrap z-20 border border-zinc-700 shadow-xl">
                  90-94%: {data.excellent} jor.
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
                  <span className="text-[11px] font-black text-white">{data.good}</span>
                )}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded hidden group-hover/seg:block whitespace-nowrap z-20 border border-zinc-700 shadow-xl">
                  85-89%: {data.good} jor.
                </div>
              </div>
            )}

            {/* Other Segment (<85) */}
            {data.other > 0 && (
              <div
                style={{ width: `${getWidth(data.other)}%` }}
                className="h-full bg-zinc-800/30 hover:bg-zinc-700/50 transition-colors flex items-center justify-center relative group/seg"
              >
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded hidden group-hover/seg:block whitespace-nowrap z-20 border border-zinc-700 shadow-xl">
                  &lt;85%: {data.other} jor.
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Legend */}
      <div className="flex items-center justify-center gap-x-4 gap-y-1.5 pt-3 mt-auto border-t border-white/5 text-[9px] text-muted-foreground flex-wrap uppercase font-bold tracking-tighter">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-[1px] bg-yellow-500/90" />
          <span>95%+ Elite</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-[1px] bg-emerald-500/80" />
          <span>90-94% Excel.</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-[1px] bg-blue-500/70" />
          <span>85-89% Bueno</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-[1px] bg-zinc-800/30" />
          <span>Resto</span>
        </div>
      </div>
    </div>
  );
}
