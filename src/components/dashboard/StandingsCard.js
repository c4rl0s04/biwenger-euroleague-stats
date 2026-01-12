'use client';

import Link from 'next/link';
import { Users, ExternalLink, Trophy } from 'lucide-react';
import StandingsTable from './StandingsTable';
import { Card, AnimatedNumber } from '@/components/ui';
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
      icon={Trophy}
      color="yellow"
      className="lg:col-span-1 card-glow h-full flex flex-col"
      actionRight={actionLink}
      loading={loading}
    >
      {!loading && (
        <div className="flex flex-col h-full min-h-0">
          {/* ADDED STYLES HERE:
            - [&_tr]:h-14  -> Forces every table row to be at least 3.5rem (56px) high.
            - [&_td]:py-3  -> Adds vertical padding to table cells for centering and air.
            - [&_table]:border-separate [&_table]:border-spacing-y-1 -> Optional: Use this if you want actual gaps between row backgrounds.
          */}
          <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&_tr]:h-14 [&_td]:py-3">
            <StandingsTable standings={standings} />
          </div>

          <div className="flex-none mt-auto pt-4 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Media Puntos
                </div>
                <div className="text-lg font-bold text-orange-400">
                  {standings.length > 0 ? (
                    <AnimatedNumber
                      value={
                        standings.reduce((acc, u) => acc + (parseInt(u.total_points) || 0), 0) /
                        standings.length
                      }
                      decimals={2}
                      duration={1}
                    />
                  ) : (
                    0
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Valor Liga
                </div>
                <div className="text-lg font-bold text-blue-400">
                  {(
                    standings.reduce((acc, u) => acc + (parseInt(u.team_value) || 0), 0) / 1000000
                  ).toFixed(1)}
                  M€
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
