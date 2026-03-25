'use client';

import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { getScoreColor, getShortTeamName } from '@/lib/utils/format';
import { Card, AnimatedNumber, StatsList } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function MarketOpportunitiesCard() {
  const { data: players = [], loading } = useApiData('/api/dashboard/market-opportunities');

  return (
    <Card
      title="Oportunidades"
      icon={ShoppingCart}
      color="blue"
      loading={loading}
      className="card-glow"
    >
      <StatsList
        items={!loading && players && players.length > 0 ? players.slice(0, 5) : []}
        emptyMessage="No hay chollos ahora"
        renderLeft={(player, idx) => (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-slate-500 font-mono text-base font-black w-5 shrink-0 tabular-nums">
              {idx + 1}
            </span>

            <div className="min-w-0 flex flex-col justify-center">
              <Link
                href={`/player/${player.player_id}`}
                className="font-bold text-sm text-white truncate hover:text-blue-500 transition-colors leading-tight"
              >
                {player.name}
              </Link>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                <span className="truncate">{getShortTeamName(player.team)}</span>
                <span className="opacity-30">•</span>
                <span className="text-blue-400 font-mono font-bold tracking-tight">
                  <AnimatedNumber value={Number(player.price)} suffix="€" duration={0.8} />
                </span>
              </div>
              <div className="flex gap-1 mt-1">
                {player.recent_scores &&
                  player.recent_scores.split(',').map((score, i) => (
                    <span
                      key={i}
                      className={`text-[9px] px-1 py-0.5 rounded border leading-none font-bold ${getScoreColor(score)}`}
                    >
                      {score}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}
        renderRight={(player) => (
          <div className="flex flex-col items-end justify-center min-w-[60px]">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">
              Reciente
            </span>
            <span className="text-green-400 font-bold text-base tabular-nums leading-none">
              <AnimatedNumber
                value={parseFloat(player.avg_recent_points)}
                decimals={1}
                duration={0.8}
              />
            </span>
          </div>
        )}
      />
    </Card>
  );
}
