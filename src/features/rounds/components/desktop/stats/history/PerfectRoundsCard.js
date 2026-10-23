import { Skeleton } from '@/components/ui/foundation';
// ... imports
import { useMemo } from 'react';
import { Popover } from '@/components/ui/foundation';
import { Star } from 'lucide-react';
import { RoundRankingList } from '../../../RoundRankingList';

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
            <Skeleton className="w-24 h-4 bg-secondary rounded" />
            <Skeleton className="flex-1 h-6 bg-secondary rounded" />
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
      <RoundRankingList
        items={items}
        renderRight={(data) => (
          <div className="w-32 sm:w-40 xl:w-48 h-5 bg-secondary/50 rounded overflow-hidden flex relative border border-border">
            {[
              { key: 'elite', label: '95%+', tone: 'bg-yellow-500 text-black' },
              { key: 'excellent', label: '90-94%', tone: 'bg-emerald-700 text-white' },
              { key: 'good', label: '85-89%', tone: 'bg-blue-700 text-white' },
              { key: 'other', label: '<85%', tone: 'bg-secondary text-foreground' },
            ]
              .filter((segment) => data[segment.key] > 0)
              .map((segment) => (
                <div
                  key={segment.key}
                  style={{ width: `${getWidth(data[segment.key])}%` }}
                  className="h-full"
                >
                  <Popover
                    label={`${data.name}: ${segment.label}, ${data[segment.key]} jornadas`}
                    className={`flex h-full w-full items-center justify-center text-xs font-semibold ${segment.tone}`}
                    trigger={
                      getWidth(data[segment.key]) > 8 ? (
                        data[segment.key]
                      ) : (
                        <span className="sr-only">{segment.label}</span>
                      )
                    }
                  >
                    <p className="font-semibold">{data.name}</p>
                    <p>
                      {segment.label}: {data[segment.key]} jornadas
                    </p>
                  </Popover>
                </div>
              ))}
          </div>
        )}
      />

      {/* Legend */}
      <div className="flex items-center justify-center gap-x-4 gap-y-1.5 pt-3 mt-auto border-t border-border text-[9px] text-muted-foreground flex-wrap uppercase font-bold tracking-tighter">
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
          <div className="w-2 h-2 rounded-[1px] bg-secondary/30" />
          <span>Resto</span>
        </div>
      </div>
    </div>
  );
}
