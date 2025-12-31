'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function LeagueComparisonCard() {
  const { currentUser, isReady } = useClientUser();

  // Fetch user stats
  const { data: userStats, loading: userLoading } = useApiData(
    () => (currentUser ? `/api/player/stats?userId=${currentUser.id}` : null),
    {
      transform: (d) => d?.stats || d,
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  // Fetch league average
  const { data: leagueData, loading: leagueLoading } = useApiData('/api/league-average', {
    skip: !currentUser,
  });

  if (!isReady) return null;

  const loading = userLoading || leagueLoading;
  const data =
    userStats && leagueData
      ? {
          userAvg: userStats.average_points,
          leagueAvg: leagueData.average,
        }
      : null;

  const difference = data ? data.userAvg - data.leagueAvg : 0;
  const percentage =
    data && data.leagueAvg > 0 ? Math.round((difference / data.leagueAvg) * 100) : 0;

  return (
    <Card title="vs Liga" icon={BarChart3} color="pink" loading={loading}>
      {!loading && data && (
        <div className="space-y-3 flex-1 flex flex-col">
          {/* User vs League averages in grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col justify-center">
              <div className="text-muted-foreground text-[10px] font-medium mb-1 uppercase tracking-wider">
                Tu Promedio
              </div>
              <div className="text-xl font-bold text-orange-500">{data.userAvg}</div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="text-muted-foreground text-[10px] font-medium mb-1 uppercase tracking-wider">
                Promedio Liga
              </div>
              <div className="text-xl font-bold text-muted-foreground">{data.leagueAvg}</div>
            </div>
          </div>

          {/* Difference - compact single box */}
          <div className="mt-auto pt-3 border-t border-border/20 flex flex-col justify-center">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                Diferencia
              </span>
              <div className="text-right">
                <span
                  className={`text-2xl font-bold ${difference >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {difference >= 0 ? '+' : ''}
                  {difference.toFixed(1)}
                </span>
                <span
                  className={`text-sm ml-2 ${percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  ({percentage >= 0 ? '+' : ''}
                  {percentage}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
