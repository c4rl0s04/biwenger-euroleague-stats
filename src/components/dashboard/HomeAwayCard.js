'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { Home } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function HomeAwayCard() {
  const { currentUser, isReady } = useClientUser();

  const { data: stats, loading } = useApiData(
    () => (currentUser ? `/api/dashboard/home-away?userId=${currentUser.id}` : null),
    {
      transform: (d) => d?.stats || d,
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  if (!isReady) return null;

  return (
    <Card title="Casa vs Fuera" icon={Home} color="orange" loading={loading}>
      {!loading && stats && (
        <div className="flex-1 flex flex-col">
          {/* Top stats in grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-muted-foreground text-xs mb-1 font-medium">🏠 Casa</div>
              <div className="text-xl font-bold text-foreground">{stats.total_home} pts</div>
              <div className="text-muted-foreground text-xs">Avg: {stats.avg_home}</div>
            </div>

            <div>
              <div className="text-muted-foreground text-xs mb-1 font-medium">✈️ Fuera</div>
              <div className="text-xl font-bold text-foreground">{stats.total_away} pts</div>
              <div className="text-muted-foreground text-xs">Avg: {stats.avg_away}</div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-auto pt-4 border-t border-border/20">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                Diferencia de Rendimiento
              </span>
              <span
                className={`text-2xl font-bold ${stats.difference_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {stats.difference_pct >= 0 ? '+' : ''}
                {stats.difference_pct}%
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
