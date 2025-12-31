'use client';

import Link from 'next/link';
import { Users, Trophy } from 'lucide-react';
import StandingsTable from './StandingsTable';
import { Card } from '@/components/ui';
import { UserAvatar } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function StandingsCard() {
  const { data = {}, loading } = useApiData('/api/dashboard/standings-preview');
  const standings = data?.standings || [];
  const lastWinner = data?.lastWinner || null;

  const actionLink = (
    <Link href="/standings" className="text-sm text-blue-400 hover:text-blue-300">
      Ver todo
    </Link>
  );

  return (
    <Card
      title="Clasificación"
      icon={Users}
      color="indigo"
      className="lg:col-span-1"
      actionRight={actionLink}
      loading={loading}
    >
      {!loading && (
        <>
          <StandingsTable standings={standings} />

          {/* League Insights Footer */}
          <div className="mt-6 pt-5 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Media Puntos
                </div>
                <div className="text-lg font-bold text-orange-400">
                  {standings.length > 0
                    ? Math.round(
                        standings.reduce((acc, u) => acc + u.total_points, 0) / standings.length
                      )
                    : 0}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Valor Liga
                </div>
                <div className="text-lg font-bold text-blue-400">
                  {(standings.reduce((acc, u) => acc + u.team_value, 0) / 1000000).toFixed(1)}M€
                </div>
              </div>
            </div>

            {lastWinner ? (
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl p-3 border border-yellow-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Ganador {lastWinner.round_name}
                  </span>
                  <Trophy className="w-3 h-3 text-yellow-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar src={lastWinner.icon} alt={lastWinner.name} size={24} />
                    <span className="text-sm font-medium text-foreground">{lastWinner.name}</span>
                  </div>
                  <div className="text-sm font-bold text-yellow-500">{lastWinner.points} pts</div>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </Card>
  );
}
