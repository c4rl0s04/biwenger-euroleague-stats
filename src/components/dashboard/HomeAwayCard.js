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
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-3 border border-border/30 hover:border-cyan-500/30 transition-all flex flex-col justify-center">
            <div className="text-muted-foreground text-xs mb-1 font-medium">🏠 Casa</div>
            <div className="text-xl font-bold text-foreground">{stats.total_home} pts</div>
            <div className="text-muted-foreground text-xs">Avg: {stats.avg_home}</div>
          </div>

          <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-3 border border-border/30 hover:border-cyan-500/30 transition-all flex flex-col justify-center">
            <div className="text-muted-foreground text-xs mb-1 font-medium">✈️ Fuera</div>
            <div className="text-xl font-bold text-foreground">{stats.total_away} pts</div>
            <div className="text-muted-foreground text-xs">Avg: {stats.avg_away}</div>
          </div>

          <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-3 col-span-2 border border-border/30 hover:border-cyan-500/30 transition-all flex flex-col justify-center">
            <div className="text-muted-foreground text-xs mb-1 font-medium">
              Diferencia de Rendimiento
            </div>
            <div
              className={`text-2xl font-bold ${stats.difference_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {stats.difference_pct >= 0 ? '+' : ''}
              {stats.difference_pct}%
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
