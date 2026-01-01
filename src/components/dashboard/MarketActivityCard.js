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
      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
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
    >
      <div className="space-y-0">
        {recentTransfers && recentTransfers.length > 0 ? (
          recentTransfers.slice(0, 5).map((transfer) => (
            <div
              key={transfer.id}
              className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 group/item transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0 border border-border">
                {transfer.player_name?.charAt(0) || '?'}
              </div>
              <div className="flex-grow min-w-0">
                <Link
                  href={`/player/${transfer.player_id}`}
                  className="font-medium text-foreground text-sm hover:text-pink-400 transition-colors block truncate"
                >
                  {transfer.player_name}
                </Link>
                <div className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                  <span className="text-red-400 truncate max-w-[80px]">
                    {transfer.vendedor || 'Mercado'}
                  </span>
                  <ArrowRight className="w-3 h-3 shrink-0" />
                  <span className="text-green-400 truncate max-w-[80px]">{transfer.comprador}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-foreground text-sm">
                  {new Intl.NumberFormat('es-ES').format(transfer.precio)}€
                </div>
                <div className="text-[10px] text-muted-foreground/70">
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
