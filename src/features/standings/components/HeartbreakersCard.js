'use client';

import { HeartCrack } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import StatsList from '@/components/ui/StatsList';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function HeartbreakersCard() {
  const { data = [], loading } = useApiData('/api/standings/heartbreakers');

  return (
    <Card
      title="Casi, Casi (Heartbreakers)"
      icon={HeartCrack}
      color="rose"
      loading={loading}
      className="h-full flex flex-col"
    >
      {!loading &&
        (data.length > 0 ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
              <p className="text-xs text-slate-300 font-medium italic px-2">
                Suma de puntos por los que te has quedado{' '}
                <span className="text-rose-400 font-bold not-italic">sin ganar</span> (siendo{' '}
                <span className="text-rose-400 font-bold not-italic">2º</span>).
              </p>
            </div>

            <StatsList
              items={data}
              renderRight={(user) => (
                <div className="flex flex-col items-end pl-2">
                  <div className="flex items-center gap-1">
                    <HeartCrack size={14} className="text-rose-500" />
                    <span className="font-black text-xl text-slate-200">{user.total_diff}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    Perdidos
                  </span>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="text-center text-slate-400 py-8">Sin dolor... todavía</div>
        ))}
    </Card>
  );
}
