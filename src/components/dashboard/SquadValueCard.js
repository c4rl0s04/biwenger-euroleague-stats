'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import Link from 'next/link';
import { PremiumCard } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

/**
 * SquadValueCard - Redesigned with Bento Grid architecture
 * Zone 1: Dominant hero value display
 * Zone 2: Rising/Falling players (condensed list)
 */
export default function SquadValueCard() {
  const { currentUser, isReady } = useClientUser();

  const { data, loading } = useApiData(
    () => (currentUser ? `/api/player/squad?userId=${currentUser.id}` : null),
    {
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  if (!isReady) return null;

  const formatPrice = (price) => new Intl.NumberFormat('es-ES').format(price);

  return (
    <PremiumCard title="Tu Plantilla" icon={Wallet} color="cyan" loading={loading}>
      {!loading && data && (
        <div className="flex flex-col h-full flex-1">
          {/* Zone 1: Hero Value - Large and dominant */}
          <div className="mb-6">
            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
              Valor Total
            </div>
            <div className="text-5xl font-display text-foreground">
              {formatPrice(data.total_value)}€
            </div>
            <div
              className={`flex items-center gap-1.5 mt-2 text-lg font-semibold ${
                data.price_trend >= 0 ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {data.price_trend >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              {data.price_trend >= 0 ? '+' : ''}
              {formatPrice(data.price_trend)}€
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-border/50 my-4"></div>

          {/* Zone 2: Rising & Falling - Stacked vertically */}
          <div className="flex flex-col gap-4 flex-1">
            {/* Rising Players */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider mb-2">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                Más suben
              </div>
              <div className="space-y-1.5">
                {data.top_rising?.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <Link
                      href={`/player/${p.id}`}
                      className="text-muted-foreground text-sm truncate hover:text-emerald-500 transition-colors flex-1 mr-2"
                    >
                      {p.name}
                    </Link>
                    <span className="text-emerald-500 font-semibold text-sm">
                      +{formatPrice(p.price_increment)}€
                    </span>
                  </div>
                ))}
                {(!data.top_rising || data.top_rising.length === 0) && (
                  <div className="text-muted-foreground/50 text-xs">Sin datos</div>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-border/50"></div>

            {/* Falling Players */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider mb-2">
                <TrendingDown className="w-3 h-3 text-red-500" />
                Más bajan
              </div>
              <div className="space-y-1.5">
                {data.top_falling?.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <Link
                      href={`/player/${p.id}`}
                      className="text-muted-foreground text-sm truncate hover:text-red-500 transition-colors flex-1 mr-2"
                    >
                      {p.name}
                    </Link>
                    <span className="text-red-500 font-semibold text-sm">
                      {formatPrice(p.price_increment)}€
                    </span>
                  </div>
                ))}
                {(!data.top_falling || data.top_falling.length === 0) && (
                  <div className="text-muted-foreground/50 text-xs">Sin datos</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PremiumCard>
  );
}
