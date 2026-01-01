'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function MarketActivityCard() {
  const { currentUser, isReady } = useClientUser();

  const { data, loading } = useApiData(
    () => `/api/dashboard/recent-activity?userId=${currentUser?.id || ''}`,
    { dependencies: [currentUser?.id] }
  );

  if (!isReady) return null;

  const { recentTransfers } = data || {};

  const actionLink = (
    <Link
      href="/market"
      // Changed from purple to pink to match the icon color
      className="text-sm text-pink-400 hover:text-pink-300 transition-colors"
    >
      Ver mercado
    </Link>
  );

  return (
    <Card
      title="Últimos Fichajes"
      icon={ShoppingBag}
      color="pink"
      loading={loading}
      actionRight={actionLink}
      className="card-glow"
    >
      <div className="space-y-0">
        {recentTransfers && recentTransfers.length > 0 ? (
          recentTransfers.slice(0, 5).map((transfer) => (
            <div
              key={transfer.id}
              className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 group/item transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground shrink-0 border border-border">
                {transfer.player_name?.charAt(0) || '?'}
              </div>
              <div className="flex-grow min-w-0">
                <Link
                  href={`/player/${transfer.player_id}`}
                  className="font-medium text-foreground text-base hover:text-pink-400 transition-colors block truncate"
                >
                  {transfer.player_name}
                </Link>
                <div className="text-sm text-muted-foreground flex items-center flex-wrap gap-1 mt-0.5">
                  <span className="text-red-400">{transfer.vendedor || 'Mercado'}</span>
                  <ArrowRight className="w-3 h-3 shrink-0" />
                  <span className="text-green-400">{transfer.comprador}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-foreground text-base">
                  {new Intl.NumberFormat('es-ES').format(transfer.precio)}€
                </div>
                <div className="text-xs text-muted-foreground/70">
                  {new Date(transfer.timestamp * 1000).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">No hay fichajes recientes</div>
        )}
      </div>
    </Card>
  );
}
