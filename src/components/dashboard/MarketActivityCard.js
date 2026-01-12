'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, AnimatedNumber } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';
import { getColorForUser } from '@/lib/constants/colors';
import DashboardPlayerRow from './shared/DashboardPlayerRow';

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
      <div className="flex flex-col">
        {recentTransfers && recentTransfers.length > 0 ? (
          recentTransfers.slice(0, 5).map((transfer) => (
            <DashboardPlayerRow
              key={transfer.id}
              playerId={transfer.player_id}
              name={transfer.player_name}
              color="pink"
              avatar={
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground shrink-0 border border-border">
                  {transfer.player_name?.charAt(0) || '?'}
                </div>
              }
              subtitle={
                <div className="flex items-center flex-wrap gap-1 text-xs">
                  {transfer.vendedor_id ? (
                    (() => {
                      const sellerColor = getColorForUser(
                        transfer.vendedor_id,
                        transfer.vendedor,
                        transfer.vendedor_color_index
                      );
                      return (
                        <Link
                          href={`/user/${transfer.vendedor_id}`}
                          className={`${sellerColor.text} hover:opacity-80 transition-colors`}
                        >
                          {transfer.vendedor}
                        </Link>
                      );
                    })()
                  ) : (
                    <span className="text-red-400">{transfer.vendedor || 'Mercado'}</span>
                  )}
                  <ArrowRight className="w-3 h-3 shrink-0 text-muted-foreground" />
                  {transfer.comprador_id ? (
                    (() => {
                      const buyerColor = getColorForUser(
                        transfer.comprador_id,
                        transfer.comprador,
                        transfer.comprador_color_index
                      );
                      return (
                        <Link
                          href={`/user/${transfer.comprador_id}`}
                          className={`${buyerColor.text} hover:opacity-80 transition-colors`}
                        >
                          {transfer.comprador}
                        </Link>
                      );
                    })()
                  ) : (
                    <span className="text-green-400">{transfer.comprador}</span>
                  )}
                </div>
              }
              rightContent={
                <div className="flex flex-col items-end">
                  <div className="font-bold text-foreground text-sm">
                    <AnimatedNumber value={transfer.precio} suffix="€" duration={0.8} />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(transfer.timestamp * 1000).toLocaleDateString()}
                  </div>
                </div>
              }
            />
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">No hay fichajes recientes</div>
        )}
      </div>
    </Card>
  );
}
