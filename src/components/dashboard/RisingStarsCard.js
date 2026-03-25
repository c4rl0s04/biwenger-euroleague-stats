'use client';

import { Sparkles, TrendingUp, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import { getShortTeamName } from '@/lib/utils/format';
import { Card, AnimatedNumber, StatsList } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function RisingStarsCard() {
  const { data: stars = [], loading } = useApiData('/api/dashboard/rising-stars');

  return (
    <Card title="Estrellas Emergentes" icon={Sparkles} color="emerald" loading={loading}>
      <StatsList
        items={!loading && stars && stars.length > 0 ? stars.slice(0, 6) : []}
        emptyMessage="No hay datos suficientes"
        renderLeft={(player) => (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="rounded-full p-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <Link
                href={`/player/${player.id}`}
                className="font-bold text-sm text-white truncate hover:text-emerald-400 transition-colors leading-tight"
              >
                {player.name}
              </Link>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                <span className="truncate">{getShortTeamName(player.team)}</span>
                <span className="opacity-30">•</span>
                <span className="truncate">{player.position}</span>
                {player.owner_name && (
                  <>
                    <span className="opacity-30">•</span>
                    <span className="text-blue-400 font-bold">👤 {player.owner_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        renderRight={(player) => (
          <div className="flex flex-col items-end justify-center min-w-[70px]">
            <div className="flex items-center gap-1 text-emerald-400">
              <ArrowUp className="w-3 h-3" />
              <span className="font-bold text-base leading-none">
                <AnimatedNumber
                  value={parseFloat(player.improvement)}
                  decimals={1}
                  duration={0.8}
                />
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              <AnimatedNumber
                value={parseFloat(player.improvement_pct)}
                decimals={1}
                duration={0.8}
              />
              % mejora
            </div>
          </div>
        )}
      />
    </Card>
  );
}
