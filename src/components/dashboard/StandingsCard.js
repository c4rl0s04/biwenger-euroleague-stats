'use client';

import Link from 'next/link';
import { Users, ExternalLink, Trophy } from 'lucide-react';
import StandingsTable from './StandingsTable';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function StandingsCard() {
  const { data = {}, loading } = useApiData('/api/dashboard/standings-preview');
  const standings = data?.standings || [];

  const actionLink = (
    <Link href="/standings" className="text-sm text-blue-400 hover:text-blue-300">
      Ver todo
    </Link>
  );

  return (
    <Card
      title="Clasificación"
      icon={Trophy} // Changed icon
      color="yellow" // Changed color
      className="lg:col-span-1 card-glow h-full" // Added card-glow h-full
      actionRight={actionLink}
      loading={loading}
    >
      {!loading && (
        <>
          <StandingsTable standings={standings} />

          {/* League Insights Footer */}
          <div className="mt-6 pt-5 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4">
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
          </div>
        </>
      )}
    </Card>
  );
}
