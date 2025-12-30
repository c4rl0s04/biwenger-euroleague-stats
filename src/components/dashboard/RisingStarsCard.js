'use client';

import { Sparkles, TrendingUp, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import { getShortTeamName } from '@/lib/utils/format';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function RisingStarsCard() {
  const { data: stars = [], loading } = useApiData('/api/dashboard/rising-stars');

  return (
    <Card title="Estrellas Emergentes" icon={Sparkles} color="emerald" loading={loading}>
      {!loading && (
        <div className="flex-1 flex flex-col justify-between gap-2">
          {stars && stars.length > 0 ? (
            stars.map((player) => (
              <div
                key={player.player_id}
                className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:border-emerald-600/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm flex items-center gap-2">
                      <Link
                        href={`/player/${player.player_id}`}
                        className="hover:text-emerald-400 transition-colors"
                      >
                        {player.name}
                      </Link>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xs text-slate-400">
                      {getShortTeamName(player.team)} · {player.position}
                    </div>
                    {player.owner_name && (
                      <div className="text-xs text-blue-400">👤 {player.owner_name}</div>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-sm font-bold text-emerald-400">
                          +{player.improvement.toFixed(1)}
                        </div>
                        <div className="text-xs text-slate-500">{player.improvement_pct}%</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {player.recent_avg.toFixed(1)} pts/g
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">No hay datos suficientes</div>
          )}
        </div>
      )}
    </Card>
  );
}
